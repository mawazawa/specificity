/**
 * Review Stage - Heavy-Model Output Verification
 * Uses GPT-5.2 Codex to audit lower-cost model outputs before final spec
 * Implements Phase 4 of the PLAN.md execution plan
 *
 * Verified Models (Dec 19, 2025):
 * - gpt-5.2-codex: Heavy model for review (OpenRouter)
 * - claude-opus-4.5: Fallback for review
 */

import { corsHeaders } from '../utils/api.ts';
import { RoundData, expertSynthesisSchema } from '../types.ts';
import { callOpenRouter, retryWithBackoff } from '../../../lib/openrouter-client.ts';
import { trackPromptUsage } from '../../../lib/prompt-service.ts';

type ExpertSynthesis = typeof expertSynthesisSchema._output;

export interface ReviewResult {
  overallScore: number; // 0-100
  passed: boolean;
  issues: ReviewIssue[];
  recommendations: string[];
  citationAnalysis: CitationAnalysis;
  timestamp: string;
  model: string;
}

export interface ReviewIssue {
  severity: 'critical' | 'major' | 'minor';
  category: 'accuracy' | 'completeness' | 'citation' | 'feasibility' | 'consistency';
  description: string;
  affectedExpert?: string;
  remediation: string;
}

export interface CitationAnalysis {
  totalCitations: number;
  verifiedCitations: number;
  missingCitations: number;
  expertCoverage: Record<string, { citations: number; verified: boolean }>;
}

const REVIEW_PROMPT = `You are a senior technical reviewer validating a multi-expert research synthesis.
Your task is to critically evaluate the outputs for:

1. **Accuracy**: Are technical claims correct and well-founded?
2. **Completeness**: Are all required aspects covered?
3. **Citations**: Does each major claim have supporting evidence?
4. **Feasibility**: Are the recommendations practical and implementable?
5. **Consistency**: Do expert opinions align or are conflicts addressed?

For each issue found, provide:
- Severity: critical (blocks spec) | major (should fix) | minor (nice to fix)
- Category: accuracy | completeness | citation | feasibility | consistency
- Description: What's wrong
- Remediation: How to fix it

CRITICAL: You MUST flag any synthesis that lacks citations or makes unsubstantiated claims.

Output JSON with this exact structure:
{
  "overallScore": 0-100,
  "passed": true/false (passed if score >= 70 and no critical issues),
  "issues": [{ "severity": "...", "category": "...", "description": "...", "affectedExpert": "...", "remediation": "..." }],
  "recommendations": ["..."],
  "citationAnalysis": {
    "totalCitations": 0,
    "verifiedCitations": 0,
    "missingCitations": 0,
    "expertCoverage": { "expertId": { "citations": 0, "verified": true } }
  }
}`;

