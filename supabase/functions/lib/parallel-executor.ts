import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { ExpertAssignment, _ExpertAssignmentSchema } from './expert-matcher.ts';
import { ToolRegistry } from '../tools/registry.ts';
import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';
import { _ResearchQuestion, ResearchQuestionSchema } from './question-generator.ts';
import { renderPrompt, trackPromptUsage } from './prompt-service.ts';

export const ToolUsedSchema = z.object({
  tool: z.string(),
  success: z.boolean(),
  duration: z.number(),
});

export const AgentResearchResultSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  questions: z.array(ResearchQuestionSchema),
  findings: z.string(),
  toolsUsed: z.array(ToolUsedSchema),
  duration: z.number(),
  model: z.string(),
  cost: z.number(),
  tokensUsed: z.number(),
});

export type AgentResearchResult = z.infer<typeof AgentResearchResultSchema>;

const MAX_AGENT_ITERATIONS = Number(Deno.env.get('RESEARCH_MAX_ITERATIONS')) || 3;
const MAX_AGENT_RETRIES = Number(Deno.env.get('RESEARCH_MAX_RETRIES')) || 1;
const MAX_AGENT_TOKENS = Number(Deno.env.get('RESEARCH_MAX_TOKENS')) || 1200;

/**
 * Execute all agents in parallel with autonomous tool usage
 */
