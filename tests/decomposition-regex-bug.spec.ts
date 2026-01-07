/**
 * Decomposition JSON Parsing Regex Bug Test
 *
 * Bug: The decomposition stage used a broken regex pattern that failed to extract
 * JSON from code blocks with uppercase JSON, missing language identifiers, or
 * extra whitespace.
 *
 * Old pattern: /```json\n?|\n?```/g (replace-based, case-sensitive, missed variants)
 * New pattern: /```(?:json)?\s*([\s\S]*?)\s*```/i (match-based, case-insensitive, flexible)
 *
 * This test verifies the fix handles all LLM output variations correctly.
 */

import { describe, it, expect } from 'vitest';

// The OLD broken regex pattern (for comparison)
const OLD_BROKEN_REGEX_REPLACE = /```json\n?|\n?```/g;

// The NEW fixed regex pattern (matches the fix in decomposition.ts)
const NEW_FLEXIBLE_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/i;

// Valid JSON that should be extracted
const VALID_TICKETS_JSON = '[{"id":"TICKET-1","title":"Setup Project","type":"setup","complexity":"S"}]';

describe('Decomposition JSON Extraction - Bug Fix Verification', () => {

  describe('OLD broken regex - demonstrates the bug', () => {

    it('OLD regex FAILS with preamble text (real-world LLM output)', () => {
      // Real LLM responses often include preamble text before the code block
      const llmResponse = `Here are the implementation tickets:

\`\`\`json
${VALID_TICKETS_JSON}
\`\`\`

These tickets cover the initial setup.`;

      // Old approach: use replace to strip only the markers, not surrounding text
      const extracted = llmResponse.replace(OLD_BROKEN_REGEX_REPLACE, '');

      // BUG: The old regex strips the markers but leaves surrounding text
      // The extracted string now contains "Here are the implementation tickets:"
      expect(extracted).toContain('Here are the implementation tickets');

      // This causes JSON.parse to fail because of surrounding text
      expect(() => JSON.parse(extracted.trim())).toThrow();
    });

    it('OLD regex leaves orphan "json" text in output', () => {
      // When the LLM uses uppercase JSON, the old regex doesn't match ```JSON
      // but DOES match the closing \n```
      const llmResponse = '```JSON\n' + VALID_TICKETS_JSON + '\n```';

      const extracted = llmResponse.replace(OLD_BROKEN_REGEX_REPLACE, '');

      // BUG: The ```JSON opening is NOT matched (case-sensitive)
      // but the trailing \n``` IS matched by /\n?```/
      // Result: "JSON\n[...json...]" with orphan "JSON\n" prefix
      expect(extracted.startsWith('JSON')).toBe(true);

      // This causes JSON.parse to fail due to the "JSON\n" prefix
      expect(() => JSON.parse(extracted)).toThrow();
    });

    it('OLD regex cannot extract from middle of response', () => {
      // Many LLMs include explanation before AND after the code block
      const llmResponse = `I'll create atomic tickets for you:
\`\`\`json
${VALID_TICKETS_JSON}
\`\`\`
Let me know if you need more detail.`;

      const extracted = llmResponse.replace(OLD_BROKEN_REGEX_REPLACE, '');

      // BUG: Replace approach removes markers but keeps ALL surrounding text
      // Cannot extract JUST the JSON content
      expect(extracted).toContain("I'll create atomic tickets");
      expect(extracted).toContain("Let me know if you need more detail");

      // Cannot parse because of surrounding text
      expect(() => JSON.parse(extracted.trim())).toThrow();
    });
  });

  describe('NEW fixed regex - verifies the fix works', () => {

    it('NEW regex handles lowercase json tag', () => {
      const llmResponse = '```json\n' + VALID_TICKETS_JSON + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('TICKET-1');
    });

    it('NEW regex handles UPPERCASE JSON tag', () => {
      const llmResponse = '```JSON\n' + VALID_TICKETS_JSON + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('TICKET-1');
    });

    it('NEW regex handles mixed case Json tag', () => {
      const llmResponse = '```Json\n' + VALID_TICKETS_JSON + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
    });

    it('NEW regex handles code block without language identifier', () => {
      const llmResponse = '```\n' + VALID_TICKETS_JSON + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
    });

    it('NEW regex handles no newline after json tag', () => {
      const llmResponse = '```json' + VALID_TICKETS_JSON + '```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
    });

    it('NEW regex handles extra whitespace around content', () => {
      const llmResponse = '```json\n  ' + VALID_TICKETS_JSON + '  \n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const extracted = match![1].trim();
      const parsed = JSON.parse(extracted);

      expect(parsed).toHaveLength(1);
    });

    it('NEW regex falls back gracefully when no code block markers', () => {
      // Some LLMs return raw JSON without code blocks
      const llmResponse = VALID_TICKETS_JSON;

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);

      // No match, so we fall back to using raw content
      expect(match).toBeNull();

      // Fallback: use the raw content directly
      const jsonContent = match ? match[1] : llmResponse.trim();
      const parsed = JSON.parse(jsonContent);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('TICKET-1');
    });
  });

  describe('Real-world LLM output variations', () => {

    it('handles GPT-style response with preamble', () => {
      const llmResponse = `Here are the implementation tickets:

\`\`\`json
${VALID_TICKETS_JSON}
\`\`\`

These tickets cover the initial setup phase.`;

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const parsed = JSON.parse(match![1].trim());
      expect(parsed).toHaveLength(1);
    });

    it('handles response with tickets wrapper object', () => {
      const wrappedJson = '{"tickets":' + VALID_TICKETS_JSON + '}';
      const llmResponse = '```json\n' + wrappedJson + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      const parsed = JSON.parse(match![1].trim());

      // Code handles both array and {tickets: []} format
      const tickets = Array.isArray(parsed) ? parsed : parsed.tickets || [];
      expect(tickets).toHaveLength(1);
    });

    it('handles complex nested ticket structure', () => {
      const complexTickets = `[
        {
          "id": "TICKET-1",
          "title": "Database Schema Setup",
          "type": "setup",
          "complexity": "M",
          "dependencies": [],
          "acceptance_criteria": [
            "Given the schema is applied",
            "When I query the tables",
            "Then all expected columns exist"
          ],
          "files_to_create": ["supabase/migrations/001_initial.sql"]
        }
      ]`;

      const llmResponse = '```JSON\n' + complexTickets + '\n```';

      const match = llmResponse.match(NEW_FLEXIBLE_REGEX);
      expect(match).not.toBeNull();

      const parsed = JSON.parse(match![1].trim());
      expect(parsed).toHaveLength(1);
      expect(parsed[0].acceptance_criteria).toHaveLength(3);
    });
  });
});
