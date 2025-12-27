/**
 * Unit Tests for utility functions
 * Tests safeJsonParse and other utilities in src/lib/utils.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of utility functions for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function safeJsonParse<T>(
  jsonString: string | null | undefined,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  if (!jsonString) {
    return { success: false, error: 'No data to parse' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    return { success: false, error: errorMessage };
  } catch (error) {
    const message = error instanceof SyntaxError
      ? 'Invalid JSON syntax'
      : 'Failed to parse data';
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('simpleHash', () => {
  it('should return consistent hash for same input', () => {
    const input = 'test string';
    const hash1 = simpleHash(input);
    const hash2 = simpleHash(input);

    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = simpleHash('input1');
    const hash2 = simpleHash('input2');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string', () => {
    const hash = simpleHash('');
    expect(hash).toBe('0');
  });

  it('should handle long strings', () => {
    const longString = 'a'.repeat(10000);
    const hash = simpleHash(longString);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('should handle unicode characters', () => {
    const hash = simpleHash('Hello 世界 🌍');
    expect(hash).toBeDefined();
  });
});

describe('safeJsonParse', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email().optional()
  });

  describe('success cases', () => {
    it('should parse valid JSON matching schema', () => {
      const json = JSON.stringify({ name: 'John', age: 30 });
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('should parse JSON with optional fields', () => {
      const json = JSON.stringify({
        name: 'Jane',
        age: 25,
        email: 'jane@example.com'
      });
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane@example.com');
      }
    });
  });

  describe('null/undefined handling', () => {
    it('should fail gracefully for null input', () => {
      const result = safeJsonParse(null, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No data to parse');
      }
    });

    it('should fail gracefully for undefined input', () => {
      const result = safeJsonParse(undefined, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No data to parse');
      }
    });

    it('should fail gracefully for empty string', () => {
      const result = safeJsonParse('', testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No data to parse');
      }
    });
  });

  describe('invalid JSON handling', () => {
    it('should fail for malformed JSON', () => {
      const result = safeJsonParse('{invalid json}', testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON syntax');
      }
    });

    it('should fail for truncated JSON', () => {
      const result = safeJsonParse('{"name": "John"', testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON syntax');
      }
    });

    it('should fail for non-JSON string', () => {
      const result = safeJsonParse('just a plain string', testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON syntax');
      }
    });
  });

  describe('schema validation failures', () => {
    it('should fail when required field is missing', () => {
      const json = JSON.stringify({ name: 'John' }); // missing 'age'
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('age');
      }
    });

    it('should fail when field has wrong type', () => {
      const json = JSON.stringify({ name: 'John', age: 'thirty' }); // age should be number
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('age');
      }
    });

    it('should fail when optional field has invalid format', () => {
      const json = JSON.stringify({
        name: 'John',
        age: 30,
        email: 'not-an-email'
      });
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('email');
      }
    });

    it('should report multiple validation errors', () => {
      const json = JSON.stringify({
        name: 123, // should be string
        age: 'thirty' // should be number
      });
      const result = safeJsonParse(json, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('name');
        expect(result.error).toContain('age');
      }
    });
  });

  describe('complex schema validation', () => {
    const complexSchema = z.object({
      dialogueEntries: z.array(z.object({
        agent: z.string(),
        message: z.string(),
        timestamp: z.string()
      })),
      sessionState: z.object({
        rounds: z.array(z.unknown()),
        currentRound: z.number(),
        isPaused: z.boolean()
      }),
      generatedSpec: z.string(),
      timestamp: z.string()
    });

    it('should parse valid complex session data', () => {
      const sessionData = {
        dialogueEntries: [
          { agent: 'elon', message: 'Hello', timestamp: '2025-01-01' }
        ],
        sessionState: {
          rounds: [],
          currentRound: 0,
          isPaused: false
        },
        generatedSpec: '# Spec',
        timestamp: '2025-01-01T00:00:00Z'
      };

      const result = safeJsonParse(JSON.stringify(sessionData), complexSchema);
      expect(result.success).toBe(true);
    });

    it('should fail for invalid nested structure', () => {
      const invalidData = {
        dialogueEntries: [
          { agent: 'elon' } // missing required fields
        ],
        sessionState: {
          rounds: [],
          currentRound: 0,
          isPaused: false
        },
        generatedSpec: '# Spec',
        timestamp: '2025-01-01'
      };

      const result = safeJsonParse(JSON.stringify(invalidData), complexSchema);
      expect(result.success).toBe(false);
    });
  });

  describe('security considerations', () => {
    it('should handle potentially malicious input safely', () => {
      const maliciousInputs = [
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '<script>alert("xss")</script>',
        '{"name": "<script>alert(1)</script>", "age": 30}'
      ];

      maliciousInputs.forEach(input => {
        // Should not throw
        expect(() => safeJsonParse(input, testSchema)).not.toThrow();
      });
    });

    it('should reject script tags in string values through schema', () => {
      const safeStringSchema = z.object({
        name: z.string().regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed'),
        age: z.number()
      });

      const json = JSON.stringify({
        name: '<script>alert(1)</script>',
        age: 30
      });

      const result = safeJsonParse(json, safeStringSchema);
      expect(result.success).toBe(false);
    });
  });
});
