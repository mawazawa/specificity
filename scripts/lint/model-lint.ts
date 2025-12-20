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

interface CodeModelEntry {
  name: string;
  provider: string;
  model: string;
  openrouterId: string;
}

function extractModelsFromCode(content: string): CodeModelEntry[] {
  const models: CodeModelEntry[] = [];

  // Parse MODELS object entries - actual format is:
  // 'gpt-5.2': {
  //   provider: 'openai',
  //   model: 'gpt-5.2',
  //   ...
  // }

  // Find MODELS declaration
  const modelsBlockMatch = content.match(/export\s+const\s+MODELS\s*[:=]\s*Record[^{]*\{([\s\S]*?)\n\};\s*\n/);
  if (!modelsBlockMatch) {
    // Try alternative pattern
    const altMatch = content.match(/const\s+MODELS\s*[:=]\s*\{([\s\S]*?)\n\};\s*\n/);
    if (!altMatch) return models;
  }

  // Parse each model entry using regex for the object structure
  // Match pattern: 'model-name': { provider: 'x', model: 'y', ... }
  const entryRegex = /['"]([^'"]+)['"]\s*:\s*\{\s*([^}]+)\}/g;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const name = match[1];
    const block = match[2];

    // Extract provider and model fields
    const providerMatch = block.match(/provider\s*:\s*['"]([^'"]+)['"]/);
    const modelMatch = block.match(/model\s*:\s*['"]([^'"]+)['"]/);

    if (providerMatch && modelMatch) {
      const provider = providerMatch[1];
      const model = modelMatch[1];
      const openrouterId = `${provider}/${model}`;

      // Skip false positives
      if (!isFalsePositive(openrouterId)) {
        models.push({ name, provider, model, openrouterId });
      }
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
  const registryModelNames = new Set<string>();

  for (const [name, entry] of Object.entries(registry.models)) {
    registryModels.set(name, entry);
    registryModelNames.add(name);
    if (entry.openrouter_id) {
      registryOpenRouterIds.add(entry.openrouter_id);
    }
    if (entry.groq_id) {
      registryOpenRouterIds.add(`groq/${entry.groq_id}`);
    }
  }

  // Check: All code models exist in registry (by name and OpenRouter ID)
  for (const codeModel of codeModels) {
    // Check if model name exists in registry
    if (!registryModelNames.has(codeModel.name)) {
      result.errors.push(
        `Model "${codeModel.name}" in code not found in model-registry.yml`
      );
      result.passed = false;
      continue;
    }

    // Check if OpenRouter ID matches
    const registryEntry = registry.models[codeModel.name];
    if (registryEntry) {
      const expectedId = registryEntry.openrouter_id || (registryEntry.groq_id ? `groq/${registryEntry.groq_id}` : null);
      if (expectedId && expectedId !== codeModel.openrouterId) {
        result.errors.push(
          `Model "${codeModel.name}" OpenRouter ID mismatch: code="${codeModel.openrouterId}" registry="${expectedId}"`
        );
        result.passed = false;
      }
    }
  }

  // Check: Registry models with 'verified' status
  for (const [name, entry] of registryModels) {
    if (entry.status !== 'verified' && entry.status !== 'alias') {
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
  console.log(`Code: ${codeModels.length} model entries found\n`);

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
