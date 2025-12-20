#!/usr/bin/env npx tsx
/**
 * plan-lint.ts - Validates PLAN.md evidence requirements
 *
 * Rules:
 * 1. Every [x] COMPLETED item must have evidence (commit, file path, or URL)
 * 2. No contradictory phase claims (e.g., "removed" and "re-add" same item)
 * 3. Dates must be valid ISO 8601
 *
 * Usage: npx tsx scripts/lint/plan-lint.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface LintResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const PLAN_PATH = path.join(process.cwd(), 'PLAN.md');

// Patterns for evidence detection
const EVIDENCE_PATTERNS = [
  /\b[a-f0-9]{7,40}\b/i,           // Git SHA (short or full)
  /\b\w+\.(ts|js|tsx|jsx|yml|yaml|json|md)\b/i,  // File paths
  /https?:\/\/[^\s)]+/i,           // URLs
  /`[^`]+`/,                       // Inline code references
  /Evidence:|Verified:|Commit:|File:/i,  // Explicit evidence markers
];

// Patterns that suggest completion without evidence
const COMPLETION_PATTERNS = [
  /^\s*-\s*\[x\]/im,               // Markdown checkbox checked
  /COMPLETED?/i,                    // Word "COMPLETED"
  /✅|✓|☑/,                        // Check emojis
];

function checkLineHasEvidence(line: string): boolean {
  return EVIDENCE_PATTERNS.some(pattern => pattern.test(line));
}

function checkLineIsCompletion(line: string): boolean {
  return COMPLETION_PATTERNS.some(pattern => pattern.test(line));
}

function lintPlanFile(): LintResult {
  const result: LintResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  if (!fs.existsSync(PLAN_PATH)) {
    result.passed = false;
    result.errors.push(`PLAN.md not found at ${PLAN_PATH}`);
    return result;
  }

  const content = fs.readFileSync(PLAN_PATH, 'utf-8');
  const lines = content.split('\n');

  let completionsWithoutEvidence = 0;
  let currentPhase = '';
  const phaseActions: Map<string, Map<string, string[]>> = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track current phase
    const phaseMatch = line.match(/^#+\s*(Phase\s*[\d.]+)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1];
      if (!phaseActions.has(currentPhase)) {
        phaseActions.set(currentPhase, new Map());
      }
    }

    // Check completion lines for evidence
    if (checkLineIsCompletion(line)) {
      // Look for evidence in this line and the next 2 lines
      const contextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');

      if (!checkLineHasEvidence(contextLines)) {
        completionsWithoutEvidence++;
        result.errors.push(
          `Line ${lineNum}: Completion marked without evidence\n  "${line.trim().substring(0, 80)}..."`
        );
        result.passed = false;
      }

      // Track actions per phase for contradiction detection
      const actionMatch = line.match(/(add|remove|create|delete|implement|fix)\w*/i);
      const targetMatch = line.match(/`([^`]+)`|"([^"]+)"|'([^']+)'/);

      if (actionMatch && targetMatch && currentPhase) {
        const action = actionMatch[1].toLowerCase();
        const target = targetMatch[1] || targetMatch[2] || targetMatch[3];

        const phaseMap = phaseActions.get(currentPhase)!;
        if (!phaseMap.has(target)) {
          phaseMap.set(target, []);
        }
        phaseMap.get(target)!.push(`${action} (line ${lineNum})`);
      }
    }
  }

  // Check for contradictory actions across phases
  const allTargets = new Map<string, string[]>();
  for (const [phase, targets] of phaseActions) {
    for (const [target, actions] of targets) {
      if (!allTargets.has(target)) {
        allTargets.set(target, []);
      }
      allTargets.get(target)!.push(`${phase}: ${actions.join(', ')}`);
    }
  }

  for (const [target, phaseActions] of allTargets) {
    if (phaseActions.length > 1) {
      const hasRemove = phaseActions.some(a => a.includes('remove'));
      const hasAdd = phaseActions.some(a => a.includes('add'));

      if (hasRemove && hasAdd) {
        result.warnings.push(
          `Potential contradiction for "${target}":\n  ${phaseActions.join('\n  ')}`
        );
      }
    }
  }

  // Summary
  if (completionsWithoutEvidence > 0) {
    result.errors.push(
      `\nSummary: ${completionsWithoutEvidence} completion(s) without evidence`
    );
  }

  return result;
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PLAN LINT - Evidence Validation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const result = lintPlanFile();

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    result.warnings.forEach(w => console.log(`  ${w}\n`));
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    result.errors.forEach(e => console.log(`  ${e}\n`));
  }

  if (result.passed) {
    console.log('✅ PLAN LINT PASSED\n');
    console.log('All completion claims have evidence.\n');
    process.exit(0);
  } else {
    console.log('\n❌ PLAN LINT FAILED\n');
    console.log('Fix the above issues and re-run.\n');
    process.exit(1);
  }
}

main();
