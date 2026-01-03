/**
 * Package Manager Detection Bug Test
 *
 * Verifies that the package manager detection in agents-md.ts uses exact matching
 * to avoid false positives when library names contain package manager names as substrings.
 *
 * Bug: Using `name.includes('bun')` caused "Bunyan" (logging library) to match "bun" package manager.
 * Fix: Use exact matching `name === 'bun'` instead of substring matching.
 */

import { describe, it, expect } from 'vitest';
import { generateAgentsMd } from '../src/lib/spec-serializers/agents-md';
import type { TechStackItem } from '../src/types/spec';

describe('Package Manager Detection - Substring False Positive Bug', () => {
  const createTechStackItem = (name: string, category: string = 'Library'): TechStackItem => ({
    category,
    selected: {
      name,
      logo: '',
      rating: 4,
      pros: ['Good'],
      cons: [],
    },
    alternatives: [],
  });

  it('should NOT detect bun when Bunyan logging library is present', () => {
    const techStack: TechStackItem[] = [
      createTechStackItem('Bunyan', 'Logging'),
      createTechStackItem('Express', 'Backend Framework'),
    ];

    const agentsMd = generateAgentsMd('# Test Spec\n\nA test specification', techStack);

    // Should NOT contain bun commands (Bunyan is a logging library, not bun package manager)
    expect(agentsMd).not.toContain('bun install');
    expect(agentsMd).not.toContain('bun dev');
    expect(agentsMd).not.toContain('bun run');

    // Should contain pnpm (default package manager)
    expect(agentsMd).toContain('pnpm install');
  });

  it('should correctly detect bun when Bun runtime is explicitly specified', () => {
    const techStack: TechStackItem[] = [
      createTechStackItem('Bun', 'Runtime'),
      createTechStackItem('Hono', 'Backend Framework'),
    ];

    const agentsMd = generateAgentsMd('# Bun App\n\nA Bun application', techStack);

    // Should contain bun commands when Bun is explicitly in the stack
    expect(agentsMd).toContain('bun install');
  });

  it('should correctly detect yarn when Yarn is explicitly specified', () => {
    const techStack: TechStackItem[] = [
      createTechStackItem('Yarn', 'Package Manager'),
      createTechStackItem('React', 'Frontend Framework'),
    ];

    const agentsMd = generateAgentsMd('# React App\n\nA React application', techStack);

    // Should contain yarn commands
    expect(agentsMd).toContain('yarn install');
  });

  it('should default to pnpm when no package manager is specified', () => {
    const techStack: TechStackItem[] = [
      createTechStackItem('React', 'Frontend Framework'),
      createTechStackItem('TypeScript', 'Language'),
    ];

    const agentsMd = generateAgentsMd('# Default App\n\nA default application', techStack);

    // Should default to pnpm
    expect(agentsMd).toContain('pnpm install');
    expect(agentsMd).not.toContain('bun install');
    expect(agentsMd).not.toContain('yarn install');
  });

  it('should NOT detect yarn from yarn-related utility names', () => {
    const techStack: TechStackItem[] = [
      createTechStackItem('yarn-workspaces-foreach', 'Utility'),
      createTechStackItem('React', 'Frontend Framework'),
    ];

    const agentsMd = generateAgentsMd('# Workspace App\n\nA monorepo application', techStack);

    // The utility name contains "yarn" as a prefix, but is not the package manager itself
    // With exact matching, this should NOT match "yarn"
    expect(agentsMd).toContain('pnpm install');
  });
});
