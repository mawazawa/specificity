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
import { getRubric, type Rubric, type RubricCriterion } from '../scoring/rubrics';
import { grade, type GradeResult } from '../scoring/graders';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tkkthpoottlqmdopmtuh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// For CI evals, we need a test user JWT or service role bypass
// The edge function expects a valid JWT; for evals we use a dedicated test token
const EVAL_AUTH_TOKEN = process.env.EVAL_AUTH_TOKEN || SUPABASE_ANON_KEY;

const STAGE_MAPPINGS: Record<string, { rubric: string; endpoint: string }> = {
  questions: { rubric: 'question-generation', endpoint: 'multi-agent-spec' },
  research: { rubric: 'research-citations', endpoint: 'multi-agent-spec' },
  spec: { rubric: 'spec-completeness', endpoint: 'multi-agent-spec' },
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT AGENT CONFIGS (for research stage)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_AGENT_CONFIGS = [
  {
    agent: 'Technical Architect',
    systemPrompt: 'You are a senior technical architect. Focus on system design, scalability, and technical feasibility.',
    temperature: 0.7,
    enabled: true,
  },
  {
    agent: 'Market Analyst',
    systemPrompt: 'You are a market research analyst. Focus on market size, competition, and business viability.',
    temperature: 0.7,
    enabled: true,
  },
  {
    agent: 'Security Expert',
    systemPrompt: 'You are a security specialist. Focus on security requirements, compliance, and risk mitigation.',
    temperature: 0.6,
    enabled: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// EDGE FUNCTION CALLER
// ═══════════════════════════════════════════════════════════════

interface StageOutput {
  questions?: Array<{ id: string; question: string; domain: string }>;
  researchResults?: Array<{ expertId: string; findings: string; toolsUsed: unknown[] }>;
  metadata?: { totalToolsUsed?: number; model?: string };
  spec?: string;
  [key: string]: unknown;
}

async function callEdgeFunction(
  stage: string,
  input: string,
  previousStageOutput?: StageOutput
): Promise<{ data: StageOutput; duration: number; model?: string }> {
  const mapping = STAGE_MAPPINGS[stage];
  if (!mapping) throw new Error(`Unknown stage: ${stage}`);

  const url = `${SUPABASE_URL}/functions/v1/${mapping.endpoint}`;
  const start = Date.now();

  // Build payload per stage requirements (see multi-agent-spec/lib/types.ts)
  let payload: Record<string, unknown> = { stage };

  if (stage === 'questions') {
    // Questions stage: just needs userInput
    payload.userInput = input;
  } else if (stage === 'research') {
    // Research stage: needs agentConfigs and roundData with questions
    payload.userInput = input;
    payload.agentConfigs = DEFAULT_AGENT_CONFIGS;
    payload.roundData = {
      questions: previousStageOutput?.questions || [],
    };
  } else if (stage === 'spec') {
    // Spec stage: needs full roundData from synthesis
    payload.roundData = previousStageOutput || {};
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EVAL_AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

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
    // Call edge function
    const { data, duration, model } = await callEdgeFunction(stage, testCase.input);

    // Grade each criterion
    const criteriaResults: CriterionResult[] = [];

    for (const criterion of rubric.criteria) {
      const result = await grade(
        criterion.scorer,
        data,
        criterion.params || {},
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
      duration,
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

  // Check environment
  if (!SUPABASE_ANON_KEY) {
    console.warn('⚠️  SUPABASE_ANON_KEY not set - running in mock mode\n');
  }

  const runId = `eval-${Date.now()}`;
  const results: EvalResult[] = [];

  // Run evals for each stage
  for (const [stage, mapping] of Object.entries(STAGE_MAPPINGS)) {
    console.log(`\n▶ Running ${stage} evals...\n`);

    const rubric = getRubric(mapping.rubric as any);
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
    const rubric = getRubric(STAGE_MAPPINGS[stage].rubric as any);
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
  if (baselinePath) {
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('\n🔄 BASELINE COMPARISON\n');

    const baseline = loadBaseline(baselinePath);
    if (baseline) {
      const passed = compareToBaseline(summary, baseline);
      if (passed) {
        console.log('  ✅ No regressions detected');
      }
    } else {
      console.log(`  ⚠️  Baseline not found: ${baselinePath}`);
    }
  }

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
