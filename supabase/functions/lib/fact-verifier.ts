/**
 * Fact Verification Layer
 * Verifies claims made by agents using multi-source cross-validation
 *
 * Based on 2025 research:
 * - Multi-agent verification patterns (arXiv 2505.17511)
 * - RAG with external source validation
 * - Cross-source confidence scoring
 *
 * Architecture: KISS + DRY + SOLID
 * - Reuses existing tool infrastructure
 * - Simple claim extraction and verification
 * - No unnecessary complexity
 */

import { ToolRegistry } from '../tools/registry.ts';
import { callOpenRouter } from './openrouter-client.ts';

export interface Claim {
  text: string; // The claim being made
  type: 'technical' | 'factual' | 'recommendation'; // Claim classification
  context: string; // Surrounding context
  importance: 'critical' | 'important' | 'minor'; // Impact if incorrect
}

export interface VerificationResult {
  claim: string;
  verified: boolean;
  confidence: number; // 0-100
  sources: Array<{
    url?: string;
    snippet: string;
    supports: boolean; // Does this source support or refute the claim?
  }>;
  verdict: 'verified' | 'refuted' | 'unverifiable' | 'partially-true';
  reasoning: string;
}

export interface VerificationReport {
  agentId: string;
  agentName: string;
  overallConfidence: number; // 0-100
  verifications: VerificationResult[];
  claimsChecked: number;
  claimsVerified: number;
  claimsRefuted: number;
  duration: number;
  cost: number;
}

/**
 * Extract verifiable claims from agent findings
 * Uses LLM to identify specific, factual claims that can be verified
 */
export async function extractClaims(
  findings: string,
  agentName: string
): Promise<Claim[]> {
  try {
    const response = await callOpenRouter({
      model: 'gpt-5.1', // Good at structured extraction
      messages: [
        {
          role: 'system',
          content: 'Extract specific, verifiable claims from research findings. Focus on factual statements, not opinions. Return ONLY valid JSON array.'
        },
        {
          role: 'user',
          content: `Extract verifiable claims from these findings by ${agentName}:

${findings}

Return JSON array:
[
  {
    "text": "Specific claim (e.g., 'React 19 includes automatic batching')",
    "type": "technical" | "factual" | "recommendation",
    "context": "Surrounding context from findings",
    "importance": "critical" | "important" | "minor"
  }
]

Focus on:
- Technology versions and features
- Performance benchmarks
- Compatibility claims
- Security vulnerabilities
- Release dates
- API changes

Skip opinions and subjective recommendations.
Limit to 5 most important claims.`
        }
      ],
      temperature: 0.3,
      maxTokens: 800
    });

    // Parse claims from response
    let jsonContent = response.content;
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const claims = JSON.parse(jsonContent);
    return Array.isArray(claims) ? claims : [];
  } catch (error) {
    console.error('[FactVerifier] Failed to extract claims:', error);
    return [];
  }
}

/**
 * Verify a single claim using multi-source validation
 * Cross-references claim against web search and Exa neural search
 */
