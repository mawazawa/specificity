/**
 * JSON Export Generator for Machine-Readable Specs
 *
 * Generates structured JSON that can be parsed by:
 * - AI coding agents
 * - CI/CD pipelines
 * - Project scaffolding tools
 * - Automated testing frameworks
 *
 * @see https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
 */

import { TechStackItem, _SpecOutput } from '@/types/spec';

export interface SpecJsonExport {
  $schema: string;
  version: string;
  generated: string;
  generator: {
    name: string;
    version: string;
    url: string;
  };
  project: {
    name: string;
    description: string;
    type: 'web-app' | 'mobile-app' | 'api' | 'cli' | 'library';
  };
  techStack: TechStackItem[];
  sections: SpecSection[];
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  testing: {
    strategy: string[];
    frameworks: string[];
  };
  deployment: {
    platform: string;
    commands: Record<string, string>;
  };
  metadata: {
    wordCount: number;
    sectionCount: number;
    techStackCount: number;
  };
}

interface SpecSection {
  id: string;
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  wordCount: number;
}

/**
 * Extract project name from spec content
 */
function extractProjectName(specContent: string): string {
  const titleMatch = specContent.match(/^#\s+(.+?)(?:\n|$)/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  return 'Untitled Project';
}

/**
 * Extract description from spec content
 */
function extractDescription(specContent: string): string {
  const summaryMatch = specContent.match(/(?:executive\s+summary|overview)[:\s]*\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().split('\n')[0].substring(0, 500);
  }
  return 'AI-generated specification';
}

/**
 * Parse spec content into sections
 */
function parseSpecSections(specContent: string): SpecSection[] {
  const sections: SpecSection[] = [];
  const sectionPattern = /^##\s+(.+?)\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)/gm;

  let match;
  let index = 0;
  while ((match = sectionPattern.exec(specContent)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Determine priority based on section title or content
    let priority: SpecSection['priority'] = 'medium';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('core') || lowerTitle.includes('critical') || lowerTitle.includes('requirement')) {
      priority = 'critical';
    } else if (lowerTitle.includes('security') || lowerTitle.includes('api') || lowerTitle.includes('database')) {
      priority = 'high';
    } else if (lowerTitle.includes('optional') || lowerTitle.includes('future') || lowerTitle.includes('nice')) {
      priority = 'low';
    }

    sections.push({
      id: `section-${index++}`,
      title,
      content,
      priority,
      wordCount,
    });
  }

  return sections;
}

/**
 * Extract functional requirements from spec
 */
function extractFunctionalRequirements(specContent: string): string[] {
  const requirements: string[] = [];

  // Look for must/shall/should statements
  const mustPatterns = [
    /system\s+(?:must|shall|should)\s+(.+?)(?:\.|$)/gi,
    /users?\s+(?:must|shall|should)\s+be\s+able\s+to\s+(.+?)(?:\.|$)/gi,
    /application\s+(?:must|shall|should)\s+(.+?)(?:\.|$)/gi,
    /(?:FR-\d+)[:\s]+(.+?)(?:\.|$)/gi,
  ];

  for (const pattern of mustPatterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const req = match[1].trim();
      if (req.length > 10 && req.length < 200 && !requirements.includes(req)) {
        requirements.push(req);
      }
    }
  }

  return requirements.slice(0, 20); // Limit to 20 most important
}

/**
 * Extract non-functional requirements from spec
 */
function extractNonFunctionalRequirements(specContent: string): string[] {
  const requirements: string[] = [];

  // Look for performance/scalability/security mentions
  const nfrPatterns = [
    /(?:performance|latency|response\s+time)[:\s]+(.+?)(?:\.|$)/gi,
    /(?:scalability|scale\s+to)[:\s]+(.+?)(?:\.|$)/gi,
    /(?:availability|uptime)[:\s]+(.+?)(?:\.|$)/gi,
    /(?:security|authentication|authorization)[:\s]+(.+?)(?:\.|$)/gi,
  ];

  for (const pattern of nfrPatterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const req = match[1].trim();
      if (req.length > 10 && req.length < 200 && !requirements.includes(req)) {
        requirements.push(req);
      }
    }
  }

  return requirements.slice(0, 10);
}

