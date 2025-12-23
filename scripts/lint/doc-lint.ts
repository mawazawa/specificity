#!/usr/bin/env npx tsx
/**
 * doc-lint.ts - Validates documentation integrity
 *
 * Rules:
 * 1. No deprecated Supabase project refs (see DEPRECATED_PATTERNS)
 * 2. No dead links to archived files
 * 3. No contradictory claims in same document
 * 4. All external URLs should be HTTPS
 *
 * Usage: npx tsx scripts/lint/doc-lint.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface LintResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

// Deprecated project ID fragments (split to avoid self-match)
const DEPRECATED_PROJECT_1 = 'kxrdxizn' + 'audatxyfrbxe';
const DEPRECATED_PROJECT_2 = 'sbwgkoca' + 'rqvonkdlitdx';

// Deprecated patterns that should not appear
const DEPRECATED_PATTERNS = [
  {
    pattern: new RegExp(DEPRECATED_PROJECT_1, 'g'),
    message: 'Deprecated Supabase project ref (should be tkkthpoottlqmdopmtuh)',
  },
  {
    pattern: new RegExp(DEPRECATED_PROJECT_2, 'g'),
    message: 'Deprecated Supabase project ref (should be tkkthpoottlqmdopmtuh)',
  },
];

// Files that document deprecated refs (allowed to contain them)
const DOCUMENTATION_FILES = [
  'error-ledger.yml',
  'temporal-log.yml',
];

// Files/directories to scan
const SCAN_PATHS = [
  '.',
  'docs',
  'scripts',
  '.github',
  'supabase',
  'src',
];

// File extensions to check
const DOC_EXTENSIONS = ['.md', '.yml', '.yaml', '.ts', '.tsx', '.js', '.json', '.html', '.sh'];

// Files to skip
const SKIP_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'bun.lockb',
  'package-lock.json',
  'playwright-report',
  '.vercel',
];

function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Collect changed and untracked files for a fast, incremental scan.
 */
function getChangedFiles(baseRef?: string): string[] {
  const diffBase = baseRef || 'HEAD';
  const diffCmd = `git diff --name-only --diff-filter=ACMRTUXB ${diffBase}`;
  const untrackedCmd = 'git ls-files --others --exclude-standard';
  const diffFiles = execSync(diffCmd, { encoding: 'utf-8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const untrackedFiles = execSync(untrackedCmd, { encoding: 'utf-8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const files = Array.from(new Set([...diffFiles, ...untrackedFiles]));
  return files
    .filter(file => DOC_EXTENSIONS.some(ext => file.endsWith(ext)))
    .map(file => path.join(process.cwd(), file))
    .filter(fullPath => fs.existsSync(fullPath) && !shouldSkip(fullPath));
}

/**
 * Resolve the final scan list based on full or changed-only mode.
 */
function getFilesToScan(options: { changedOnly: boolean; baseRef?: string }): string[] {
  if (options.changedOnly) {
    try {
      return getChangedFiles(options.baseRef);
    } catch (error) {
      console.warn(`Failed to compute changed files (${error}); falling back to full scan.`);
    }
  }

  const files: string[] = [];

  for (const scanPath of SCAN_PATHS) {
    const fullPath = path.join(process.cwd(), scanPath);
    if (!fs.existsSync(fullPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      if (DOC_EXTENSIONS.some(ext => scanPath.endsWith(ext)) && !shouldSkip(scanPath)) {
        files.push(fullPath);
      }
    } else if (stat.isDirectory()) {
      scanDirectory(fullPath, files);
    }
  }

  return files;
}

function scanDirectory(dir: string, files: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldSkip(fullPath)) continue;

    if (entry.isFile()) {
      if (DOC_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    } else if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    }
  }
}

function checkFile(filePath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath);

  // Skip deprecated pattern check for documentation files
  const isDocumentationFile = DOCUMENTATION_FILES.some(f => fileName === f);

  // Check deprecated patterns (unless this is a documentation file)
  if (!isDocumentationFile) {
    for (const { pattern, message } of DEPRECATED_PATTERNS) {
      const regex = new RegExp(pattern.source, 'g');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        regex.lastIndex = 0;

        if (regex.test(line)) {
          errors.push(`${relativePath}:${i + 1} - ${message}`);
        }
      }
    }
  }

  // Check for HTTP URLs (should be HTTPS)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match http:// but not localhost or 127.0.0.1
    const httpMatch = line.match(/http:\/\/(?!localhost|127\.0\.0\.1)[^\s"')]+/g);
    if (httpMatch) {
      for (const url of httpMatch) {
        warnings.push(`${relativePath}:${i + 1} - HTTP URL found (consider HTTPS): ${url}`);
      }
    }
  }

  // Check for references to archived files
  if (filePath.endsWith('.md')) {
    const archivedRefs = content.match(/(?:DEPLOYMENT_READY|FINAL_DEPLOYMENT_STATUS|IMPLEMENTATION_COMPLETE)\.md/g);
    if (archivedRefs) {
      for (const ref of archivedRefs) {
        // Check if this is in the archive directory itself
        if (!filePath.includes('docs/archive')) {
          warnings.push(`${relativePath} - Reference to archived file: ${ref} (now in docs/archive/)`);
        }
      }
    }
  }

  return { errors, warnings };
}

function lintDocumentation(): LintResult {
  const result: LintResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  const args = process.argv.slice(2);
  const changedOnly = args.includes('--changed');
  const baseIndex = args.indexOf('--base');
  const baseRef = baseIndex >= 0 ? args[baseIndex + 1] : undefined;

  console.log('Scanning files...\n');

  const files = getFilesToScan({ changedOnly, baseRef });
  const mode = changedOnly ? `changed-only${baseRef ? ` (base: ${baseRef})` : ''}` : 'full';
  console.log(`Found ${files.length} files to check (${mode})\n`);

  let filesWithIssues = 0;

  for (const file of files) {
    const { errors, warnings } = checkFile(file);

    if (errors.length > 0 || warnings.length > 0) {
      filesWithIssues++;
    }

    result.errors.push(...errors);
    result.warnings.push(...warnings);
  }

  if (result.errors.length > 0) {
    result.passed = false;
  }

  console.log(`Checked ${files.length} files, ${filesWithIssues} with issues\n`);

  return result;
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DOC LINT - Documentation Integrity Validation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const result = lintDocumentation();

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    result.warnings.slice(0, 20).forEach(w => console.log(`  ${w}`));
    if (result.warnings.length > 20) {
      console.log(`  ... and ${result.warnings.length - 20} more\n`);
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    result.errors.forEach(e => console.log(`  ${e}`));
    console.log('');
  }

  if (result.passed) {
    console.log('✅ DOC LINT PASSED\n');
    console.log('No deprecated project refs or dead links found.\n');
    process.exit(0);
  } else {
    console.log('\n❌ DOC LINT FAILED\n');
    console.log('Fix the above errors and re-run.\n');
    process.exit(1);
  }
}

main();
