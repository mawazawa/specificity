import { ExpertAssignment } from './expert-matcher.ts';
import { ToolRegistry } from '../tools/registry.ts';
import { callOpenRouter, retryWithBackoff } from './openrouter-client.ts';
import { ResearchQuestion } from './question-generator.ts';
import { StreamEmitter } from './stream-emitter.ts';
import { spawnMultipleSubAgents, SubAgentRequest } from './sub-agent-spawner.ts';

export interface AgentResearchResult {
  expertId: string;
  expertName: string;
  questions: ResearchQuestion[];
  findings: string;
  confidence?: number; // Self-evaluated confidence score (0-100)
  toolsUsed: Array<{ tool: string; success: boolean; duration: number }>;
  duration: number;
  model: string;
  cost: number;
  tokensUsed: number;
  iterationsUsed: number; // Track how many iterations were needed
  subAgentsSpawned?: number; // Number of sub-agents spawned for deep research
}

/**
 * Execute all agents in parallel with autonomous tool usage
 */
export async function executeParallelResearch(
  assignments: ExpertAssignment[],
  tools: ToolRegistry,
  context: {
    userInput: string;
    roundNumber: number;
    streamEmitter?: StreamEmitter; // Optional real-time streaming
  }
): Promise<AgentResearchResult[]> {
  console.log(`[ParallelExecutor] Starting parallel execution with ${assignments.length} agents`);
  console.log(`[ParallelExecutor] Round ${context.roundNumber}`);

  const emitter = context.streamEmitter || new StreamEmitter(); // Use provided or create dummy

  // Notify all agents starting
  await emitter.systemMessage(
    `Starting parallel research with ${assignments.length} agents`,
    { agentCount: assignments.length, round: context.roundNumber }
  );

  const startTime = Date.now();

  // Execute all agents simultaneously
  const results = await Promise.all(
    assignments.map(assignment =>
      executeAgentAssignment(assignment, tools, context, emitter)
    )
  );

  const duration = Date.now() - startTime;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const totalTools = results.reduce((sum, r) => sum + r.toolsUsed.length, 0);
  const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

  console.log(`[ParallelExecutor] ✓ Completed in ${duration}ms`);
  console.log(`[ParallelExecutor]   Total cost: $${totalCost.toFixed(4)}`);
  console.log(`[ParallelExecutor]   Tools used: ${totalTools}`);

  // Emit system completion message
  await emitter.systemMessage(
    `All ${results.length} agents completed research`,
    {
      duration,
      totalCost: `$${totalCost.toFixed(4)}`,
      totalTools,
      avgConfidence: avgConfidence.toFixed(1)
    }
  );

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
  },
  emitter: StreamEmitter
): Promise<AgentResearchResult> {
  const startTime = Date.now();
  const toolsUsed: Array<{ tool: string; success: boolean; duration: number }> = [];
  let totalCost = 0;
  let totalTokens = 0;
  let subAgentsSpawned = 0; // Track sub-agents spawned

  // Emit agent start event
  await emitter.agentStart(assignment.expertId, assignment.expertName, assignment.questions.length);

  // Combine all assigned questions
  const taskDescription = assignment.questions
    .map((q, idx) => `${idx + 1}. ${q.question}`)
    .join('\n');

  const systemPrompt = `You are ${assignment.expertName}, a world-class expert.

Your task is to thoroughly research these questions about the product idea:

${taskDescription}

You have access to these research tools:
${tools.getPromptDescription()}

IMPORTANT INSTRUCTIONS:
1. Use tools to gather current, accurate information (November 2025)
2. Verify all technology recommendations with web_search
3. Focus on actionable, specific insights (not generic advice)
4. Consider your unique perspective as ${assignment.expertName}

HOW TO USE TOOLS:
When you need information, output ONLY a JSON object (no markdown):
{
  "tool": "tool_name",
  "params": {
    "param1": "value1"
  }
}

After receiving tool results, continue your research or output your findings.

SPAWN SUB-AGENTS (for complex multi-faceted research):
If you encounter a question that requires deep specialized research (e.g., comparing 3+ technologies, analyzing multiple competitors, verifying from multiple sources), you can spawn focused sub-agents:
{
  "spawnSubAgents": true,
  "subAgents": [
    {
      "specialization": "Specific narrow topic",
      "researchGoal": "What the sub-agent should research",
      "toolsNeeded": ["tool1", "tool2"]
    }
  ]
}

Sub-agents will conduct focused research (5 iterations) and return findings to you.
Use sparingly - only for truly complex multi-faceted questions.

WHEN COMPLETE:
Output ONLY this JSON object (no markdown):
{
  "complete": true,
  "confidence": 95,
  "findings": "Your comprehensive research findings as ${assignment.expertName}. Include specific technologies, frameworks, best practices, and actionable recommendations. Cite sources when relevant."
}

SELF-EVALUATION (at checkpoints):
At iterations 5, 10, and 15, you will receive a self-reflection prompt.
Honestly assess:
- Have you answered all assigned questions thoroughly?
- Are your technology recommendations current (November 2025)?
- Are there critical gaps that need more research?
- Confidence level (0-100%) in your findings

If confidence >= 85% and all questions answered: Complete research
If confidence < 85% or gaps exist: Use more tools to fill gaps

Remember:
- Be specific and technical (not vague)
- Recommend bleeding-edge tech (November 2025)
- Include concrete examples
- Focus on production-ready solutions
- Self-evaluate honestly at checkpoints`;

  let conversationHistory = `Product Idea: ${context.userInput}\n\nRound: ${context.roundNumber}\n\nBegin your research.`;
  let iterations = 0;
  const maxIterations = 15; // Extended to 15 iterations with self-reflection checkpoints

  try {
    while (iterations < maxIterations) {
      iterations++;

      console.log(`[${assignment.expertName}] Iteration ${iterations}/${maxIterations}`);

      // Emit iteration event
      await emitter.agentIteration(
        assignment.expertId,
        assignment.expertName,
        iterations,
        maxIterations,
        'Analyzing and researching...'
      );

      // Call LLM
      const response = await retryWithBackoff(
        () => callOpenRouter({
          model: assignment.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationHistory }
          ],
          temperature: 0.7,
          maxTokens: 2000
        }),
        {
          maxRetries: 2,
          onRetry: (error, attempt) => {
            console.log(`[${assignment.expertName}] Retry ${attempt}:`, error.message);
          }
        }
      );

      totalCost += response.cost;
      totalTokens += response.usage.totalTokens;

      // SELF-REFLECTION CHECKPOINTS
      // At iteration 5: Ask if research is complete, aim to finish in next 5
      if (iterations === 5) {
        console.log(`[${assignment.expertName}] 📊 Self-reflection checkpoint (iteration 5)`);

        // Emit reflection event
        await emitter.agentReflection(assignment.expertId, assignment.expertName, 5);

        conversationHistory += `\n\n[SELF-REFLECTION CHECKPOINT - Iteration 5/15]
You have completed 5 iterations. Please evaluate:

1. Is your research sufficiently comprehensive to answer all assigned questions?
2. Have you gathered bleeding-edge, November 2025 technology recommendations?
3. Are there any critical gaps in your findings?

IMPORTANT: You have 10 more iterations available, but aim to complete your research within the next 5 iterations if possible.

If research is complete: Output the completion JSON.
If more research needed: Use tools to fill gaps, then complete.`;
      }

      // At iteration 10: Urgent warning to complete soon
      if (iterations === 10) {
        console.log(`[${assignment.expertName}] ⚠️  Self-reflection checkpoint (iteration 10)`);

        // Emit urgent reflection event
        await emitter.agentReflection(assignment.expertId, assignment.expertName, 10);

        conversationHistory += `\n\n[URGENT SELF-REFLECTION - Iteration 10/15]
You have used 10 iterations. You have 5 iterations remaining.

ASSESS YOUR RESEARCH:
- Do you have comprehensive, actionable findings?
- Have you verified all technology recommendations are current (Nov 2025)?
- Are your recommendations specific and production-ready?

⚠️ WARNING: You should strongly aim to complete your research within the next 5 iterations.

If ready: Output completion JSON with your findings.
If critical gaps remain: Use maximum 2-3 more tools, then MUST complete.`;
      }

      // At iteration 15: Final warning (last chance)
      if (iterations === 15) {
        console.log(`[${assignment.expertName}] 🔴 FINAL iteration - must complete now`);

        // Emit final reflection event
        await emitter.agentReflection(assignment.expertId, assignment.expertName, 15);

        conversationHistory += `\n\n[FINAL ITERATION - 15/15]
This is your last iteration. You MUST complete your research now.

Output your completion JSON immediately with all findings gathered so far.`;
      }

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

          console.log(`[${assignment.expertName}] ✓ Research complete`);
          console.log(`[${assignment.expertName}]   Iterations: ${iterations}/${maxIterations}`);
          console.log(`[${assignment.expertName}]   Confidence: ${result.confidence || 'N/A'}%`);
          console.log(`[${assignment.expertName}]   Tools used: ${toolsUsed.length}`);
          console.log(`[${assignment.expertName}]   Cost: $${totalCost.toFixed(4)}`);

          // Emit completion event
          await emitter.agentComplete(
            assignment.expertId,
            assignment.expertName,
            iterations,
            result.confidence,
            toolsUsed.length,
            Date.now() - startTime,
            totalCost
          );

          return {
            expertId: assignment.expertId,
            expertName: assignment.expertName,
            questions: assignment.questions,
            findings: result.findings || response.content,
            confidence: result.confidence,
            toolsUsed,
            duration: Date.now() - startTime,
            model: assignment.model,
            cost: totalCost,
            tokensUsed: totalTokens,
            iterationsUsed: iterations,
            subAgentsSpawned: subAgentsSpawned > 0 ? subAgentsSpawned : undefined
          };
        } catch (parseError) {
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
            tokensUsed: totalTokens,
            iterationsUsed: iterations,
            subAgentsSpawned: subAgentsSpawned > 0 ? subAgentsSpawned : undefined
          };
        }
      }

      // Check if agent wants to spawn sub-agents
      if (response.content.includes('"spawnSubAgents"') && response.content.includes('true')) {
        try {
          let jsonContent = response.content;
          const jsonMatch = response.content.match(/\{[\s\S]*"spawnSubAgents"[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const spawnRequest = JSON.parse(jsonContent);

          if (spawnRequest.spawnSubAgents && spawnRequest.subAgents && spawnRequest.subAgents.length > 0) {
            console.log(`[${assignment.expertName}] → Spawning ${spawnRequest.subAgents.length} sub-agents`);

            // Emit sub-agent spawning event
            await emitter.agentToolUse(
              assignment.expertId,
              assignment.expertName,
              'spawn_sub_agents',
              { count: spawnRequest.subAgents.length },
              true,
              0
            );

            // Build sub-agent requests
            const subAgentRequests: SubAgentRequest[] = spawnRequest.subAgents.map((sa: any) => ({
              parentAgentId: assignment.expertId,
              parentAgentName: assignment.expertName,
              specialization: sa.specialization || 'Deep research',
              researchGoal: sa.researchGoal || 'Research assigned topic',
              toolsNeeded: sa.toolsNeeded || [],
              context: conversationHistory.slice(-500), // Last 500 chars of context
              maxIterations: 5 // Sub-agents get 5 iterations
            }));

            // Spawn sub-agents in parallel
            const subAgentStartTime = Date.now();
            const subAgentResults = await spawnMultipleSubAgents(subAgentRequests, tools);
            const subAgentDuration = Date.now() - subAgentStartTime;
            subAgentsSpawned += subAgentResults.length; // Track spawned count

            // Add sub-agent costs to parent agent
            const subAgentCost = subAgentResults.reduce((sum, r) => sum + r.cost, 0);
            const subAgentTokens = subAgentResults.reduce((sum, r) => sum + r.tokensUsed, 0);
            totalCost += subAgentCost;
            totalTokens += subAgentTokens;

            // Track sub-agent tools used
            subAgentResults.forEach(r => {
              r.toolsUsed.forEach(t => toolsUsed.push(t));
            });

            // Format sub-agent findings for parent agent
            const subAgentFindings = subAgentResults.map((r, idx) =>
              `[Sub-Agent ${idx + 1}: ${r.specialization}]
Confidence: ${r.confidence}%
Findings:
${r.findings}
`
            ).join('\n\n');

            conversationHistory += `\n\n[Sub-Agent Research Complete]
${spawnRequest.subAgents.length} sub-agents completed in ${(subAgentDuration / 1000).toFixed(1)}s
Cost: $${subAgentCost.toFixed(4)}

${subAgentFindings}

Continue your research with these sub-agent findings integrated.`;

            console.log(`[${assignment.expertName}] ✓ ${spawnRequest.subAgents.length} sub-agents complete in ${(subAgentDuration / 1000).toFixed(1)}s`);

            continue; // Next iteration with sub-agent results
          }
        } catch (parseError) {
          console.warn(`[${assignment.expertName}] Failed to parse sub-agent spawn request:`, parseError);
          // Continue anyway
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
            console.log(`[${assignment.expertName}] → Using tool: ${toolCall.tool}`);

            const toolResult = await tools.execute(toolCall.tool, toolCall.params);
            const toolDuration = Date.now() - toolStartTime;

            toolsUsed.push({
              tool: toolCall.tool,
              success: toolResult.success,
              duration: toolDuration
            });

            // Emit tool usage event
            await emitter.agentToolUse(
              assignment.expertId,
              assignment.expertName,
              toolCall.tool,
              toolCall.params,
              toolResult.success,
              toolDuration
            );

            // Add tool result to conversation
            if (toolResult.success) {
              conversationHistory += `\n\n[Tool Result: ${toolCall.tool}]\n${JSON.stringify(toolResult.data, null, 2)}`;
            } else {
              conversationHistory += `\n\n[Tool Error: ${toolCall.tool}]\n${toolResult.error}`;
            }

            continue; // Next iteration with tool results
          }
        } catch (parseError) {
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
    console.warn(`[${assignment.expertName}] Max iterations (${maxIterations}) reached, returning current state`);

    return {
      expertId: assignment.expertId,
      expertName: assignment.expertName,
      questions: assignment.questions,
      findings: `Research incomplete after ${maxIterations} iterations. Last context:\n${conversationHistory.slice(-1000)}`,
      confidence: 50, // Low confidence since incomplete
      toolsUsed,
      duration: Date.now() - startTime,
      model: assignment.model,
      cost: totalCost,
      tokensUsed: totalTokens,
      iterationsUsed: maxIterations,
      subAgentsSpawned: subAgentsSpawned > 0 ? subAgentsSpawned : undefined
    };
  } catch (error) {
    console.error(`[${assignment.expertName}] Research failed:`, error);

    // Emit error event
    await emitter.agentError(
      assignment.expertId,
      assignment.expertName,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return {
      expertId: assignment.expertId,
      expertName: assignment.expertName,
      questions: assignment.questions,
      findings: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0, // Zero confidence on error
      toolsUsed,
      duration: Date.now() - startTime,
      model: assignment.model,
      cost: totalCost,
      tokensUsed: totalTokens,
      iterationsUsed: iterations,
      subAgentsSpawned: subAgentsSpawned > 0 ? subAgentsSpawned : undefined
    };
  }
}
