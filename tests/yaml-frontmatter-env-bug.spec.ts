import { describe, it, expect } from 'vitest';
import { generateYamlFrontmatter } from '../src/lib/spec-serializers/yaml-frontmatter';
import { TechStackItem } from '../src/types/spec';

describe('YAML Frontmatter Generator - Env Var Extraction Bug', () => {
  const mockTechStack: TechStackItem[] = [
    {
      category: 'Backend',
      selected: { name: 'Supabase', rating: 5, pros: [], cons: [] },
      alternatives: []
    }
  ];

  it('should incorrectly identify common uppercase words as env vars with current regex', () => {
    const specContent = `
# Project Title

WARNING: This is a critical section.
TODO: Implement this later.
NOTE: Keep this in mind.
POST: /api/v1/users
GET: /api/v1/users
HTTP: Protocol used.
JSON: Data format.

Real env vars:
DATABASE_URL: postgres://...
OPENAI_API_KEY: sk-...
NEXT_PUBLIC_API_URL: https://...
`;

    const yaml = generateYamlFrontmatter(specContent, mockTechStack);
    
    // Check if the bug exists (false positives)
    const hasWarning = yaml.includes('- name: WARNING');
    const hasTodo = yaml.includes('- name: TODO');
    const hasPost = yaml.includes('- name: POST');
    
    // We expect these to be present currently (demonstrating the bug)
    console.log('Has WARNING:', hasWarning);
    console.log('Has TODO:', hasTodo);
    console.log('Has POST:', hasPost);
    
    // Also check true positives
    const hasDatabaseUrl = yaml.includes('- name: DATABASE_URL');
    console.log('Has DATABASE_URL:', hasDatabaseUrl);

    // This assertion confirms the bug IS FIXED (false positives should be false)
    expect(hasWarning).toBe(false);
    expect(hasTodo).toBe(false);
    expect(hasPost).toBe(false);
    
    // True positives should still be there
    expect(hasDatabaseUrl).toBe(true);
  });
});
