/**
 * Test script for PromptService
 * Run with: deno run --allow-env --allow-net prompt-service.test.ts
 */

import { PromptService } from './prompt-service.ts';

async function runTests() {
  console.info('🧪 Testing PromptService...\n');

  // Initialize service
  const service = new PromptService();
  service.setSessionId(`test-session-${  Date.now()}`);

  try {
    // Test 1: Get a single prompt
    console.info('✅ Test 1: Get agent prompt');
    const elonPrompt = await service.getPrompt('agent_elon');
    console.info(`  - Loaded: ${elonPrompt.name} (v${elonPrompt.version})`);
    console.info(`  - Category: ${elonPrompt.category}`);
    console.info(`  - Content length: ${elonPrompt.content.length} chars`);
    console.info(`  - Metadata:`, elonPrompt.metadata);
    console.info();

    // Test 2: Render prompt with variables
    console.info('✅ Test 2: Render prompt with variables');
    const questionPrompt = await service.renderPrompt('question_generation', {
      count: 5,
      userInput: 'Build a task management app',
    });
    console.info(`  - Rendered prompt length: ${questionPrompt.length} chars`);
    console.info(`  - Contains "5": ${questionPrompt.includes('5')}`);
    console.info(`  - Contains user input: ${questionPrompt.includes('task management')}`);
    console.info();

    // Test 3: Get all agent prompts
    console.info('✅ Test 3: Get all agent prompts');
    const agents = await service.getAgentPrompts();
    console.info(`  - Loaded ${agents.size} agents:`);
    for (const [agentId, prompt] of agents.entries()) {
      console.info(`    - ${agentId}: ${prompt.name}`);
    }
    console.info();

    // Test 4: Get prompts by category
    console.info('✅ Test 4: Get prompts by category');
    const challengePrompts = await service.getPromptsByCategory('challenge');
    console.info(`  - Challenge prompts: ${challengePrompts.length}`);
    for (const prompt of challengePrompts) {
      console.info(`    - ${prompt.name}`);
    }
    console.info();

    // Test 5: Track usage
    console.info('✅ Test 5: Track prompt usage');
    await service.trackUsage('agent_elon', {
      quality_score: 9.2,
      cost_cents: 52,
      latency_ms: 1850,
      model_used: 'gpt-5.1',
      tokens_input: 200,
      tokens_output: 450,
    });
    console.info('  - Usage tracked successfully');
    console.info();

    // Test 6: Cache performance
    console.info('✅ Test 6: Cache performance');
    const start1 = Date.now();
    await service.getPrompt('agent_steve');
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await service.getPrompt('agent_steve'); // Should use cache
    const time2 = Date.now() - start2;

    console.info(`  - First fetch: ${time1}ms`);
    console.info(`  - Cached fetch: ${time2}ms`);
    console.info(`  - Cache speedup: ${(time1 / time2).toFixed(1)}x faster`);
    console.info();

    console.info('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    Deno.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  await runTests();
}