/**
 * Extract testing strategy from spec
 */
function extractTestingStrategy(specContent: string): string[] {
  const strategies: string[] = [];

  // Common testing approaches
  const testingKeywords = [
    'unit test', 'integration test', 'e2e test', 'end-to-end',
    'coverage', 'TDD', 'BDD', 'acceptance test', 'regression'
  ];

  for (const keyword of testingKeywords) {
    if (specContent.toLowerCase().includes(keyword)) {
      strategies.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }

  return strategies;
}

/**
 * Detect testing frameworks from tech stack
 */
function detectTestingFrameworks(techStack: TechStackItem[]): string[] {
  const frameworks: string[] = [];
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  const testFrameworks = [
    'vitest', 'jest', 'mocha', 'playwright', 'cypress',
    'testing library', 'supertest', 'pytest'
  ];

  for (const framework of testFrameworks) {
    if (stackNames.some(name => name.includes(framework))) {
      frameworks.push(framework.charAt(0).toUpperCase() + framework.slice(1));
    }
  }

  // Default to common frameworks if none detected
  if (frameworks.length === 0) {
    frameworks.push('Vitest', 'Playwright');
  }

  return frameworks;
}

/**
 * Detect deployment platform from tech stack
 */
function detectDeploymentPlatform(techStack: TechStackItem[]): string {
  const stackNames = techStack.flatMap(item => [
    item.selected.name.toLowerCase(),
    ...item.alternatives.map(alt => alt.name.toLowerCase())
  ]);

  if (stackNames.some(name => name.includes('vercel'))) return 'Vercel';
  if (stackNames.some(name => name.includes('netlify'))) return 'Netlify';
  if (stackNames.some(name => name.includes('cloudflare'))) return 'Cloudflare';
  if (stackNames.some(name => name.includes('aws'))) return 'AWS';
  if (stackNames.some(name => name.includes('docker'))) return 'Docker';

  return 'Vercel'; // Default for Next.js apps
}

/**
 * Detect project type from tech stack
 */
function detectProjectType(techStack: TechStackItem[]): SpecJsonExport['project']['type'] {
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
 * Generate JSON export from spec and tech stack
 */
export function generateSpecJson(
  specContent: string,
  techStack: TechStackItem[]
): SpecJsonExport {
  const sections = parseSpecSections(specContent);
  const wordCount = specContent.split(/\s+/).filter(Boolean).length;

  return {
    $schema: 'https://specificity.ai/schemas/spec-v1.json',
    version: '1.0',
    generated: new Date().toISOString(),
    generator: {
      name: 'Specificity AI',
      version: '1.1.1',
      url: 'https://specificity.ai',
    },
    project: {
      name: extractProjectName(specContent),
      description: extractDescription(specContent),
      type: detectProjectType(techStack),
    },
    techStack,
    sections,
    requirements: {
      functional: extractFunctionalRequirements(specContent),
      nonFunctional: extractNonFunctionalRequirements(specContent),
    },
    testing: {
      strategy: extractTestingStrategy(specContent),
      frameworks: detectTestingFrameworks(techStack),
    },
    deployment: {
      platform: detectDeploymentPlatform(techStack),
      commands: {
        install: 'pnpm install',
        dev: 'pnpm dev',
        build: 'pnpm build',
        test: 'pnpm test',
        lint: 'pnpm lint',
        typecheck: 'pnpm typecheck',
        deploy: 'vercel --prod',
      },
    },
    metadata: {
      wordCount,
      sectionCount: sections.length,
      techStackCount: techStack.length,
    },
  };
}

/**
 * Generate JSON string with pretty formatting
 */
export function generateSpecJsonString(
  specContent: string,
  techStack: TechStackItem[]
): string {
  const json = generateSpecJson(specContent, techStack);
  return JSON.stringify(json, null, 2);
}
