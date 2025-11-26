/**
 * Specialized Sub-Agent Spawning System
 * Allows agents to spawn focused sub-agents for complex research
 *
 * Use cases:
 * - Deep technical research (e.g., specific framework version comparisons)
 * - Competitive analysis (spawn sub-agent per competitor)
 * - Multi-faceted questions (spawn sub-agent per facet)
 * - Verification tasks (fact-checking, source validation)
 */

import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';
import { ToolRegistry } from '../tools/registry.ts';

export interface SubAgentRequest {
  parentAgentId: string;
  parentAgentName: string;
  specialization: string; // e.g., "React 19 vs Next.js 15 performance comparison"
  researchGoal: string; // Specific question or task
  maxIterations?: number; // Default: 5
  toolsNeeded?: string[]; // Specific tools to use
  context?: string; // Context from parent agent
}

export interface SubAgentResult {
  subAgentId: string;
  specialization: string;
  findings: string;
  confidence: number; // 0-100
  toolsUsed: Array<{ tool: string; success: boolean; duration: number }>;
  duration: number;
  cost: number;
  tokensUsed: number;
  iterations: number;
}

/**
 * Spawn a specialized sub-agent to research a specific topic
 */
export async function spawnSubAgent(
  request: SubAgentRequest,
  tools: ToolRegistry
): Promise<SubAgentResult> {
  const startTime = Date.now();
  const subAgentId = `sub-${request.parentAgentId}-${Date.now()}`;
  const maxIterations = request.maxIterations || 5;
  const toolsUsed: Array<{ tool: string; success: boolean; duration: number }> = [];
  let totalCost = 0;
  let totalTokens = 0;

  console.log(`[SubAgent:${subAgentId}] Spawned by ${request.parentAgentName}`);
  console.log(`[SubAgent:${subAgentId}] Specialization: ${request.specialization}`);

  // Focused sub-agent system prompt
  const systemPrompt = `You are a specialized research sub-agent focused on: ${request.specialization}

Your parent agent (${request.parentAgentName}) needs deep research on this specific topic.

RESEARCH GOAL:
${request.researchGoal}

${request.context ? `CONTEXT FROM PARENT AGENT:\n${request.context}\n` : ''}
AVAILABLE TOOLS:
${tools.getPromptDescription()}

INSTRUCTIONS:
1. Focus ONLY on the research goal - be laser-focused
2. Use tools to gather current, accurate data (November 2025)
3. Verify all claims with sources
4. Be specific and technical - avoid generic advice
5. Complete research in ${maxIterations} iterations or less

${request.toolsNeeded ? `PRIORITIZE THESE TOOLS: ${request.toolsNeeded.join(', ')}` : ''}

HOW TO USE TOOLS:
When you need information, output ONLY a JSON object (no markdown):
{
  "tool": "tool_name",
  "params": {
    "param1": "value1"
  }
}

WHEN COMPLETE:
Output ONLY this JSON object (no markdown):
{
  "complete": true,
  "confidence": 85,
  "findings": "Your detailed research findings with specific data, sources, and recommendations."
}`;

  let conversationHistory = `Begin focused research on: ${request.researchGoal}`;
  let iterations = 0;

  try {
    while (iterations < maxIterations) {
      iterations++;

      console.log(`[SubAgent:${subAgentId}] Iteration ${iterations}/${maxIterations}`);

      // Call LLM with focused prompt
      const response = await retryWithBackoff(
        () => callOpenRouter({
          model: 'claude-sonnet-4.5', // Best for deep research
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationHistory }
          ],
          temperature: 0.6, // Slightly lower for focused research
          maxTokens: 1500
        }),
        {
          maxRetries: 2,
          onRetry: (error, attempt) => {
            console.log(`[SubAgent:${subAgentId}] Retry ${attempt}:`, error.message);
          }
        }
      );

      totalCost += response.cost;
      totalTokens += response.usage.totalTokens;

      // Check if sub-agent is done
      if (response.content.includes('"complete": true')) {
        try {
          let jsonContent = response.content;
          const jsonMatch = response.content.match(/\{[\s\S]*"complete"\s*:\s*true[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const result = JSON.parse(jsonContent);

          console.log(`[SubAgent:${subAgentId}] ✓ Complete in ${iterations} iterations`);
          console.log(`[SubAgent:${subAgentId}] Confidence: ${result.confidence}%`);

          return {
            subAgentId,
            specialization: request.specialization,
            findings: result.findings || response.content,
            confidence: result.confidence || 75,
            toolsUsed,
            duration: Date.now() - startTime,
            cost: totalCost,
            tokensUsed: totalTokens,
            iterations
          };
        } catch (parseError) {
          console.warn(`[SubAgent:${subAgentId}] Failed to parse completion, treating as findings`);

          return {
            subAgentId,
            specialization: request.specialization,
            findings: response.content.replace(/```json\n?|\n?```/g, '').replace(/"complete"\s*:\s*true,?\s*/g, ''),
            confidence: 70,
            toolsUsed,
            duration: Date.now() - startTime,
            cost: totalCost,
            tokensUsed: totalTokens,
            iterations
          };
        }
      }

      // Check if sub-agent wants to use a tool
      if (response.content.includes('"tool"') || response.content.includes('"params"')) {
        try {
          let jsonContent = response.content;
          const jsonMatch = response.content.match(/\{[\s\S]*"tool"[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const toolCall = JSON.parse(jsonContent);

          if (toolCall.tool && toolCall.params) {
            const toolStartTime = Date.now();
            console.log(`[SubAgent:${subAgentId}] → Using tool: ${toolCall.tool}`);

            const toolResult = await tools.execute(toolCall.tool, toolCall.params);
            const toolDuration = Date.now() - toolStartTime;

            toolsUsed.push({
              tool: toolCall.tool,
              success: toolResult.success,
              duration: toolDuration
            });

            // Add tool result to conversation
            if (toolResult.success) {
              conversationHistory += `\n\n[Tool Result: ${toolCall.tool}]\n${JSON.stringify(toolResult.data, null, 2)}`;
            } else {
              conversationHistory += `\n\n[Tool Error: ${toolCall.tool}]\n${toolResult.error}`;
            }

            continue;
          }
        } catch (parseError) {
          console.warn(`[SubAgent:${subAgentId}] Failed to parse tool call:`, parseError);
        }
      }

      // Prompt to either use tool or complete
      conversationHistory += `\n\nPlease either:
1. Use a tool to gather more specific information
2. Complete your research with findings`;
    }

    // Max iterations reached
    console.warn(`[SubAgent:${subAgentId}] Max iterations (${maxIterations}) reached`);

    return {
      subAgentId,
      specialization: request.specialization,
      findings: `Research incomplete after ${maxIterations} iterations. Last context:\n${conversationHistory.slice(-1000)}`,
      confidence: 50, // Low confidence since incomplete
      toolsUsed,
      duration: Date.now() - startTime,
      cost: totalCost,
      tokensUsed: totalTokens,
      iterations: maxIterations
    };
  } catch (error) {
    console.error(`[SubAgent:${subAgentId}] Research failed:`, error);

    return {
      subAgentId,
      specialization: request.specialization,
      findings: `Sub-agent research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0,
      toolsUsed,
      duration: Date.now() - startTime,
      cost: totalCost,
      tokensUsed: totalTokens,
      iterations
    };
  }
}

/**
 * Spawn multiple sub-agents in parallel for multi-faceted research
 */
export async function spawnMultipleSubAgents(
  requests: SubAgentRequest[],
  tools: ToolRegistry
): Promise<SubAgentResult[]> {
  console.log(`[SubAgentSpawner] Spawning ${requests.length} sub-agents in parallel`);

  const results = await Promise.all(
    requests.map(request => spawnSubAgent(request, tools))
  );

  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  console.log(`[SubAgentSpawner] ✓ All ${results.length} sub-agents complete`);
  console.log(`[SubAgentSpawner]   Total cost: $${totalCost.toFixed(4)}`);
  console.log(`[SubAgentSpawner]   Avg confidence: ${avgConfidence.toFixed(1)}%`);

  return results;
}

/**
 * Detect if a research task requires sub-agent spawning
 * Returns specialization suggestions if sub-agents are recommended
 */
export async function detectComplexityAndSuggestSubAgents(
  question: string,
  initialFindings: string
): Promise<SubAgentRequest[] | null> {
  try {
    const response = await callOpenRouter({
      model: 'gpt-5.1', // Good at meta-reasoning
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing research tasks and determining if they require specialized sub-agents. Respond ONLY with JSON.'
        },
        {
          role: 'user',
          content: `Research question: ${question}

Initial findings so far:
${initialFindings.slice(0, 500)}

Should this research spawn specialized sub-agents for deeper analysis?

Spawn sub-agents if:
- Question involves comparing 3+ specific technologies/frameworks
- Requires competitive analysis of multiple companies
- Needs verification from multiple independent sources
- Involves multi-faceted technical decisions (e.g., architecture, security, scalability)

Return JSON:
{
  "needsSubAgents": true/false,
  "reasoning": "why or why not",
  "subAgents": [
    {
      "specialization": "specific topic",
      "researchGoal": "what to research",
      "toolsNeeded": ["tool1", "tool2"]
    }
  ]
}`
        }
      ],
      temperature: 0.5,
      maxTokens: 500
    });

    const result = JSON.parse(response.content);

    if (result.needsSubAgents && result.subAgents && result.subAgents.length > 0) {
      console.log(`[ComplexityDetector] Recommending ${result.subAgents.length} sub-agents`);
      console.log(`[ComplexityDetector] Reasoning: ${result.reasoning}`);
      return result.subAgents;
    }

    return null;
  } catch (error) {
    console.error('[ComplexityDetector] Failed to detect complexity:', error);
    return null;
  }
}
