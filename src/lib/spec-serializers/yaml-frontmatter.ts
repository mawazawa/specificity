/**
 * YAML Frontmatter Generator for Agent-Ready Specs
 *
 * Generates machine-readable YAML frontmatter that can be parsed by:
 * - Claude Code
 * - GitHub Copilot
 * - OpenAI Codex
 * - Cursor
 * - Other AI coding agents
 *
 * @see https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
 */

import { TechStackItem, SpecOutput } from '@/types/spec';

export interface SpecMetadata {
  version: string;
  generated: string;
  generator: string;
  project: {
    name: string;
    type: 'web-app' | 'mobile-app' | 'api' | 'cli' | 'library';
    description: string;
  };
  stack: Record<string, {
    name: string;
    domain?: string;
    version?: string;
  }>;
  env_vars: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
  commands: Record<string, string>;
  structure: Array<{
    path: string;
    purpose: string;
  }>;
}

/**
 * Extract project name from spec content
 */
function extractProjectName(specContent: string): string {
  // Try to find title in markdown headers
  const titleMatch = specContent.match(/^#\s+(.+?)(?:\n|$)/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Fallback to first line or generic name
  const firstLine = specContent.split('\n')[0]?.trim();
  return firstLine?.substring(0, 50) || 'Untitled Project';
}

/**
 * Extract project description from spec summary section
 */
function extractDescription(specContent: string): string {
  // Look for Executive Summary or Overview section
  const summaryMatch = specContent.match(/(?:executive\s+summary|overview)[:\s]*\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (summaryMatch) {
    const summary = summaryMatch[1].trim().split('\n')[0];
    return summary.substring(0, 200);
  }

  // Fallback to content after first header
  const afterHeader = specContent.match(/^#[^#].*?\n\n(.*?)(?:\n\n|\n#)/s);
  if (afterHeader) {
    return afterHeader[1].trim().substring(0, 200);
  }

  return 'AI-generated specification';
}

/**
 * Detect project type from tech stack
 */
function detectProjectType(techStack: TechStackItem[]): SpecMetadata['project']['type'] {
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  if (stackNames.some(name => ['react native', 'flutter', 'swift', 'kotlin', 'expo'].includes(name))) {
    return 'mobile-app';
  }
  if (stackNames.some(name => ['express', 'fastify', 'fastapi', 'flask', 'django'].includes(name)) &&
      !stackNames.some(name => ['react', 'vue', 'angular', 'svelte', 'next.js'].includes(name))) {
    return 'api';
  }
  if (stackNames.some(name => ['commander', 'yargs', 'inquirer', 'chalk'].includes(name))) {
    return 'cli';
  }

  return 'web-app';
}

/**
 * Convert tech stack to simplified structure for YAML
 */
function formatStackForYaml(techStack: TechStackItem[]): SpecMetadata['stack'] {
  const stack: SpecMetadata['stack'] = {};

  for (const item of techStack) {
    const key = item.category.toLowerCase().replace(/[^a-z0-9]/g, '_');
    stack[key] = {
      name: item.selected.name,
      ...(item.selected.domain && { domain: item.selected.domain }),
      ...(item.selected.version && { version: item.selected.version }),
    };
  }

  return stack;
}

/**
 * Extract environment variables from spec content
 */
function extractEnvVars(specContent: string): SpecMetadata['env_vars'] {
  const envVars: SpecMetadata['env_vars'] = [];

  // Common patterns for env vars in specs
  const patterns = [
    /([A-Z][A-Z0-9_]+)(?:\s*[=:]\s*|\s+[-–]\s+)(.+?)(?:\n|$)/g,
    /`([A-Z][A-Z0-9_]+)`(?:\s*[:-]\s*|\s+)(.+?)(?:\n|$)/g,
  ];

  const foundVars = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const name = match[1];
      const description = match[2].trim().substring(0, 100);

      // Skip if already found or if it's not a real env var pattern
      if (foundVars.has(name) || name.length < 3 || name.length > 50) continue;

      foundVars.add(name);
      envVars.push({
        name,
        required: specContent.toLowerCase().includes(`${name.toLowerCase()} required`) ||
                  description.toLowerCase().includes('required'),
        description,
      });
    }
  }

  // Always include common env vars if tech stack suggests them
  const commonEnvVars = [
    { name: 'DATABASE_URL', required: true, description: 'Database connection string' },
    { name: 'OPENAI_API_KEY', required: true, description: 'OpenAI API key for AI features' },
  ];

  for (const common of commonEnvVars) {
    if (!foundVars.has(common.name) && specContent.toLowerCase().includes(common.name.toLowerCase().replace('_', ' '))) {
      envVars.push(common);
    }
  }

  return envVars.slice(0, 10); // Limit to 10 most relevant
}

/**
 * Generate YAML frontmatter from spec and tech stack
 */
export function generateYamlFrontmatter(
  specContent: string,
  techStack: TechStackItem[]
): string {
  const metadata: SpecMetadata = {
    version: '1.0',
    generated: new Date().toISOString(),
    generator: 'specificity-ai/multi-agent-spec',
    project: {
      name: extractProjectName(specContent),
      type: detectProjectType(techStack),
      description: extractDescription(specContent),
    },
    stack: formatStackForYaml(techStack),
    env_vars: extractEnvVars(specContent),
    commands: {
      install: 'pnpm install',
      dev: 'pnpm dev',
      build: 'pnpm build',
      test: 'pnpm test',
      lint: 'pnpm lint',
      typecheck: 'pnpm typecheck',
    },
    structure: [
      { path: 'src/app', purpose: 'Next.js App Router pages' },
      { path: 'src/components', purpose: 'React components' },
      { path: 'src/lib', purpose: 'Utility functions and API clients' },
      { path: 'src/hooks', purpose: 'Custom React hooks' },
      { path: 'src/types', purpose: 'TypeScript type definitions' },
      { path: 'supabase/migrations', purpose: 'Database migrations' },
    ],
  };

  // Generate YAML manually for consistent formatting
  let yaml = '---\n';
  yaml += `# Specificity AI Spec v${metadata.version}\n`;
  yaml += `version: "${metadata.version}"\n`;
  yaml += `generated: "${metadata.generated}"\n`;
  yaml += `generator: "${metadata.generator}"\n\n`;

  yaml += '# Project Metadata\n';
  yaml += 'project:\n';
  yaml += `  name: "${escapeYamlString(metadata.project.name)}"\n`;
  yaml += `  type: "${metadata.project.type}"\n`;
  yaml += `  description: "${escapeYamlString(metadata.project.description)}"\n\n`;

  yaml += '# Technology Stack\n';
  yaml += 'stack:\n';
  for (const [key, tech] of Object.entries(metadata.stack)) {
    yaml += `  ${key}:\n`;
    yaml += `    name: "${escapeYamlString(tech.name)}"\n`;
    if (tech.domain) yaml += `    domain: "${tech.domain}"\n`;
    if (tech.version) yaml += `    version: "${tech.version}"\n`;
  }
  yaml += '\n';

  yaml += '# Environment Variables\n';
  yaml += 'env_vars:\n';
  for (const envVar of metadata.env_vars) {
    yaml += `  - name: ${envVar.name}\n`;
    yaml += `    required: ${envVar.required}\n`;
    yaml += `    description: "${escapeYamlString(envVar.description)}"\n`;
  }
  yaml += '\n';

  yaml += '# Commands (AGENTS.md compatible)\n';
  yaml += 'commands:\n';
  for (const [key, cmd] of Object.entries(metadata.commands)) {
    yaml += `  ${key}: "${cmd}"\n`;
  }
  yaml += '\n';

  yaml += '# File Structure\n';
  yaml += 'structure:\n';
  for (const item of metadata.structure) {
    yaml += `  - path: "${item.path}"\n`;
    yaml += `    purpose: "${escapeYamlString(item.purpose)}"\n`;
  }

  yaml += '---\n\n';

  return yaml;
}

/**
 * Escape special characters in YAML strings
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

/**
 * Generate agent-ready markdown with YAML frontmatter
 */
export function generateAgentReadyMarkdown(
  specContent: string,
  techStack: TechStackItem[]
): string {
  const frontmatter = generateYamlFrontmatter(specContent, techStack);
  return frontmatter + specContent;
}
