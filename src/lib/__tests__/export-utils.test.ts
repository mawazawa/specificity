/**
 * Export Utils Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFilename,
  DEFAULT_TECH_STACK,
  SUGGESTED_REFINEMENTS,
} from '../export-utils';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('Export Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFilename', () => {
    it('should generate filename with date', () => {
      const filename = generateFilename('test', 'txt');
      expect(filename).toMatch(/^test-\d{4}-\d{2}-\d{2}\.txt$/);
    });

    it('should use provided prefix', () => {
      const filename = generateFilename('my-spec', 'md');
      expect(filename).toContain('my-spec-');
      expect(filename).toMatch(/\.md$/);
    });

    it('should handle various extensions', () => {
      expect(generateFilename('doc', 'pdf')).toMatch(/\.pdf$/);
      expect(generateFilename('doc', 'json')).toMatch(/\.json$/);
      expect(generateFilename('doc', 'docx')).toMatch(/\.docx$/);
    });

    it('should use current date', () => {
      const today = new Date().toISOString().split('T')[0];
      const filename = generateFilename('spec', 'md');
      expect(filename).toBe(`spec-${today}.md`);
    });
  });

  describe('DEFAULT_TECH_STACK', () => {
    it('should have backend category', () => {
      const backend = DEFAULT_TECH_STACK.find((item) => item.category === 'Backend');
      expect(backend).toBeDefined();
      expect(backend?.selected.name).toBe('Supabase');
    });

    it('should have AI/ML category', () => {
      const ai = DEFAULT_TECH_STACK.find((item) => item.category === 'AI/ML');
      expect(ai).toBeDefined();
      expect(ai?.selected.name).toBe('OpenAI');
    });

    it('should have alternatives for each category', () => {
      DEFAULT_TECH_STACK.forEach((item) => {
        expect(item.alternatives.length).toBeGreaterThan(0);
      });
    });

    it('should have required properties for selected tech', () => {
      DEFAULT_TECH_STACK.forEach((item) => {
        expect(item.selected).toHaveProperty('name');
        expect(item.selected).toHaveProperty('logo');
        expect(item.selected).toHaveProperty('rating');
        expect(item.selected).toHaveProperty('pros');
        expect(item.selected).toHaveProperty('cons');
      });
    });
  });

  describe('SUGGESTED_REFINEMENTS', () => {
    it('should have refinement suggestions', () => {
      expect(SUGGESTED_REFINEMENTS.length).toBeGreaterThan(0);
    });

    it('should have non-empty strings', () => {
      SUGGESTED_REFINEMENTS.forEach((refinement) => {
        expect(typeof refinement).toBe('string');
        expect(refinement.length).toBeGreaterThan(0);
      });
    });
  });
});
