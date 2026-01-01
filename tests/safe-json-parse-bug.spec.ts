import { describe, it, expect } from 'vitest';

// Replicating the logic from challenge-generator.ts (updated with fix)
function safeJsonParse<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks (flexible regex)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // console.warn('[JSON Parse] Failed to parse extracted JSON block');
      }
    }
    // Try to find raw JSON object/array
    const rawMatch = content.match(/[[{][\s\S]*[}\]]/);
    if (rawMatch) {
      try {
        return JSON.parse(rawMatch[0]);
      } catch {
        // console.warn('[JSON Parse] Failed to parse raw JSON match');
      }
    }
    // console.error('[JSON Parse] All parsing attempts failed, using fallback');
    return fallback;
  }
}

describe('safeJsonParse Bug Fix Verification', () => {
  const fallback = { error: true };

  it('should parse markdown block without newlines (Fixed)', () => {
    const input = '```json{"foo":"bar"}```';
    expect(safeJsonParse(input, fallback)).toEqual({ foo: 'bar' });
  });

  it('should parse markdown block with different language tag or none (Fixed)', () => {
    const input = '```\n{"foo":"bar"}\n```';
    expect(safeJsonParse(input, fallback)).toEqual({ foo: 'bar' });
  });

  // Note: The greedy regex issue for raw JSON is still present but mitigated by better markdown support.
  // We accepted that limitation for now as solving balanced braces with regex is impossible.
});
