#!/usr/bin/env npx tsx
/**
 * run-all-lints.ts - Master orchestrator for all governance lints
 *
 * Runs all lint scripts and aggregates results.
 * Exit code 0 = all passed, 1 = any failed.
 *
 * Usage: npx tsx scripts/lint/run-all-lints.ts
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';

interface LintRun {
  name: string;
  script: string;
  passed: boolean;
  duration: number;
  output: string;
}

const LINTS = [
  { name: 'Doc Lint', script: 'doc-lint.ts' },
  { name: 'Root Lint', script: 'root-lint.ts' },
  { name: 'Model Lint', script: 'model-lint.ts' },
  { name: 'Plan Lint', script: 'plan-lint.ts' },
];

async function runLint(lint: { name: string; script: string }): Promise<LintRun> {
  const scriptPath = path.join(process.cwd(), 'scripts/lint', lint.script);
  const start = Date.now();

  return new Promise((resolve) => {
    try {
      const output = execSync(`npx tsx ${scriptPath}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000, // 60 second timeout
      });

      resolve({
        name: lint.name,
        script: lint.script,
        passed: true,
        duration: Date.now() - start,
        output,
      });
    } catch (error: any) {
      resolve({
        name: lint.name,
        script: lint.script,
        passed: false,
        duration: Date.now() - start,
        output: error.stdout || error.stderr || error.message,
      });
    }
  });
}

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           GOVERNANCE LINT SUITE - Specificity AI              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`Running ${LINTS.length} lints...\n`);
  console.log('───────────────────────────────────────────────────────────────\n');

  const results: LintRun[] = [];

  for (const lint of LINTS) {
    console.log(`▶ Running ${lint.name}...`);
    const result = await runLint(lint);
    results.push(result);

    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`  ${status} (${result.duration}ms)\n`);
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log('\n📊 SUMMARY\n');

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  console.log(`  Passed: ${passed.length}/${results.length}`);
  console.log(`  Failed: ${failed.length}/${results.length}`);
  console.log(`  Total time: ${results.reduce((sum, r) => sum + r.duration, 0)}ms\n`);

  if (failed.length > 0) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log('\n❌ FAILED LINTS:\n');

    for (const result of failed) {
      console.log(`\n▼ ${result.name} (${result.script})\n`);
      console.log(result.output);
    }

    console.log('\n───────────────────────────────────────────────────────────────');
    console.log('\n❌ GOVERNANCE LINT SUITE FAILED\n');
    console.log('Fix the above issues and re-run: npm run lint:governance\n');
    process.exit(1);
  }

  console.log('───────────────────────────────────────────────────────────────');
  console.log('\n✅ GOVERNANCE LINT SUITE PASSED\n');
  console.log('All governance checks verified.\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
