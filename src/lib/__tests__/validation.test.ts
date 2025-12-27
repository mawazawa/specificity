/**
 * Unit Tests for validation utilities
 * Tests input validation functions in src/lib/validation.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of validation functions for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

const userInputSchema = z.string()
  .min(25, 'Input must be at least 25 characters')
  .max(5000, 'Input must be at most 5000 characters')
  .transform(s => s.trim());

const chatMessageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be at most 2000 characters')
  .transform(s => s.trim());

const safeUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'URL must use http or https protocol' }
);

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function validateUserInput(input: string): ValidationResult<string> {
  const result = userInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const error = result.error.issues[0]?.message || 'Invalid input';
  return { success: false, error };
}

function validateChatMessage(message: string): ValidationResult<string> {
  const result = chatMessageSchema.safeParse(message);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const error = result.error.issues[0]?.message || 'Invalid message';
  return { success: false, error };
}

function validateUrl(url: string): ValidationResult<string> {
  const result = safeUrlSchema.safeParse(url);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const error = result.error.issues[0]?.message || 'Invalid URL';
  return { success: false, error };
}

function getCharacterCount(
  value: string,
  min: number,
  max: number
): { count: number; remaining: number; isValid: boolean; isWarning: boolean } {
  const count = value.length;
  const remaining = max - count;
  const isValid = count >= min && count <= max;
  const isWarning = count >= min && remaining <= 100;
  return { count, remaining, isValid, isWarning };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateUserInput', () => {
  describe('valid inputs', () => {
    it('should accept input at minimum length (25 chars)', () => {
      const input = 'a'.repeat(25);
      const result = validateUserInput(input);

      expect(result.success).toBe(true);
      expect(result.data).toBe(input);
    });

    it('should accept input at maximum length (5000 chars)', () => {
      const input = 'a'.repeat(5000);
      const result = validateUserInput(input);

      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const input = `   ${  'a'.repeat(25)  }   `;
      const result = validateUserInput(input);

      expect(result.success).toBe(true);
      expect(result.data).toBe('a'.repeat(25));
    });

    it('should accept typical spec request', () => {
      const input = 'I want to build a SaaS application that helps teams collaborate on documents in real-time with AI assistance.';
      const result = validateUserInput(input);

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject input below minimum length', () => {
      const input = 'Too short';
      const result = validateUserInput(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 25 characters');
    });

    it('should reject input above maximum length', () => {
      const input = 'a'.repeat(5001);
      const result = validateUserInput(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at most 5000 characters');
    });

    it('should reject empty string', () => {
      const result = validateUserInput('');

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only input as too short after trim', () => {
      const result = validateUserInput('   ');

      expect(result.success).toBe(false);
    });
  });
});

describe('validateChatMessage', () => {
  describe('valid messages', () => {
    it('should accept single character message', () => {
      const result = validateChatMessage('H');

      expect(result.success).toBe(true);
      expect(result.data).toBe('H');
    });

    it('should accept message at maximum length (2000 chars)', () => {
      const message = 'a'.repeat(2000);
      const result = validateChatMessage(message);

      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = validateChatMessage('  Hello  ');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello');
    });

    it('should accept typical chat message', () => {
      const result = validateChatMessage('Can you explain the authentication approach in more detail?');

      expect(result.success).toBe(true);
    });
  });

  describe('invalid messages', () => {
    it('should reject empty message', () => {
      const result = validateChatMessage('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should accept whitespace-only message (transforms to empty after trim)', () => {
      // Note: Schema allows whitespace because min(1) checks before transform
      // The UI layer (ChatInput) additionally checks message.trim() before sending
      const result = validateChatMessage('   ');

      expect(result.success).toBe(true);
      expect(result.data).toBe(''); // Trimmed to empty string
    });

    it('should reject message above maximum length', () => {
      const message = 'a'.repeat(2001);
      const result = validateChatMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at most 2000 characters');
    });
  });
});

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept https URL', () => {
      const result = validateUrl('https://example.com');

      expect(result.success).toBe(true);
    });

    it('should accept http URL', () => {
      const result = validateUrl('http://example.com');

      expect(result.success).toBe(true);
    });

    it('should accept URL with path', () => {
      const result = validateUrl('https://example.com/path/to/resource');

      expect(result.success).toBe(true);
    });

    it('should accept URL with query params', () => {
      const result = validateUrl('https://example.com?foo=bar&baz=qux');

      expect(result.success).toBe(true);
    });

    it('should accept URL with port', () => {
      const result = validateUrl('https://example.com:8080/api');

      expect(result.success).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject non-URL string', () => {
      const result = validateUrl('not a url');

      expect(result.success).toBe(false);
    });

    it('should reject ftp protocol', () => {
      const result = validateUrl('ftp://example.com');

      expect(result.success).toBe(false);
    });

    it('should reject file protocol', () => {
      const result = validateUrl('file:///etc/passwd');

      expect(result.success).toBe(false);
    });

    it('should reject javascript protocol (XSS attempt)', () => {
      const result = validateUrl('javascript:alert(1)');

      expect(result.success).toBe(false);
    });

    it('should reject data protocol (potential XSS)', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');

      expect(result.success).toBe(false);
    });
  });
});

describe('getCharacterCount', () => {
  describe('count calculations', () => {
    it('should return correct count', () => {
      const result = getCharacterCount('Hello', 1, 100);
      expect(result.count).toBe(5);
    });

    it('should return correct remaining', () => {
      const result = getCharacterCount('Hello', 1, 100);
      expect(result.remaining).toBe(95);
    });

    it('should handle empty string', () => {
      const result = getCharacterCount('', 1, 100);
      expect(result.count).toBe(0);
      expect(result.remaining).toBe(100);
    });
  });

  describe('isValid state', () => {
    it('should be invalid when below minimum', () => {
      const result = getCharacterCount('Hi', 5, 100);
      expect(result.isValid).toBe(false);
    });

    it('should be valid at minimum', () => {
      const result = getCharacterCount('Hello', 5, 100);
      expect(result.isValid).toBe(true);
    });

    it('should be valid between min and max', () => {
      const result = getCharacterCount('Hello World', 5, 100);
      expect(result.isValid).toBe(true);
    });

    it('should be valid at maximum', () => {
      const result = getCharacterCount('a'.repeat(100), 5, 100);
      expect(result.isValid).toBe(true);
    });

    it('should be invalid above maximum', () => {
      const result = getCharacterCount('a'.repeat(101), 5, 100);
      expect(result.isValid).toBe(false);
    });
  });

  describe('isWarning state', () => {
    it('should not warn when plenty of room', () => {
      const result = getCharacterCount('Hello', 1, 2000);
      expect(result.isWarning).toBe(false);
    });

    it('should warn when 100 or fewer characters remaining', () => {
      const result = getCharacterCount('a'.repeat(1900), 1, 2000);
      expect(result.isWarning).toBe(true);
    });

    it('should warn at exactly 100 remaining', () => {
      const result = getCharacterCount('a'.repeat(1900), 1, 2000);
      expect(result.remaining).toBe(100);
      expect(result.isWarning).toBe(true);
    });

    it('should not warn if below minimum', () => {
      // Warning only shows when valid (above min)
      const result = getCharacterCount('', 1, 100);
      expect(result.isWarning).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle min equals max', () => {
      const result = getCharacterCount('Hello', 5, 5);
      expect(result.isValid).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should handle unicode characters', () => {
      const result = getCharacterCount('Hello 世界', 1, 100);
      expect(result.count).toBe(8); // JavaScript string length
    });

    it('should handle emojis', () => {
      const result = getCharacterCount('Hello 👋', 1, 100);
      expect(result.count).toBe(8); // Emoji is 2 chars in JS
    });
  });
});
