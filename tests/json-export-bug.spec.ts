import { describe, it, expect } from 'vitest';
import { generateSpecJson } from '../src/lib/spec-serializers/json-export';
import { TechStackItem } from '../src/types/spec';

describe('JSON Export Generator - Requirement Extraction Bug', () => {
  const mockTechStack: TechStackItem[] = [];

  it('should extract requirements that do not end with a period', () => {
    const specContent = `
# Spec

## Requirements

The system must support login
The system must support logout.
The system must allow password reset
`;

    const json = generateSpecJson(specContent, mockTechStack);
    
    // We expect 3 requirements. 
    // "The system must support login" (no period, newline after)
    // "The system must support logout" (period)
    // "The system must allow password reset" (no period, end of string or newline)

    const requirements = json.requirements.functional;
    
    console.log('Extracted requirements:', requirements);

    expect(requirements).toContain('support login');
    expect(requirements).toContain('support logout');
    expect(requirements).toContain('allow password reset');
  });
});
