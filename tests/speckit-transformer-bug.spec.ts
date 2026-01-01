import { describe, it, expect } from 'vitest';
import { transformToSpecKit } from '../src/lib/spec-serializers/speckit-transformer';
import { TechStackItem } from '../src/types/spec';

describe('Spec Kit Transformer - Requirement Extraction Bug', () => {
  const mockTechStack: TechStackItem[] = [];

  it('should extract requirements that do not end with a period', () => {
    const specContent = `
# Spec

## Requirements

The system must support login
The system must support logout.
The application must allow password reset
`;

    const { specMd } = transformToSpecKit(specContent, mockTechStack);
    
    // We expect the requirements to be listed in the specMd output
    // The transformer adds "System MUST " prefix for requirements it finds
    // or falls back to generic placeholders if none found.

    console.log('Generated Spec MD:', specMd);

    // Check if our specific requirements were extracted
    const hasLogin = specMd.includes('support login');
    const hasLogout = specMd.includes('support logout');
    const hasReset = specMd.includes('allow password reset');

    expect(hasLogout).toBe(true); // Should pass (ends with .)
    expect(hasLogin).toBe(true);  // Likely fails (no .)
    expect(hasReset).toBe(true);  // Likely fails (no .)
  });
});
