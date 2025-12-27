/**
 * Test script for PromptService
 * Run with: deno run --allow-env --allow-net prompt-service.test.ts
 */

import { PromptService } from './prompt-service.ts';

async function runTests() {
  console.log('🧪 Testing PromptService...\n');

  // Initialize service
  const service = new PromptService();
  service.setSessionId(`test-session-${  Date.now()}`);

  try {
    // Test 1: Get a single prompt
    console.log('✅ Test 1: Get agent prompt');
    const elonPrompt = await service.getPrompt('agent_elon');
    console.log(`  - Loaded: ${elonPrompt.name} (v${elonPrompt.version})`);
    console.log(`  - Category: ${elonPrompt.category}`);
    console.log(`  - Content length: ${elonPrompt.content.length} chars`);
    console.log(`  - Metadata:`, elonPrompt.metadata);
    console.log();

    // Test 2: Render prompt with variables
    console.log('✅ Test 2: Render prompt with variables');
    const questionPrompt = await service.renderPrompt('question_generation', {
      count: 5,
      userInput: 'Build a task management app',
    });
    console.log(`  - Rendered prompt length: ${questionPrompt.length} chars`);
    console.log(`  - Contains "5": ${questionPrompt.includes('5')}`);
    console.log(`  - Contains user input: ${questionPrompt.includes('task management')}`);
    console.log();

    // Test 3: Get all agent prompts
    console.log('✅ Test 3: Get all agent prompts');
    const agents = await service.getAgentPrompts();
    console.log(`  - Loaded ${agents.size} agents:`);
    for (const [agentId, prompt] of agents.entries()) {
      console.log(`    - ${agentId}: ${prompt.name}`);
    }
    console.log();

    // Test 4: Get prompts by category
    console.log('✅ Test 4: Get prompts by category');
    const challengePrompts = await service.getPromptsByCategory('challenge');
    console.log(`  - Challenge prompts: ${challengePrompts.length}`);
    for (const prompt of challengePrompts) {
      console.log(`    - ${prompt.name}`);
    }
    console.log();

    // Test 5: Track usage
    console.log('✅ Test 5: Track prompt usage');
    await service.trackUsage('agent_elon', {
      quality_score: 9.2,
      cost_cents: 52,
      latency_ms: 1850,
      model_used: 'gpt-5.1',
      tokens_input: 200,
      tokens_output: 450,
    });
    console.log('  - Usage tracked successfully');
    console.log();

    // Test 6: Cache performance
    console.log('✅ Test 6: Cache performance');
    const start1 = Date.now();
    await service.getPrompt('agent_steve');
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await service.getPrompt('agent_steve'); // Should use cache
    const time2 = Date.now() - start2;

    console.log(`  - First fetch: ${time1}ms`);
    console.log(`  - Cached fetch: ${time2}ms`);
    console.log(`  - Cache speedup: ${(time1 / time2).toFixed(1)}x faster`);
    console.log();

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    Deno.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  await runTests();
}
