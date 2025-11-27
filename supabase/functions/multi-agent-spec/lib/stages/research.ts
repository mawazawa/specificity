/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignQuestionsToExperts, balanceWorkload, AgentConfig } from '../../lib/expert-matcher.ts';
import { executeParallelResearch } from '../../lib/parallel-executor.ts';
import { corsHeaders } from '../utils/api.ts';
import { ToolRegistry } from '../../tools/registry.ts';

export const handleResearchStage = async (
    agentConfigs: AgentConfig[] | undefined,
    roundData: any,
    cleanInput: string,
    tools: ToolRegistry
) => {
    console.log('[Enhanced] Starting parallel research with tools...');

    if (!agentConfigs) {
        return new Response(
            JSON.stringify({ error: 'Agent configurations required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const questions = roundData?.questions || [];
    if (questions.length === 0) {
        return new Response(
            JSON.stringify({ error: 'No questions provided for research' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Add IDs to agent configs
    const configsWithIds: AgentConfig[] = agentConfigs.map((config, idx) => ({
        id: config.id || config.agent.toLowerCase().replace(/\s+/g, '_'),
        agent: config.agent,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        enabled: config.enabled
    }));

    // Assign questions to experts
    const assignments = assignQuestionsToExperts(questions, configsWithIds);
    const balancedAssignments = balanceWorkload(assignments);

    console.log(`[Enhanced] Assigned questions to ${balancedAssignments.length} experts`);

    // Execute parallel research
    const researchResults = await executeParallelResearch(
        balancedAssignments,
        tools,
        {
            userInput: cleanInput,
            roundNumber: roundData?.roundNumber || 1
        }
    );

    // Calculate total cost and tokens
    const totalCost = researchResults.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = researchResults.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalTools = researchResults.reduce((sum, r) => sum + r.toolsUsed.length, 0);

    console.log(`[Enhanced] Research complete - Cost: $${totalCost.toFixed(4)}, Tokens: ${totalTokens}, Tools: ${totalTools}`);

    return new Response(
        JSON.stringify({
            researchResults,
            assignments: balancedAssignments,
            metadata: {
                totalCost,
                totalTokens,
                totalToolsUsed: totalTools,
                duration: Math.max(...researchResults.map(r => r.duration))
            }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
};
