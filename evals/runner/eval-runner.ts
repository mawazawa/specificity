#!/usr/bin/env npx tsx
/**
 * Eval Runner - Main evaluation execution script
 *
 * Runs evals against live Supabase edge functions.
 * Usage: npx tsx evals/runner/eval-runner.ts [--baseline baselines/latest.json]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { getRubric, type Rubric, type RubricName } from '../scoring/rubrics';
import { grade } from '../scoring/graders';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface TestCase {
  id: string;
  input: string;
  description?: string;
  [key: string]: unknown;
}

interface EvalResult {
  testId: string;
  stage: string;
  score: number;
  passed: boolean;
  duration: number;
  model?: string;
  criteriaResults: CriterionResult[];
  error?: string;
}

interface CriterionResult {
  name: string;
  score: number;
  passed: boolean;
  weight: number;
  details: string;
}

interface EvalSummary {
  runId: string;
  timestamp: string;
  gitSha?: string;
  totalTests: number;
  passed: number;
  failed: number;
  aggregateScore: number;
  stages: StageResult[];
}

interface StageResult {
  stage: string;
  tests: number;
  passed: number;
  averageScore: number;
  threshold: number;
}

interface Baseline {
  aggregateScore: number;
  stages: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || 'https://tkkthpoottlqmdopmtuh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || '';
const EVAL_AUTH_TOKEN = process.env.EVAL_AUTH_TOKEN || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EDGE_TIMEOUT_MS = Number(process.env.EVAL_EDGE_TIMEOUT_MS || 45000);

// Test user credentials for authentication
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || process.env.TESTUSERNAME || '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.TESTPASSWORD || '';

// Auth token gets set after authentication
let AUTH_TOKEN = '';

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: { id: string; email: string };
}

/**
 * Authenticate against Supabase to obtain a user JWT for edge function calls.
 */
async function authenticate(): Promise<string> {
  if (EVAL_AUTH_TOKEN) {
    return EVAL_AUTH_TOKEN;
  }

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.warn('⚠️  TEST_USER_EMAIL or TEST_USER_PASSWORD not set');
    console.warn('   Edge function calls may fail without valid user JWT');
    return '';
  }

  console.log(`🔐 Authenticating as ${TEST_USER_EMAIL}...`);

  const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json() as AuthResponse;
    console.log(`✅ Authenticated successfully (user: ${data.user.id})\n`);

    return data.access_token;
  } catch (error) {
    console.error(`❌ Authentication failed: ${error}`);
    console.warn('   Auth failed - set TEST_USER_EMAIL/TEST_USER_PASSWORD or EVAL_AUTH_TOKEN');
    return '';
  }
}

const STAGE_MAPPINGS: Record<string, { rubric: string; endpoint: string }> = {
  questions: { rubric: 'question-generation', endpoint: 'multi-agent-spec' },
  research: { rubric: 'research-citations', endpoint: 'multi-agent-spec' },
  spec: { rubric: 'spec-completeness', endpoint: 'multi-agent-spec' },
};

const STAGE_ENDPOINTS: Record<string, string> = {
  questions: 'multi-agent-spec',
  research: 'multi-agent-spec',
  synthesis: 'multi-agent-spec',
  voting: 'multi-agent-spec',
  spec: 'multi-agent-spec',
  challenge: 'multi-agent-spec',
  review: 'multi-agent-spec',
};

