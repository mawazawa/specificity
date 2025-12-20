#!/usr/bin/env npx tsx
/**
 * root-lint.ts - Validates root directory hygiene
 *
 * Rules:
 * 1. All files at repo root must be in root-allowlist.yml
 * 2. All directories at repo root must be in root-allowlist.yml
 * 3. Warn on files marked as archive_candidate
 * 4. Enforce max file/directory counts
 *
 * Usage: npx tsx scripts/lint/root-lint.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface LintResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface AllowedFile {
  name: string;
  purpose: string;
  required?: boolean;
  gitignored?: boolean;
  archive_candidate?: boolean;
}

interface AllowedDirectory {
  name: string;
  purpose: string;
  gitignored?: boolean;
}

interface LintRules {
  fail_on_unknown_file: boolean;
  fail_on_unknown_directory: boolean;
  warn_on_archive_candidate: boolean;
  max_root_files: number;
  max_root_directories: number;
}

interface RootAllowlist {
  version: string;
  allowed_files: AllowedFile[];
  allowed_directories: AllowedDirectory[];
  ignored_patterns: string[];
  lint_rules: LintRules;
}

const ALLOWLIST_PATH = path.join(process.cwd(), 'docs/system/root-allowlist.yml');
const ROOT_DIR = process.cwd();

function loadAllowlist(): RootAllowlist | null {
  if (!fs.existsSync(ALLOWLIST_PATH)) {
    return null;
  }

  const content = fs.readFileSync(ALLOWLIST_PATH, 'utf-8');
  return yaml.parse(content) as RootAllowlist;
}

function matchesPattern(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.startsWith('*')) {
      // Wildcard suffix match
      const suffix = pattern.slice(1);
      if (name.endsWith(suffix)) return true;
    } else if (pattern.endsWith('*')) {
      // Wildcard prefix match
      const prefix = pattern.slice(0, -1);
      if (name.startsWith(prefix)) return true;
    } else if (name === pattern) {
      return true;
    }
  }
  return false;
}

function lintRootDirectory(): LintResult {
  const result: LintResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Load allowlist
  const allowlist = loadAllowlist();
  if (!allowlist) {
    result.passed = false;
    result.errors.push(`Root allowlist not found at ${ALLOWLIST_PATH}`);
    return result;
  }

  const rules = allowlist.lint_rules;

  // Build lookup sets
  const allowedFileNames = new Set(allowlist.allowed_files.map(f => f.name));
  const allowedDirNames = new Set(allowlist.allowed_directories.map(d => d.name));
  const archiveCandidates = new Set(
    allowlist.allowed_files
      .filter(f => f.archive_candidate)
      .map(f => f.name)
  );
  const requiredFiles = allowlist.allowed_files
    .filter(f => f.required)
    .map(f => f.name);

  // Read root directory
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });

  let fileCount = 0;
  let dirCount = 0;
  const foundFiles: string[] = [];
  const foundDirs: string[] = [];

  for (const entry of entries) {
    const name = entry.name;

    // Skip ignored patterns
    if (matchesPattern(name, allowlist.ignored_patterns)) {
      continue;
    }

    if (entry.isFile()) {
      fileCount++;
      foundFiles.push(name);

      if (!allowedFileNames.has(name)) {
        if (rules.fail_on_unknown_file) {
          result.errors.push(`Unknown file at root: "${name}"`);
          result.passed = false;
        } else {
          result.warnings.push(`Unknown file at root: "${name}"`);
        }
      } else if (archiveCandidates.has(name) && rules.warn_on_archive_candidate) {
        result.warnings.push(`Archive candidate at root: "${name}" (consider moving to docs/archive/)`);
      }
    } else if (entry.isDirectory()) {
      dirCount++;
      foundDirs.push(name);

      if (!allowedDirNames.has(name)) {
        if (rules.fail_on_unknown_directory) {
          result.errors.push(`Unknown directory at root: "${name}"`);
          result.passed = false;
        } else {
          result.warnings.push(`Unknown directory at root: "${name}"`);
        }
      }
    }
  }

  // Check required files exist
  for (const required of requiredFiles) {
    if (!foundFiles.includes(required)) {
      // Check if it's gitignored (expected to not exist in some envs)
      const fileConfig = allowlist.allowed_files.find(f => f.name === required);
      if (!fileConfig?.gitignored) {
        result.errors.push(`Required file missing: "${required}"`);
        result.passed = false;
      }
    }
  }

  // Check counts
  if (fileCount > rules.max_root_files) {
    result.warnings.push(
      `Root has ${fileCount} files (max: ${rules.max_root_files}). Consider archiving some.`
    );
  }

  if (dirCount > rules.max_root_directories) {
    result.warnings.push(
      `Root has ${dirCount} directories (max: ${rules.max_root_directories}).`
    );
  }

  // Summary
  console.log(`\nRoot directory scan:`);
  console.log(`  Files: ${fileCount} (max: ${rules.max_root_files})`);
  console.log(`  Directories: ${dirCount} (max: ${rules.max_root_directories})\n`);

  return result;
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ROOT LINT - Repository Hygiene Validation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const result = lintRootDirectory();

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    result.warnings.forEach(w => console.log(`  ${w}\n`));
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    result.errors.forEach(e => console.log(`  ${e}\n`));
  }

  if (result.passed) {
    console.log('✅ ROOT LINT PASSED\n');
    console.log('All root files and directories are allowed.\n');
    process.exit(0);
  } else {
    console.log('\n❌ ROOT LINT FAILED\n');
    console.log('Fix the above issues and re-run.\n');
    process.exit(1);
  }
}

main();
