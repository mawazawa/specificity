/**
 * AGENTS.md Generator
 *
 * Generates AGENTS.md files compatible with:
 * - GitHub Copilot coding agent (officially supported since August 2025)
 * - Claude Code
 * - OpenAI Codex
 * - Cursor
 * - Other AI coding agents
 *
 * @see https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/
 * @see https://ainativedev.io/news/the-rise-of-agents-md-an-open-standard-and-single-source-of-truth-for-ai-coding-agents
 */

import { TechStackItem } from '@/types/spec';

/**
 * Extract project name from spec content
 */
function extractProjectName(specContent: string): string {
  const titleMatch = specContent.match(/^#\s+(.+?)(?:\n|$)/m);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }
  return 'Untitled Project';
}

/**
 * Extract executive summary from spec
 */
function extractExecutiveSummary(specContent: string): string {
  const summaryMatch = specContent.match(/(?:executive\s+summary|overview)[:\s]*\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (summaryMatch?.[1]) {
    return summaryMatch[1].trim().substring(0, 500);
  }

  // Fallback to first paragraph after title
  const afterHeader = specContent.match(/^#[^#].*?\n\n([\s\S]*?)(?:\n\n|\n#)/s);
  if (afterHeader?.[1]) {
    return afterHeader[1].trim().substring(0, 500);
  }

  return 'See specification for project details.';
}

/**
 * Format tech stack for AGENTS.md
 */
function formatTechStackForAgents(techStack: TechStackItem[]): string {
  if (!techStack.length) {
    return 'See specification for technology details.';
  }

  const lines: string[] = [];

  for (const item of techStack) {
    const tech = item.selected;
    const version = tech.version ? ` ${tech.version}` : '';
    lines.push(`- **${item.category}**: ${tech.name}${version}`);
  }

  return lines.join('\n');
}

/**
 * Extract environment variables from spec
 */
function extractEnvVarsSection(specContent: string): string {
  const envVars: string[] = [];

  // Look for common env var patterns
  const patterns = [
    /([A-Z][A-Z0-9_]+)(?:\s*[=:]\s*|\s+[-–]\s+)(.+?)(?:\n|$)/g,
    /`([A-Z][A-Z0-9_]+)`(?:\s*[:-]\s*|\s+)(.+?)(?:\n|$)/g,
  ];

  const foundVars = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const name = match[1];
      const description = match[2];

      if (!name || !description) continue;
      if (foundVars.has(name) || name.length < 3 || name.length > 50) continue;
      foundVars.add(name);

      envVars.push(`${name}=  # ${description.trim().substring(0, 80)}`);
    }
  }

  if (envVars.length === 0) {
    return `# Add your environment variables here
DATABASE_URL=
OPENAI_API_KEY=`;
  }

  return envVars.slice(0, 15).join('\n');
}

/**
 * Detect package manager from tech stack
 */
function detectPackageManager(techStack: TechStackItem[]): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  if (stackNames.some(name => name.includes('bun'))) return 'bun';
  if (stackNames.some(name => name.includes('yarn'))) return 'yarn';

  return 'pnpm'; // Default to pnpm for modern projects
}

/**
 * Detect test framework from tech stack
 */
function detectTestFramework(techStack: TechStackItem[]): string {
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  if (stackNames.some(name => name.includes('vitest'))) return 'Vitest';
  if (stackNames.some(name => name.includes('jest'))) return 'Jest';
  if (stackNames.some(name => name.includes('mocha'))) return 'Mocha';
  if (stackNames.some(name => name.includes('pytest'))) return 'pytest';

  return 'Vitest'; // Default for modern TypeScript projects
}

/**
 * Generate file structure based on tech stack
 */
function generateFileStructure(techStack: TechStackItem[]): string {
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  // Next.js App Router structure (default)
  if (stackNames.some(name => name.includes('next'))) {
    return `src/
  app/           # Next.js App Router pages
  components/    # React components
    ui/          # shadcn/ui components
  lib/           # Utility functions and API clients
  hooks/         # Custom React hooks
  types/         # TypeScript type definitions
public/          # Static assets
supabase/
  migrations/    # Database migrations
  functions/     # Edge functions`;
  }

  // React SPA structure
  if (stackNames.some(name => name.includes('react') && !name.includes('next'))) {
    return `src/
  components/    # React components
  pages/         # Page components
  lib/           # Utility functions
  hooks/         # Custom React hooks
  types/         # TypeScript type definitions
public/          # Static assets`;
  }

  // API-only structure
  if (stackNames.some(name => ['express', 'fastify', 'fastapi'].some(f => name.includes(f)))) {
    return `src/
  routes/        # API route handlers
  services/      # Business logic
  models/        # Data models
  middleware/    # Express middleware
  utils/         # Utility functions
tests/           # Test files`;
  }

  // Default structure
  return `src/
  app/           # Application pages
  components/    # UI components
  lib/           # Utilities
  types/         # Type definitions`;
}

/**
 * Generate AGENTS.md content
 */
export function generateAgentsMd(
  specContent: string,
  techStack: TechStackItem[]
): string {
  const projectName = extractProjectName(specContent);
  const summary = extractExecutiveSummary(specContent);
  const pm = detectPackageManager(techStack);
  const testFramework = detectTestFramework(techStack);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `# AGENTS.md - ${projectName}

> Generated by Specificity AI on ${date}
> This file provides context for AI coding agents (Claude Code, Copilot, Codex)

## Project Overview

${summary}

## Quick Start

\`\`\`bash
${pm} install
${pm} dev
\`\`\`

## Tech Stack

${formatTechStackForAgents(techStack)}

## File Structure

\`\`\`
${generateFileStructure(techStack)}
\`\`\`

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Conventional commits for version control
- Component-first architecture

## Testing

- Run: \`${pm} test\`
- Framework: ${testFramework} + Testing Library
- E2E: Playwright
- Minimum coverage: 80%

## Environment Variables

\`\`\`bash
${extractEnvVarsSection(specContent)}
\`\`\`

## Build & Deploy

\`\`\`bash
# Build for production
${pm} build

# Run production build locally
${pm} start

# Deploy (Vercel recommended)
vercel --prod
\`\`\`

## Common Commands

| Command | Description |
|---------|-------------|
| \`${pm} dev\` | Start development server |
| \`${pm} build\` | Build for production |
| \`${pm} test\` | Run tests |
| \`${pm} lint\` | Lint codebase |
| \`${pm} typecheck\` | TypeScript type check |

## Key Conventions

1. **Components**: Use functional components with hooks
2. **State**: Prefer React hooks or Zustand for state management
3. **Styling**: Use Tailwind CSS with shadcn/ui components
4. **API**: Use server actions or API routes for data fetching
5. **Types**: Define types in \`src/types/\` directory

## Additional Resources

- See \`SPEC.md\` for full technical specification
- See \`README.md\` for project documentation
- See \`CONTRIBUTING.md\` for contribution guidelines
`;
}
