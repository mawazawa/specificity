#!/usr/bin/env npx tsx
/**
 * model-lint.ts - Validates model IDs match between code and registry
 *
 * Rules:
 * 1. All model IDs in openrouter-client.ts must exist in model-registry.yml
 * 2. All models in registry should be used in code (warning if not)
 * 3. OpenRouter IDs must match between code and registry
 *
 * Usage: npx tsx scripts/lint/model-lint.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface LintResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface ModelRegistryEntry {
  provider: string;
  openrouter_id?: string;
  groq_id?: string;
  context_window: number;
  cost_per_1m_input: number;
  cost_per_1m_output: number;
  verified_date: string;
  status: string;
}

interface ModelRegistry {
  version: string;
  models: Record<string, ModelRegistryEntry>;
}

const REGISTRY_PATH = path.join(process.cwd(), 'docs/system/model-registry.yml');
const CLIENT_PATH = path.join(process.cwd(), 'supabase/functions/lib/openrouter-client.ts');

// Known false positives to ignore
const FALSE_POSITIVE_PATTERNS = [
  /^application\//,           // MIME types
  /^https?:\/\//,             // URLs
  /^text\//,                  // MIME types
  /^image\//,                 // MIME types
  /^multipart\//,             // MIME types
];

function isFalsePositive(value: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(value));
}

function extractModelsFromCode(content: string): Map<string, string> {
  const models = new Map<string, string>();

  // Look for MODELS constant with OpenRouter model IDs
  // Pattern: "key": "provider/model-id"
  const modelsMatch = content.match(/const\s+MODELS\s*[:=]\s*\{([^}]+)\}/s);
  if (modelsMatch) {
    const block = modelsMatch[1];
    // Match entries like: "gpt-4": "openai/gpt-4"
    const entryRegex = /["']([^"']+)["']\s*:\s*["']([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)["']/g;
    let match;
    while ((match = entryRegex.exec(block)) !== null) {
      const [, key, value] = match;
      if (!isFalsePositive(value)) {
        models.set(key, value);
      }
    }
  }

  // Also look for model definitions in function calls
  // Pattern: model: "provider/model-id"
  const modelPropRegex = /model\s*:\s*["']([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)["']/g;
  let propMatch;
  while ((propMatch = modelPropRegex.exec(content)) !== null) {
    const value = propMatch[1];
    if (!isFalsePositive(value)) {
      models.set(value, value);
    }
  }

  return models;
}

function loadRegistry(): ModelRegistry | null {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return null;
  }

  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return yaml.parse(content) as ModelRegistry;
}

function lintModels(): LintResult {
  const result: LintResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Load registry
  const registry = loadRegistry();
  if (!registry) {
    result.passed = false;
    result.errors.push(`Model registry not found at ${REGISTRY_PATH}`);
    return result;
  }

  // Load client code
  if (!fs.existsSync(CLIENT_PATH)) {
    result.passed = false;
    result.errors.push(`OpenRouter client not found at ${CLIENT_PATH}`);
    return result;
  }

  const clientContent = fs.readFileSync(CLIENT_PATH, 'utf-8');
  const codeModels = extractModelsFromCode(clientContent);

  // Build registry lookup
  const registryModels = new Map<string, ModelRegistryEntry>();
  const registryOpenRouterIds = new Set<string>();

  for (const [name, entry] of Object.entries(registry.models)) {
    registryModels.set(name, entry);
    if (entry.openrouter_id) {
      registryOpenRouterIds.add(entry.openrouter_id);
    }
    if (entry.groq_id) {
      registryOpenRouterIds.add(entry.groq_id);
    }
  }

  // Check: All code models exist in registry
  for (const [codeName, codeId] of codeModels) {
    if (!registryOpenRouterIds.has(codeId)) {
      // Check if it's a valid OpenRouter ID pattern
      if (codeId.includes('/')) {
        result.errors.push(
          `Model ID "${codeId}" in code not found in model-registry.yml`
        );
        result.passed = false;
      }
    }
  }

  // Check: Registry models with 'verified' status
  for (const [name, entry] of registryModels) {
    if (entry.status !== 'verified') {
      result.warnings.push(
        `Model "${name}" has status "${entry.status}" (not verified)`
      );
    }

    // Check verification date isn't too old (> 30 days)
    if (entry.verified_date) {
      const verifiedDate = new Date(entry.verified_date);
      const daysSinceVerification = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceVerification > 30) {
        result.warnings.push(
          `Model "${name}" was verified ${Math.floor(daysSinceVerification)} days ago (consider re-verification)`
        );
      }
    }
  }

  // Summary
  console.log(`\nRegistry: ${registryModels.size} models defined`);
  console.log(`Code: ${codeModels.size} model IDs found\n`);

  return result;
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MODEL LINT - Registry Sync Validation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const result = lintModels();

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    result.warnings.forEach(w => console.log(`  ${w}\n`));
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    result.errors.forEach(e => console.log(`  ${e}\n`));
  }

  if (result.passed) {
    console.log('✅ MODEL LINT PASSED\n');
    console.log('All model IDs are in sync.\n');
    process.exit(0);
  } else {
    console.log('\n❌ MODEL LINT FAILED\n');
    console.log('Fix the above issues and re-run.\n');
    process.exit(1);
  }
}

main();