const PIPELINES: Record<string, string[]> = {
  questions: ['questions'],
  research: ['questions', 'research'],
  spec: ['questions', 'research', 'synthesis', 'voting', 'spec'],
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT AGENT CONFIGS (for research stage)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_AGENT_CONFIGS = [
  {
    agent: 'elon',
    systemPrompt: 'You are Elon Musk. Challenge everything with first-principles thinking. Ask: Can this scale to 100M+ users? What\'s the 10x solution? Is this bold enough? Prioritize massive impact, revolutionary technology, and exponential growth. Question conventional wisdom relentlessly.',
    temperature: 0.8,
    enabled: true,
  },
  {
    agent: 'steve',
    systemPrompt: 'You are Steve Jobs. Obsess over every detail of the user experience. Ask: Is this absolutely essential? Does it spark joy and delight? Is the design pure and iconic? Remove anything that doesn\'t serve the core vision. Make every interaction magical and intuitive.',
    temperature: 0.7,
    enabled: true,
  },
  {
    agent: 'oprah',
    systemPrompt: 'You are Oprah Winfrey. Center human stories and emotional truth. Ask: How does this empower people? What\'s the deeper impact on lives? Is this authentic and inclusive? Focus on transformation, connection, and uplifting communities. Lead with empathy and purpose.',
    temperature: 0.75,
    enabled: true,
  },
  {
    agent: 'zaha',
    systemPrompt: 'You are Zaha Hadid. Push boundaries of form and space. Ask: How can we break conventional design rules? What fluid, organic shapes can we explore? Is this architecturally bold and sculptural? Create experiences that are visually striking and spatially innovative.',
    temperature: 0.85,
    enabled: true,
  },
  {
    agent: 'jony',
    systemPrompt: 'You are Jony Ive. Pursue absolute simplicity and refined craftsmanship. Ask: Can we remove this? What materials honor the design? Is every detail intentional? Focus on purity, restraint, and the essential nature of things. Make the complex beautifully simple.',
    temperature: 0.6,
    enabled: true,
  },
  {
    agent: 'bartlett',
    systemPrompt: 'You are Steven Bartlett. Drive aggressive growth and market disruption. Ask: How do we acquire 1M users in 6 months? What\'s the viral loop? Is this disruptive enough? Focus on modern business models, data-driven decisions, and rapid scaling strategies.',
    temperature: 0.75,
    enabled: true,
  },
  {
    agent: 'amal',
    systemPrompt: 'You are Amal Clooney. Protect rights and ensure ethical compliance. Ask: What are the legal risks? How do we safeguard user privacy and data? Is this ethical and fair? Focus on regulatory compliance, human rights, and building trust through responsible practices.',
    temperature: 0.5,
    enabled: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION CALLER
// ═══════════════════════════════════════════════════════════════

interface StageOutput {
  questions?: Array<{ id: string; question: string; domain: string }>;
  researchResults?: Array<{ expertId: string; findings: string; toolsUsed: unknown[] }>;
  assignments?: unknown[];
  challenges?: unknown[];
  challengeResponses?: unknown[];
  debateResolutions?: unknown[];
  syntheses?: unknown[];
  votes?: unknown[];
  metadata?: { totalToolsUsed?: number; model?: string };
  spec?: string;
  techStack?: unknown[];
  [key: string]: unknown;
}

/**
 * Merge stage output into a cumulative roundData object.
 */
function mergeRoundData(roundData: Record<string, unknown>, stage: string, output: StageOutput): void {
  if (stage === 'questions') {
    roundData.questions = output.questions || [];
    return;
  }

  if (stage === 'research') {
    roundData.researchResults = output.researchResults || [];
    roundData.assignments = output.assignments || [];
    roundData.researchMetadata = output.metadata || {};
    return;
  }

  if (stage === 'challenge') {
    roundData.challenges = output.challenges || [];
    roundData.challengeResponses = output.challengeResponses || [];
    roundData.debateResolutions = output.debateResolutions || [];
    roundData.challengeMetadata = output.metadata || {};
    return;
  }

  if (stage === 'synthesis') {
    roundData.syntheses = output.syntheses || [];
    roundData.synthesisMetadata = output.metadata || {};
    return;
  }

  if (stage === 'voting') {
    roundData.votes = output.votes || [];
  }
}

/**
 * Resolve rubric parameters against per-test expectations.
 */
function resolveCriterionParams(
  params: Record<string, unknown>,
  testCase: TestCase
): Record<string, unknown> {
  const resolved = { ...params };

  if (typeof resolved.minField === 'string' && testCase[resolved.minField] !== undefined) {
    resolved.min = Number(testCase[resolved.minField]);
  }

  if (typeof resolved.expectedField === 'string' && testCase[resolved.expectedField] !== undefined) {
    resolved.expected = testCase[resolved.expectedField];
  }

  if (typeof resolved.requiredField === 'string' && testCase[resolved.requiredField] !== undefined) {
    resolved.required = testCase[resolved.requiredField];
  }

  return resolved;
}

/**
 * Build the payload for a multi-agent-spec stage call.
 */
function buildPayload(
  stage: string,
  input: string,
  roundData: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { stage };

  if (stage === 'questions' || stage === 'research' || stage === 'challenge') {
    payload.userInput = input;
  }

  if (stage !== 'questions') {
    payload.roundData = roundData;
  }

  if (stage === 'research' || stage === 'challenge' || stage === 'voting' || stage === 'chat') {
    payload.agentConfigs = DEFAULT_AGENT_CONFIGS;
  }

  return payload;
}

/**
 * Execute the stage pipeline required for a target eval stage.
 */
async function runStagePipeline(
  targetStage: string,
  input: string
): Promise<{ output: StageOutput; roundData: Record<string, unknown>; model?: string }> {
  const pipeline = PIPELINES[targetStage];
  if (!pipeline) {
    throw new Error(`No pipeline configured for stage: ${targetStage}`);
  }

  const roundData: Record<string, unknown> = {};
  let output: StageOutput = {};
  let model: string | undefined;

  for (const stage of pipeline) {
    const { data, duration, model: stageModel } = await callEdgeFunction(stage, input, roundData);
    mergeRoundData(roundData, stage, data);
    output = data;
    model = stageModel || model;
    console.log(`    • ${stage} completed in ${duration}ms`);
  }

  return { output, roundData, model };
}

async function callEdgeFunction(
  stage: string,
  input: string,
  roundData: Record<string, unknown>
): Promise<{ data: StageOutput; duration: number; model?: string }> {
  const endpoint = STAGE_ENDPOINTS[stage];
  if (!endpoint) throw new Error(`Unknown stage: ${stage}`);

  const url = `${SUPABASE_URL}/functions/v1/${endpoint}`;
  const start = Date.now();

  const payload = buildPayload(stage, input, roundData);

  try {
    if (!AUTH_TOKEN) {
      throw new Error('Missing auth token for edge function calls');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json() as StageOutput;
    const duration = Date.now() - start;

    return {
      data,
      duration,
      model: data?.metadata?.model,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Edge function call failed: timeout after ${EDGE_TIMEOUT_MS}ms`);
    }
    throw new Error(`Edge function call failed: ${error}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════

async function runTest(
  testCase: TestCase,
  stage: string,
  rubric: Rubric
): Promise<EvalResult> {
  const start = Date.now();

  try {
    // Run stage pipeline and capture final output
    const { output: data, model } = await runStagePipeline(stage, testCase.input);

    // Grade each criterion
    const criteriaResults: CriterionResult[] = [];

    for (const criterion of rubric.criteria) {
      const resolvedParams = resolveCriterionParams(criterion.params || {}, testCase);
      const result = await grade(
        criterion.scorer,
        data,
        resolvedParams,
        undefined  // No LLM client in CI mode
      );

      criteriaResults.push({
        name: criterion.name,
        score: result.score,
        passed: result.passed,
        weight: criterion.weight,
        details: result.details,
      });
    }

    // Calculate weighted score
    const weightedScore = criteriaResults.reduce(
      (sum, r) => sum + (r.score * r.weight),
      0
    );

    return {
      testId: testCase.id,
      stage,
      score: Math.round(weightedScore),
      passed: weightedScore >= rubric.threshold,
      duration: Date.now() - start,
      model,
      criteriaResults,
    };
  } catch (error) {
    return {
      testId: testCase.id,
      stage,
      score: 0,
      passed: false,
      duration: Date.now() - start,
      criteriaResults: [],
      error: String(error),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// DATASET LOADER
// ═══════════════════════════════════════════════════════════════

function loadDataset(datasetPath: string): TestCase[] {
  const content = fs.readFileSync(datasetPath, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function getDatasetForStage(stage: string): TestCase[] {
  const datasetDir = path.join(__dirname, '..', 'datasets', stage);
  const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.jsonl'));

  const testCases: TestCase[] = [];
  for (const file of files) {
    testCases.push(...loadDataset(path.join(datasetDir, file)));
  }

  return testCases;
}

// ═══════════════════════════════════════════════════════════════
// BASELINE COMPARISON
// ═══════════════════════════════════════════════════════════════

function loadBaseline(baselinePath: string): Baseline | null {
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
}

function compareToBaseline(summary: EvalSummary, baseline: Baseline): boolean {
  const regressionThreshold = 5;  // Allow 5% regression

  // Check aggregate score
  if (summary.aggregateScore < baseline.aggregateScore - regressionThreshold) {
    console.error(
      `❌ Aggregate score regression: ${summary.aggregateScore}% < ${baseline.aggregateScore}% - ${regressionThreshold}%`
    );
    return false;
  }

  // Check per-stage scores
  for (const stage of summary.stages) {
    const baselineScore = baseline.stages[stage.stage];
    if (baselineScore && stage.averageScore < baselineScore - regressionThreshold) {
      console.error(
        `❌ Stage "${stage.stage}" regression: ${stage.averageScore}% < ${baselineScore}% - ${regressionThreshold}%`
      );
      return false;
    }
  }

  return true;
}

/**
 * Persist eval results to Supabase if service role key is available.
 */
async function persistEvalResults(
  summary: EvalSummary,
  results: EvalResult[],
  baselineComparison?: Record<string, unknown>
): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping eval persistence');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };

  const runPayload = {
    run_id: summary.runId,
    git_sha: summary.gitSha,
    total_tests: summary.totalTests,
    passed: summary.passed,
    failed: summary.failed,
    aggregate_score: summary.aggregateScore,
    stage_results: summary.stages,
    baseline_comparison: baselineComparison || null,
  };

  const resultsPayload = results.map(result => ({
    run_id: summary.runId,
    stage: result.stage,
    test_id: result.testId,
    score: result.score,
    passed: result.passed,
    model_used: result.model,
    git_sha: summary.gitSha,
    duration_ms: result.duration,
    criteria_results: result.criteriaResults,
    error: result.error || null,
  }));

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/eval_runs`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(runPayload),
    });

    await fetch(`${SUPABASE_URL}/rest/v1/eval_results`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(resultsPayload),
    });

    console.log('✅ Eval results persisted to Supabase');
  } catch (error) {
    console.warn(`⚠️  Failed to persist eval results: ${error}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           EVAL RUNNER - Specificity AI                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Parse args
  const args = process.argv.slice(2);
  const baselineArg = args.find(a => a.startsWith('--baseline'));
  const baselinePath = baselineArg
    ? args[args.indexOf(baselineArg) + 1]
    : null;

  // Authenticate before running evals
  AUTH_TOKEN = await authenticate();

  const runId = randomUUID();
  const results: EvalResult[] = [];

  // Run evals for each stage
  for (const [stage, mapping] of Object.entries(STAGE_MAPPINGS)) {
    console.log(`\n▶ Running ${stage} evals...\n`);

    const rubric = getRubric(mapping.rubric as RubricName);
    let testCases: TestCase[];

    try {
      testCases = getDatasetForStage(stage);
    } catch {
      console.log(`  No datasets found for ${stage}, skipping\n`);
      continue;
    }

    for (const testCase of testCases) {
      console.log(`  Testing: ${testCase.id} - ${testCase.description || testCase.input.slice(0, 40)}...`);

      const result = await runTest(testCase, stage, rubric);
      results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`    ${status} Score: ${result.score}% (threshold: ${rubric.threshold}%)`);

      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }
  }

  // Calculate summary
  const stages = [...new Set(results.map(r => r.stage))];
  const stageResults: StageResult[] = stages.map(stage => {
    const stageTests = results.filter(r => r.stage === stage);
    const rubric = getRubric(STAGE_MAPPINGS[stage].rubric as RubricName);
    return {
      stage,
      tests: stageTests.length,
      passed: stageTests.filter(r => r.passed).length,
      averageScore: stageTests.length > 0
        ? Math.round(stageTests.reduce((sum, r) => sum + r.score, 0) / stageTests.length)
        : 0,
      threshold: rubric.threshold,
    };
  });

  const summary: EvalSummary = {
    runId,
    timestamp: new Date().toISOString(),
    gitSha: process.env.GITHUB_SHA,
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    aggregateScore: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0,
    stages: stageResults,
  };

  // Print summary
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log('\n📊 SUMMARY\n');
  console.log(`  Run ID: ${summary.runId}`);
  console.log(`  Total: ${summary.totalTests} tests`);
  console.log(`  Passed: ${summary.passed}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Aggregate Score: ${summary.aggregateScore}%`);

  console.log('\n  Per-Stage Results:');
  for (const stage of stageResults) {
    const status = stage.averageScore >= stage.threshold ? '✅' : '❌';
    console.log(
      `    ${status} ${stage.stage}: ${stage.averageScore}% (${stage.passed}/${stage.tests} passed, threshold: ${stage.threshold}%)`
    );
  }

  // Baseline comparison
  let baselineComparison: Record<string, unknown> | undefined;
  if (baselinePath) {
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('\n🔄 BASELINE COMPARISON\n');

    const baseline = loadBaseline(baselinePath);
    if (baseline) {
      const passed = compareToBaseline(summary, baseline);
      baselineComparison = {
        baselinePath,
        passed,
        regressionThreshold: 5,
      };
      if (passed) {
        console.log('  ✅ No regressions detected');
      }
    } else {
      console.log(`  ⚠️  Baseline not found: ${baselinePath}`);
    }
  }

  await persistEvalResults(summary, results, baselineComparison);

  // Exit code
  const overallPassed = summary.aggregateScore >= 75;  // Global threshold
  console.log('\n───────────────────────────────────────────────────────────────');

  if (overallPassed) {
    console.log('\n✅ EVAL SUITE PASSED\n');
    process.exit(0);
  } else {
    console.log('\n❌ EVAL SUITE FAILED\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