export async function verifyClaim(
  claim: Claim,
  tools: ToolRegistry
): Promise<VerificationResult> {
  console.log(`[FactVerifier] Verifying: ${claim.text}`);

  const sources: Array<{ url?: string; snippet: string; supports: boolean }> = [];
  let totalCost = 0;

  try {
    // Search for evidence using existing tools (DRY principle)
    const searchQuery = `${claim.text} ${claim.context.slice(0, 50)}`;

    // Use web_search for recent validation
    const webResult = await tools.execute('web_search', {
      query: searchQuery,
      numResults: 3
    });

    if (webResult.success && webResult.data.results) {
      webResult.data.results.forEach((result: any) => {
        sources.push({
          url: result.url,
          snippet: result.snippet || result.content?.slice(0, 200) || '',
          supports: true // Will be evaluated by LLM
        });
      });
    }

    // If no web results or high-importance claim, use Exa for deeper validation
    if (sources.length === 0 || claim.importance === 'critical') {
      const exaResult = await tools.execute('exa_search', {
        query: searchQuery,
        numResults: 2,
        startPublishedDate: '2025-01-01' // Only recent sources
      });

      if (exaResult.success && exaResult.data.results) {
        exaResult.data.results.forEach((result: any) => {
          sources.push({
            url: result.url,
            snippet: result.text?.slice(0, 200) || '',
            supports: true
          });
        });
      }
    }

    // If no sources found, claim is unverifiable
    if (sources.length === 0) {
      return {
        claim: claim.text,
        verified: false,
        confidence: 0,
        sources: [],
        verdict: 'unverifiable',
        reasoning: 'No sources found to verify this claim'
      };
    }

    // Use LLM to evaluate source agreement (cross-validation)
    const sourcesText = sources.map((s, idx) =>
      `Source ${idx + 1}: ${s.snippet}`
    ).join('\n\n');

    const evaluation = await callOpenRouter({
      model: 'claude-sonnet-4.5', // Best for nuanced reasoning
      messages: [
        {
          role: 'system',
          content: 'You are a fact-checker. Evaluate if sources support, refute, or partially support a claim. Be precise and cite evidence. Return ONLY valid JSON.'
        },
        {
          role: 'user',
          content: `Claim: ${claim.text}

Context: ${claim.context}

Sources:
${sourcesText}

Evaluate:
1. Do sources support, refute, or partially support the claim?
2. Confidence level (0-100) based on source agreement
3. Verdict: "verified" | "refuted" | "partially-true" | "unverifiable"

Return JSON:
{
  "verdict": "verified",
  "confidence": 85,
  "reasoning": "Brief explanation citing sources",
  "sourcesSupport": [true, true, false]
}`
        }
      ],
      temperature: 0.2, // Low temperature for consistent evaluation
      maxTokens: 300
    });

    totalCost += evaluation.cost;

    // Parse evaluation
    let jsonContent = evaluation.content;
    const jsonMatch = evaluation.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const result = JSON.parse(jsonContent);

    // Update source support flags
    if (result.sourcesSupport && Array.isArray(result.sourcesSupport)) {
      result.sourcesSupport.forEach((supports: boolean, idx: number) => {
        if (sources[idx]) {
          sources[idx].supports = supports;
        }
      });
    }

    return {
      claim: claim.text,
      verified: result.verdict === 'verified',
      confidence: result.confidence || 50,
      sources,
      verdict: result.verdict || 'unverifiable',
      reasoning: result.reasoning || 'Unable to determine verdict'
    };
  } catch (error) {
    console.error(`[FactVerifier] Verification failed for claim:`, error);
    return {
      claim: claim.text,
      verified: false,
      confidence: 0,
      sources,
      verdict: 'unverifiable',
      reasoning: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Verify all claims in agent findings
 * Main entry point for fact-checking
 */
export async function verifyAgentFindings(
  agentId: string,
  agentName: string,
  findings: string,
  tools: ToolRegistry
): Promise<VerificationReport> {
  const startTime = Date.now();
  console.log(`[FactVerifier] Verifying findings from ${agentName}`);

  // Step 1: Extract claims
  const claims = await extractClaims(findings, agentName);
  console.log(`[FactVerifier] Extracted ${claims.length} claims`);

  if (claims.length === 0) {
    return {
      agentId,
      agentName,
      overallConfidence: 100, // No claims = nothing to refute
      verifications: [],
      claimsChecked: 0,
      claimsVerified: 0,
      claimsRefuted: 0,
      duration: Date.now() - startTime,
      cost: 0
    };
  }

  // Step 2: Verify each claim (in parallel for speed - YAGNI principle)
  const verifications = await Promise.all(
    claims.map(claim => verifyClaim(claim, tools))
  );

  // Step 3: Calculate overall confidence
  const claimsVerified = verifications.filter(v => v.verified).length;
  const claimsRefuted = verifications.filter(v => v.verdict === 'refuted').length;

  // Weighted confidence: verified claims increase, refuted claims decrease
  const avgConfidence = verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length;
  const verificationRate = claimsVerified / claims.length;
  const refutationPenalty = claimsRefuted * 20; // Each refuted claim -20 points

  const overallConfidence = Math.max(
    0,
    Math.min(100, avgConfidence * verificationRate - refutationPenalty)
  );

  const report: VerificationReport = {
    agentId,
    agentName,
    overallConfidence: Math.round(overallConfidence),
    verifications,
    claimsChecked: claims.length,
    claimsVerified,
    claimsRefuted,
    duration: Date.now() - startTime,
    cost: 0 // Cost tracked by tools
  };

  console.log(`[FactVerifier] ✓ ${agentName} verification complete`);
  console.log(`[FactVerifier]   Confidence: ${report.overallConfidence}%`);
  console.log(`[FactVerifier]   Verified: ${claimsVerified}/${claims.length}`);
  console.log(`[FactVerifier]   Refuted: ${claimsRefuted}`);

  return report;
}

/**
 * Batch verify multiple agent findings in parallel
 */
export async function verifyAllAgents(
  agentResults: Array<{ expertId: string; expertName: string; findings: string }>,
  tools: ToolRegistry
): Promise<VerificationReport[]> {
  console.log(`[FactVerifier] Batch verifying ${agentResults.length} agents`);

  const reports = await Promise.all(
    agentResults.map(agent =>
      verifyAgentFindings(agent.expertId, agent.expertName, agent.findings, tools)
    )
  );

  const avgConfidence = reports.reduce((sum, r) => sum + r.overallConfidence, 0) / reports.length;
  const totalClaims = reports.reduce((sum, r) => sum + r.claimsChecked, 0);
  const totalVerified = reports.reduce((sum, r) => sum + r.claimsVerified, 0);

  console.log(`[FactVerifier] ✓ All ${agentResults.length} agents verified`);
  console.log(`[FactVerifier]   Avg confidence: ${avgConfidence.toFixed(1)}%`);
  console.log(`[FactVerifier]   Total claims: ${totalClaims} (${totalVerified} verified)`);

  return reports;
}
