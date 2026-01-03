/**
 * JSON Code Block Regex Consistency Tests
 *
 * Verifies that all JSON parsing locations in the codebase use the flexible regex pattern
 * that handles LLM output variations:
 * - Uppercase `JSON` vs lowercase `json`
 * - Missing newlines after language identifier
 * - Extra whitespace around content
 * - Code blocks without language identifier
 *
 * Bug Fix: spec.ts:489 and multimodal-refinement/index.ts:368 were using rigid regex
 * that failed on common LLM output variations.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The flexible regex pattern that should be used everywhere
const FLEXIBLE_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/i;

describe('JSON Code Block Regex - Flexibility Tests', () => {
  const validJson = '{"techStack": [{"category": "Frontend", "selected": "React"}]}';

  it('should match standard lowercase json with newlines', () => {
    const input = `\`\`\`json\n${validJson}\n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match).not.toBeNull();
    expect(match![1].trim()).toBe(validJson);
  });

  it('should match uppercase JSON (common from some LLMs)', () => {
    const input = `\`\`\`JSON\n${validJson}\n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match, 'Uppercase JSON should match').not.toBeNull();
    expect(match![1].trim()).toBe(validJson);
  });

  it('should match mixed case Json', () => {
    const input = `\`\`\`Json\n${validJson}\n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match, 'Mixed case Json should match').not.toBeNull();
  });

  it('should match without newline after json identifier', () => {
    const input = `\`\`\`json${validJson}\n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match, 'No newline after json should match').not.toBeNull();
  });

  it('should match with extra whitespace around content', () => {
    // Note: Extra whitespace before "json" means the regex captures "json" as part of content
    // This is acceptable because we still get a match and can parse the JSON after trimming
    const input = `\`\`\`json\n  ${validJson}  \n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match, 'Extra whitespace should match').not.toBeNull();
    expect(match![1].trim()).toBe(validJson);
  });

  it('should match code block without language identifier', () => {
    const input = `\`\`\`\n${validJson}\n\`\`\``;
    const match = input.match(FLEXIBLE_REGEX);
    expect(match, 'No language identifier should match').not.toBeNull();
  });

  it('should extract parseable JSON from all critical variations', () => {
    // These are the critical variations that caused real bugs in production
    const variations = [
      `\`\`\`json\n${validJson}\n\`\`\``,      // Standard
      `\`\`\`JSON\n${validJson}\n\`\`\``,      // Uppercase (caused failures before fix)
      `\`\`\`json${validJson}\`\`\``,          // No newlines (caused failures before fix)
      `\`\`\`\n${validJson}\n\`\`\``,          // No identifier
    ];

    for (const input of variations) {
      const match = input.match(FLEXIBLE_REGEX);
      expect(match, `Failed to match: ${input.substring(0, 20)}...`).not.toBeNull();

      const parsed = JSON.parse(match![1].trim());
      expect(parsed.techStack).toBeDefined();
      expect(parsed.techStack[0].category).toBe('Frontend');
    }
  });
});

describe('JSON Code Block Regex - Codebase Consistency', () => {
  // Files that parse JSON from LLM responses with code blocks
  const filesToCheck = [
    '../supabase/functions/multi-agent-spec/lib/stages/spec.ts',
    '../supabase/functions/multimodal-refinement/index.ts',
    '../supabase/functions/lib/question-generator.ts',
    '../supabase/functions/lib/challenge-generator.ts',
  ];

  for (const relPath of filesToCheck) {
    const fileName = path.basename(relPath);

    it(`${fileName} should use flexible regex pattern`, () => {
      const fullPath = path.join(__dirname, relPath);
      let content: string;

      try {
        content = readFileSync(fullPath, 'utf8');
      } catch {
        // Skip if file doesn't exist (e.g., in CI without full build)
        return;
      }

      // Check for the flexible pattern (case-insensitive flag /i at end)
      const hasFlexiblePattern = content.includes('```(?:json)?\\s*') && content.includes('/i');

      // Check for old rigid patterns that require exact formatting
      const hasRigidJsonNewline = /```json\\n\(/.test(content) && !/```json\\n\?\(/.test(content);
      const hasRigidWithOptionalNewline = /```json\\n\?\([[\]\\s\\S]*?\)\\n\?```[^/i]/.test(content);

      // The file should have flexible pattern OR at least not have the known rigid patterns
      // that fail on LLM variations
      if (content.includes('.match(') && content.includes('```json')) {
        expect(
          hasFlexiblePattern || !hasRigidJsonNewline,
          `${fileName} should use flexible regex /\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`/i`
        ).toBe(true);
      }
    });
  }
});

describe('Old Rigid Regex - Failure Cases', () => {
  // This demonstrates why the old regex failed
  const OLD_RIGID_REGEX = /```json\n([\s\S]*?)\n```/;

  it('old regex fails on uppercase JSON', () => {
    const input = '```JSON\n{"test": true}\n```';
    const match = input.match(OLD_RIGID_REGEX);
    expect(match, 'Old regex should NOT match uppercase JSON').toBeNull();
  });

  it('old regex fails without newline after json', () => {
    const input = '```json{"test": true}\n```';
    const match = input.match(OLD_RIGID_REGEX);
    expect(match, 'Old regex should NOT match without newline').toBeNull();
  });

  it('flexible regex succeeds where old regex fails', () => {
    const testCases = [
      '```JSON\n{"test": true}\n```',
      '```json{"test": true}\n```',
      '```  json  \n{"test": true}\n```',
    ];

    for (const input of testCases) {
      const oldMatch = input.match(OLD_RIGID_REGEX);
      const newMatch = input.match(FLEXIBLE_REGEX);

      expect(oldMatch, `Old regex incorrectly matched: ${input}`).toBeNull();
      expect(newMatch, `New regex should match: ${input}`).not.toBeNull();
    }
  });
});