export const handleReviewStage = async (
  roundData: RoundData | undefined
): Promise<Response> => {
  console.log('[Review] Starting heavy-model review of synthesis outputs...');

  const syntheses = roundData?.syntheses || [];
  const researchResults = roundData?.researchResults || [];

  if (syntheses.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No synthesis results to review' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Prepare synthesis summary for review
  const synthesisContext = syntheses.map((s: ExpertSynthesis, idx: number) => {
    const research = researchResults[idx];
    return `
## Expert: ${s.expertName} (${s.expertId})
### Synthesis:
${s.synthesis}

### Research Quality:
- Tools used: ${s.researchQuality?.toolsUsed || 0}
- Battle-tested: ${s.researchQuality?.battleTested || false}
- Confidence boost: ${s.researchQuality?.confidenceBoost || 0}%

### Original Findings:
${research?.findings?.substring(0, 1500) || 'N/A'}...
`;
  }).join('\n---\n');

  const userPrompt = `Review the following multi-expert synthesis outputs:

${synthesisContext}

Evaluate each expert's contribution and provide your review in JSON format.
Focus especially on citation quality and unsubstantiated claims.`;

  const model = 'gpt-5.2-codex'; // Verified Dec 19, 2025
  const startTime = Date.now();

  try {
    const response = await retryWithBackoff(
      () => callOpenRouter({
        model,
        messages: [
          { role: 'system', content: REVIEW_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for consistent review
        maxTokens: 2000,
        responseFormat: 'json'
      }),
      {
        maxRetries: 2,
        onRetry: (error, attempt) => {
          console.log(`[Review] Retry ${attempt} due to:`, error.message);
        }
      }
    );

    let reviewResult: ReviewResult;
    try {
      const parsed = JSON.parse(response.content);
      reviewResult = {
        overallScore: parsed.overallScore ?? 50,
        passed: parsed.passed ?? false,
        issues: parsed.issues || [],
        recommendations: parsed.recommendations || [],
        citationAnalysis: parsed.citationAnalysis || {
          totalCitations: 0,
          verifiedCitations: 0,
          missingCitations: syntheses.length,
          expertCoverage: {}
        },
        timestamp: new Date().toISOString(),
        model: response.model
      };
    } catch {
      // Fallback parsing for malformed JSON
      console.warn('[Review] Failed to parse review JSON, using fallback');
      reviewResult = {
        overallScore: 60,
        passed: false,
        issues: [{
          severity: 'major',
          category: 'accuracy',
          description: 'Review parsing failed - manual verification recommended',
          remediation: 'Re-run review stage or manually inspect outputs'
        }],
        recommendations: ['Manual review recommended due to parsing failure'],
        citationAnalysis: {
          totalCitations: 0,
          verifiedCitations: 0,
          missingCitations: syntheses.length,
          expertCoverage: {}
        },
        timestamp: new Date().toISOString(),
        model: response.model
      };
    }

    await trackPromptUsage('review_stage', {
      cost_cents: Math.round(response.cost * 100),
      latency_ms: Date.now() - startTime,
      model_used: response.model,
      tokens_input: response.usage.promptTokens,
      tokens_output: response.usage.completionTokens
    });

    // Log review summary
    const criticalCount = reviewResult.issues.filter(i => i.severity === 'critical').length;
    const majorCount = reviewResult.issues.filter(i => i.severity === 'major').length;
    console.log(`[Review] Complete: Score ${reviewResult.overallScore}/100, Passed: ${reviewResult.passed}`);
    console.log(`[Review] Issues: ${criticalCount} critical, ${majorCount} major, ${reviewResult.issues.length - criticalCount - majorCount} minor`);
    console.log(`[Review] Citations: ${reviewResult.citationAnalysis.totalCitations} total, ${reviewResult.citationAnalysis.missingCitations} missing`);

    return new Response(
      JSON.stringify({
        review: reviewResult,
        metadata: {
          reviewModel: model,
          latencyMs: Date.now() - startTime,
          synthesesReviewed: syntheses.length,
          passThreshold: 70
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Review] Review stage failed:', error);

    // Return a failed review that doesn't block the pipeline but flags the issue
    return new Response(
      JSON.stringify({
        review: {
          overallScore: 0,
          passed: false,
          issues: [{
            severity: 'critical',
            category: 'accuracy',
            description: `Review stage encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            remediation: 'Retry review stage or proceed with caution'
          }],
          recommendations: ['Review stage failed - proceed with manual verification'],
          citationAnalysis: {
            totalCitations: 0,
            verifiedCitations: 0,
            missingCitations: syntheses.length,
            expertCoverage: {}
          },
          timestamp: new Date().toISOString(),
          model: 'error'
        },
        metadata: {
          reviewModel: model,
          latencyMs: Date.now() - startTime,
          synthesesReviewed: 0,
          passThreshold: 70,
          error: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Escalation handler for model disagreement protocol (Phase 4.3)
 * Called when review fails and needs retry with different approach
 */
export const handleReviewEscalation = async (
  roundData: RoundData | undefined,
  previousReview: ReviewResult
): Promise<Response> => {
  console.log('[Review] Escalation triggered - retrying with focused review');

  // Focus only on critical issues from previous review
  const criticalIssues = previousReview.issues.filter(i => i.severity === 'critical');

  if (criticalIssues.length === 0) {
    // No critical issues to escalate
    return new Response(
      JSON.stringify({
        escalation: {
          needed: false,
          previousScore: previousReview.overallScore,
          message: 'No critical issues require escalation'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use Claude as fallback reviewer for disagreement resolution
  const fallbackModel = 'claude-opus-4.5';
  const startTime = Date.now();

  const escalationPrompt = `You are resolving a model disagreement during specification review.

Previous review found these CRITICAL issues:
${criticalIssues.map((i, idx) => `${idx + 1}. [${i.category}] ${i.description}\n   Remediation: ${i.remediation}`).join('\n')}

Original syntheses to verify:
${(roundData?.syntheses || []).map((s: ExpertSynthesis) => `- ${s.expertName}: ${s.synthesis.substring(0, 500)}...`).join('\n')}

Determine if these critical issues are:
1. Valid concerns that must be addressed
2. False positives that can be dismissed
3. Issues that can be partially mitigated

Output JSON:
{
  "resolution": "retry" | "proceed" | "manual",
  "confirmedIssues": [...],
  "dismissedIssues": [...],
  "mitigations": [...]
}`;

  try {
    const response = await retryWithBackoff(
      () => callOpenRouter({
        model: fallbackModel,
        messages: [
          { role: 'system', content: 'You are resolving a model disagreement in an AI review pipeline.' },
          { role: 'user', content: escalationPrompt }
        ],
        temperature: 0.3,
        maxTokens: 1000,
        responseFormat: 'json'
      })
    );

    const parsed = JSON.parse(response.content);

    await trackPromptUsage('review_escalation', {
      cost_cents: Math.round(response.cost * 100),
      latency_ms: Date.now() - startTime,
      model_used: response.model,
      tokens_input: response.usage.promptTokens,
      tokens_output: response.usage.completionTokens
    });

    return new Response(
      JSON.stringify({
        escalation: {
          needed: true,
          resolution: parsed.resolution || 'manual',
          confirmedIssues: parsed.confirmedIssues || [],
          dismissedIssues: parsed.dismissedIssues || [],
          mitigations: parsed.mitigations || [],
          previousScore: previousReview.overallScore,
          fallbackModel
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Review] Escalation failed:', error);
    return new Response(
      JSON.stringify({
        escalation: {
          needed: true,
          resolution: 'manual',
          message: 'Escalation failed - manual review required',
          previousScore: previousReview.overallScore
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
