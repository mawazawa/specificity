#!/usr/bin/env -S npx tsx
/**
 * Pipeline Smoke Test
 * Exercises all stages of the multi-agent-spec function end-to-end
 *
 * Usage:
 *   npx tsx scripts/smoke-test-pipeline.ts
 *   npx tsx scripts/smoke-test-pipeline.ts --stage questions
 *   npx tsx scripts/smoke-test-pipeline.ts --verbose
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_ANON_KEY - Supabase anon key for auth
 *   TEST_USER_EMAIL - Email for test user (optional)
 *   TEST_USER_PASSWORD - Password for test user (optional)
 */

import { createClient } from '@supabase/supabase-js';

// Stage order and expected outputs
const PIPELINE_STAGES = [
  { name: 'questions', required: true, expectedFields: ['questions'] },
  { name: 'research', required: true, expectedFields: ['researchResults', 'assignments'] },
  { name: 'challenge', required: false, expectedFields: ['challenges', 'challengeResponses'] },
  { name: 'synthesis', required: true, expectedFields: ['syntheses'] },
  { name: 'review', required: true, expectedFields: ['review'] },
  { name: 'voting', required: true, expectedFields: ['votes'] },
  { name: 'spec', required: true, expectedFields: ['specification'] },
] as const;

interface StageResult {
  stage: string;
  success: boolean;
  latencyMs: number;
  error?: string;
  outputKeys: string[];
  modelUsed?: string;
}

interface SmokeTestConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionUrl: string;
  testInput: string;
  verbose: boolean;
  targetStage?: string;
}

async function getAuthToken(config: SmokeTestConfig): Promise<string> {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123';

  // Try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Try to sign up if sign in fails
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      throw new Error(`Auth failed: ${signUpError.message}`);
    }

    return signUpData.session?.access_token || '';
  }

  return signInData.session?.access_token || '';
}

async function callStage(
  config: SmokeTestConfig,
  token: string,
  stage: string,
  roundData: Record<string, unknown> = {},
  agentConfigs?: unknown[]
): Promise<{ data: Record<string, unknown>; latencyMs: number }> {
  const startTime = Date.now();

  const body: Record<string, unknown> = {
    stage,
    roundData,
  };

  if (stage === 'questions') {
    body.userInput = config.testInput;
  }

  if (agentConfigs) {
    body.agentConfigs = agentConfigs;
  }

  const response = await fetch(config.functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stage ${stage} failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return { data, latencyMs };
}

function getDefaultAgentConfigs() {
  return [
    { id: 'elon', agent: 'Elon', systemPrompt: 'Tech visionary', temperature: 0.7, enabled: true },
    { id: 'steve', agent: 'Steve', systemPrompt: 'Product designer', temperature: 0.7, enabled: true },
    { id: 'jony', agent: 'Jony', systemPrompt: 'Design expert', temperature: 0.7, enabled: true },
    { id: 'amal', agent: 'Amal', systemPrompt: 'Legal expert', temperature: 0.7, enabled: true },
    { id: 'bartlett', agent: 'Bartlett', systemPrompt: 'Business strategist', temperature: 0.7, enabled: true },
    { id: 'zaha', agent: 'Zaha', systemPrompt: 'Architect', temperature: 0.7, enabled: true },
    { id: 'oprah', agent: 'Oprah', systemPrompt: 'User empathy', temperature: 0.7, enabled: true },
  ];
}

async function runSmokeTest(config: SmokeTestConfig): Promise<StageResult[]> {
  const results: StageResult[] = [];
  let roundData: Record<string, unknown> = {};

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('PIPELINE SMOKE TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Test Input: "${config.testInput}"`);
  console.log(`Function URL: ${config.functionUrl}`);
  console.log(`Target Stage: ${config.targetStage || 'all'}\n`);

  // Get auth token
  console.log('Authenticating...');
  let token: string;
  try {
    token = await getAuthToken(config);
    console.log('✅ Authentication successful\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return [{ stage: 'auth', success: false, latencyMs: 0, error: String(error), outputKeys: [] }];
  }

  const agentConfigs = getDefaultAgentConfigs();

  // Run each stage
  for (const stageConfig of PIPELINE_STAGES) {
    if (config.targetStage && stageConfig.name !== config.targetStage) {
      continue;
    }

    console.log(`───────────────────────────────────────────────────────────────`);
    console.log(`Stage: ${stageConfig.name.toUpperCase()}`);
    console.log(`───────────────────────────────────────────────────────────────`);

    try {
      const { data, latencyMs } = await callStage(
        config,
        token,
        stageConfig.name,
        roundData,
        agentConfigs
      );

      const outputKeys = Object.keys(data);
      const missingFields = stageConfig.expectedFields.filter(
        (f) => !outputKeys.includes(f) && !Object.keys(data).some((k) => data[k] && typeof data[k] === 'object')
      );

      const success = missingFields.length === 0;

      results.push({
        stage: stageConfig.name,
        success,
        latencyMs,
        outputKeys,
        modelUsed: (data as Record<string, unknown>).model as string | undefined,
      });

      // Merge data into roundData for next stage
      roundData = { ...roundData, ...data };

      console.log(`✅ ${stageConfig.name}: ${latencyMs}ms`);
      if (config.verbose) {
        console.log(`   Output keys: ${outputKeys.join(', ')}`);
        if (missingFields.length > 0) {
          console.log(`   Missing fields: ${missingFields.join(', ')}`);
        }
      }
    } catch (error) {
      results.push({
        stage: stageConfig.name,
        success: false,
        latencyMs: 0,
        error: String(error),
        outputKeys: [],
      });

      console.log(`❌ ${stageConfig.name}: FAILED`);
      console.log(`   Error: ${error}`);

      if (stageConfig.required) {
        console.log('\n⚠️  Required stage failed, stopping pipeline\n');
        break;
      }
    }
  }

  return results;
}

function printSummary(results: StageResult[]) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const successCount = results.filter((r) => r.success).length;
  const totalLatency = results.reduce((sum, r) => sum + r.latencyMs, 0);

  console.log('| Stage      | Status | Latency (ms) |');
  console.log('|------------|--------|--------------|');

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const latency = result.latencyMs.toString().padStart(12);
    console.log(`| ${result.stage.padEnd(10)} | ${status} | ${latency} |`);
  }

  console.log('|------------|--------|--------------|');
  console.log(`| Total      |        | ${totalLatency.toString().padStart(12)} |`);
  console.log('');

  console.log(`Result: ${successCount}/${results.length} stages passed`);
  console.log(`Total Latency: ${totalLatency}ms (${(totalLatency / 1000).toFixed(2)}s)`);

  return successCount === results.length ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const stageIndex = args.indexOf('--stage');
  const targetStage = stageIndex !== -1 ? args[stageIndex + 1] : undefined;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL');
    console.error('   SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const config: SmokeTestConfig = {
    supabaseUrl,
    supabaseAnonKey,
    functionUrl: `${supabaseUrl}/functions/v1/multi-agent-spec`,
    testInput: 'A mobile app for tracking personal carbon footprint with gamification',
    verbose,
    targetStage,
  };

  const results = await runSmokeTest(config);
  const exitCode = printSummary(results);

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});
