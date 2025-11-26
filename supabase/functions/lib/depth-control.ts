/**
 * Adaptive Depth Control
 * Allows users to choose research intensity based on needs and budget
 *
 * Modes:
 * - Quick: Fast, low-cost overview (~$0.05, 2-3 min)
 * - Standard: Balanced depth and cost (~$0.15, 5-7 min)
 * - Deep: Thorough research (~$0.40, 10-15 min)
 * - Exhaustive: Maximum depth with sub-agents (~$1.00, 20-30 min)
 *
 * Design: KISS + YAGNI
 * - Simple configuration object
 * - No complex logic
 * - Clear trade-offs
 */

export type ResearchDepth = 'quick' | 'standard' | 'deep' | 'exhaustive';

export interface DepthConfig {
  maxIterations: number;        // Max iterations per agent
  maxAgents: number;             // Number of agents to run
  enableSubAgents: boolean;      // Allow sub-agent spawning
  enableFactChecking: boolean;   // Run fact verification
  toolPriority: 'essential' | 'standard' | 'all'; // Which tools to use
  questionCount: number;         // Dynamic questions to generate
  estimatedCost: string;         // Approximate cost
  estimatedDuration: string;     // Approximate time
  description: string;           // User-facing description
}

/**
 * Predefined depth configurations
 * Based on cost/performance analysis
 */
export const DEPTH_CONFIGS: Record<ResearchDepth, DepthConfig> = {
  quick: {
    maxIterations: 3,
    maxAgents: 3,
    enableSubAgents: false,
    enableFactChecking: false,
    toolPriority: 'essential',
    questionCount: 4,
    estimatedCost: '$0.05',
    estimatedDuration: '2-3 min',
    description: 'Fast overview with essential research. Good for quick validation or early-stage ideas.'
  },

  standard: {
    maxIterations: 6,
    maxAgents: 5,
    enableSubAgents: false,
    enableFactChecking: true,
    toolPriority: 'standard',
    questionCount: 7,
    estimatedCost: '$0.15',
    estimatedDuration: '5-7 min',
    description: 'Balanced depth and cost. Recommended for most projects. Includes fact-checking.'
  },

  deep: {
    maxIterations: 10,
    maxAgents: 7,
    enableSubAgents: true,
    enableFactChecking: true,
    toolPriority: 'all',
    questionCount: 10,
    estimatedCost: '$0.40',
    estimatedDuration: '10-15 min',
    description: 'Thorough research with sub-agents. Best for complex projects or technical decisions.'
  },

  exhaustive: {
    maxIterations: 15,
    maxAgents: 7,
    enableSubAgents: true,
    enableFactChecking: true,
    toolPriority: 'all',
    questionCount: 12,
    estimatedCost: '$1.00',
    estimatedDuration: '20-30 min',
    description: 'Maximum depth with 15 iterations and sub-agents. For critical production decisions.'
  }
};

/**
 * Get configuration for specified depth
 */
export function getDepthConfig(depth: ResearchDepth): DepthConfig {
  return DEPTH_CONFIGS[depth];
}

/**
 * Recommend depth based on user input complexity
 * Simple heuristic based on input length and keywords
 */
export function recommendDepth(userInput: string): ResearchDepth {
  const length = userInput.length;
  const complexityKeywords = [
    'architecture', 'scalable', 'production', 'security',
    'enterprise', 'complex', 'multiple', 'integrate',
    'migration', 'refactor', 'large-scale', 'critical'
  ];

  const hasComplexityKeywords = complexityKeywords.some(keyword =>
    userInput.toLowerCase().includes(keyword)
  );

  // Simple heuristic
  if (length < 100) {
    return 'quick';
  } else if (length < 250 || !hasComplexityKeywords) {
    return 'standard';
  } else if (length < 500) {
    return 'deep';
  } else {
    return 'exhaustive';
  }
}

/**
 * Filter agent configs based on depth
 * Reduces agent count for faster/cheaper modes
 */
export function filterAgentsForDepth(
  allAgents: any[],
  depth: ResearchDepth
): any[] {
  const config = getDepthConfig(depth);

  if (allAgents.length <= config.maxAgents) {
    return allAgents;
  }

  // Priority order: technical → business → design → legal
  const priorityOrder = ['elon', 'steve', 'bartlett', 'jony', 'oprah', 'zaha', 'amal'];

  const sorted = allAgents.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.agent);
    const bIndex = priorityOrder.indexOf(b.agent);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return sorted.slice(0, config.maxAgents);
}

/**
 * Get tool subset based on priority
 */
export function getToolsForDepth(depth: ResearchDepth): string[] {
  const config = getDepthConfig(depth);

  const essentialTools = [
    'web_search',
    'exa_search'
  ];

  const standardTools = [
    ...essentialTools,
    'competitor_analysis',
    'github_search',
    'stackoverflow_search'
  ];

  const allTools = [
    ...standardTools,
    'pricing_intelligence',
    'seo_keyword',
    'stripe_pricing',
    'aws_cost_estimator',
    'appstore_analytics',
    'market_data',
    'npm_search'
  ];

  switch (config.toolPriority) {
    case 'essential':
      return essentialTools;
    case 'standard':
      return standardTools;
    case 'all':
      return allTools;
    default:
      return standardTools;
  }
}