export async function executeParallelResearch(
  assignments: ExpertAssignment[],
  tools: ToolRegistry,
  context: {
    userInput: string;
    roundNumber: number;
  }
): Promise<AgentResearchResult[]> {
  console.info(`[ParallelExecutor] Starting parallel execution with ${assignments.length} agents`);
  console.info(`[ParallelExecutor] Round ${context.roundNumber}`);

  const startTime = Date.now();

  // Execute all agents simultaneously with graceful partial failure handling
  const settledResults = await Promise.allSettled(
    assignments.map(assignment =>
      executeAgentAssignment(assignment, tools, context)
    )
  );

  // Extract successful results and log failures
  const results: AgentResearchResult[] = [];
  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      // Create fallback result for failed agent
      const assignment = assignments[index];
      console.error(`[ParallelExecutor] Agent ${assignment?.expertName || index} failed:`, result.reason);
      results.push({
        expertId: assignment?.expertId || `failed-${index}`,
        expertName: assignment?.expertName || `Agent ${index}`,
        questions: assignment?.questions || [],
        findings: `Research failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
        toolsUsed: [],
        duration: Date.now() - startTime,
        model: assignment?.model || 'unknown',
        cost: 0,
        tokensUsed: 0
      });
    }
  });

  const duration = Date.now() - startTime;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const totalTools = results.reduce((sum, r) => sum + r.toolsUsed.length, 0);
  const failedCount = settledResults.filter(r => r.status === 'rejected').length;

  if (failedCount > 0) {
    console.warn(`[ParallelExecutor] ${failedCount}/${assignments.length} agents failed, continuing with partial results`);
  }

  console.info(`[ParallelExecutor] ✓ Completed in ${duration}ms`);
  console.info(`[ParallelExecutor]   Total cost: $${totalCost.toFixed(4)}`);
  console.info(`[ParallelExecutor]   Tools used: ${totalTools}`);

  return results;
}

/**
 * Execute a single agent's assignment with autonomous tool usage
 */
async function executeAgentAssignment(
  assignment: ExpertAssignment,
  tools: ToolRegistry,
  context: {
    userInput: string;
    roundNumber: number;
  }
): Promise<AgentResearchResult> {
  const startTime = Date.now();
  const toolsUsed: Array<{ tool: string; success: boolean; duration: number }> = [];
  let totalCost = 0;
  let totalTokens = 0;

  // Combine all assigned questions
  const taskDescription = assignment.questions
    .map((q, idx) => `${idx + 1}. ${q.question}`)
    .join('\n');

  // Load research stage prompt from database
  const systemPrompt = await renderPrompt('research_stage', {
    expertName: assignment.expertName,
    taskDescription,
    toolsDescription: tools.getPromptDescription()
  });

  let conversationHistory = `Product Idea: ${context.userInput}\n\nRound: ${context.roundNumber}\n\nBegin your research.`;
  let iterations = 0;
  const maxIterations = MAX_AGENT_ITERATIONS;

  try {
    while (iterations < maxIterations) {
      iterations++;

      console.info(`[${assignment.expertName}] Iteration ${iterations}/${maxIterations}`);

      // Call LLM
      const callStart = Date.now();
      const response = await retryWithBackoff(
        () => callOpenRouter({
          model: assignment.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationHistory }
          ],
          temperature: 0.7,
          maxTokens: MAX_AGENT_TOKENS
        }),
        {
          maxRetries: MAX_AGENT_RETRIES,
          onRetry: (error, attempt) => {
            console.info(`[${assignment.expertName}] Retry ${attempt}:`, error.message);
          }
        }
      );

      totalCost += response.cost;
      totalTokens += response.usage.totalTokens;

      await trackPromptUsage('research_stage', {
        cost_cents: Math.round(response.cost * 100),
        latency_ms: Date.now() - callStart,
        model_used: response.model,
        tokens_input: response.usage.promptTokens,
        tokens_output: response.usage.completionTokens
      });

      // Check if agent is done
      if (response.content.includes('"complete": true')) {
        try {
          // Extract JSON from potential markdown
          let jsonContent = response.content;
          const jsonMatch = response.content.match(/\{[\s\S]*"complete"\s*:\s*true[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const result = JSON.parse(jsonContent);

          console.info(`[${assignment.expertName}] ✓ Research complete`);
          console.info(`[${assignment.expertName}]   Iterations: ${iterations}`);
          console.info(`[${assignment.expertName}]   Tools used: ${toolsUsed.length}`);
          console.info(`[${assignment.expertName}]   Cost: $${totalCost.toFixed(4)}`);

          return {
            expertId: assignment.expertId,
            expertName: assignment.expertName,
            questions: assignment.questions,
            findings: result.findings || response.content,
            toolsUsed,
            duration: Date.now() - startTime,
            model: assignment.model,
            cost: totalCost,
            tokensUsed: totalTokens
          };
        } catch (_parseError) {
          console.warn(`[${assignment.expertName}] Failed to parse completion JSON, treating as findings`);

          return {
            expertId: assignment.expertId,
            expertName: assignment.expertName,
            questions: assignment.questions,
            findings: response.content.replace(/```json\n?|\n?```/g, '').replace(/"complete"\s*:\s*true,?\s*/g, ''),
            toolsUsed,
            duration: Date.now() - startTime,
            model: assignment.model,
            cost: totalCost,
            tokensUsed: totalTokens
          };
        }
      }

      // Check if agent wants to use a tool
      if (response.content.includes('"tool"') || response.content.includes('"params"')) {
        try {
          // Extract JSON from potential markdown
          let jsonContent = response.content;
          const jsonMatch = response.content.match(/\{[\s\S]*"tool"[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const toolCall = JSON.parse(jsonContent);

          if (toolCall.tool && toolCall.params) {
            const toolStartTime = Date.now();
            console.info(`[${assignment.expertName}] → Using tool: ${toolCall.tool}`);

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

            continue; // Next iteration with tool results
          }
        } catch (_parseError) {
          console.warn(`[${assignment.expertName}] Failed to parse tool call JSON:`, parseError);
          // Continue anyway - LLM might provide findings in next iteration
        }
      }

      // If we reach here, LLM didn't complete or call a tool properly
      // Prompt it to either use a tool or complete
      conversationHistory += `\n\nPlease either:
1. Use a tool to gather more information (output tool JSON)
2. Complete your research (output complete JSON with findings)`;
    }

    // Max iterations reached - return what we have
    console.warn(`[${assignment.expertName}] Max iterations reached, returning current state`);

    return {
      expertId: assignment.expertId,
      expertName: assignment.expertName,
      questions: assignment.questions,
      findings: `Research incomplete after ${maxIterations} iterations. Last context:\n${conversationHistory.slice(-1000)}`,
      toolsUsed,
      duration: Date.now() - startTime,
      model: assignment.model,
      cost: totalCost,
      tokensUsed: totalTokens
    };
  } catch (error) {
    console.error(`[${assignment.expertName}] Research failed:`, error);

    return {
      expertId: assignment.expertId,
      expertName: assignment.expertName,
      questions: assignment.questions,
      findings: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      toolsUsed,
      duration: Date.now() - startTime,
      model: assignment.model,
      cost: totalCost,
      tokensUsed: totalTokens
    };
  }
}
