/**
 * Centralized Avatar Registry
 * Single source of truth for all agent avatars
 * Action 25: 92% confidence
 */

// Standard avatars (with backgrounds)
import elonMusk from '@/assets/optimized/elon-musk.webp';
import steveJobs from '@/assets/optimized/steve-jobs.webp';
import oprah from '@/assets/optimized/oprah.webp';
import jonyIve from '@/assets/optimized/jony-ive.webp';
import stevenBartlett from '@/assets/optimized/steven-bartlett.webp';
import amalClooney from '@/assets/optimized/amal-clooney.webp';
import agentPlaceholder from '@/assets/optimized/agent-placeholder.webp';

// Transparent background avatars (for dark UI)
import elonMuskNoBg from '@/assets/optimized/elon-musk-nobg.webp';
import steveJobsNoBg from '@/assets/optimized/steve-jobs-nobg.webp';
import oprahNoBg from '@/assets/optimized/oprah-nobg.webp';
import jonyIveNoBg from '@/assets/optimized/jony-ive-nobg.webp';
import stevenBartlettNoBg from '@/assets/optimized/steven-bartlett-nobg.webp';
import amalClooneyNoBg from '@/assets/optimized/amal-clooney-nobg.webp';

// ============================================
// TYPES
// ============================================

export type AgentName =
  | 'elon'
  | 'steve'
  | 'oprah'
  | 'zaha'
  | 'jony'
  | 'bartlett'
  | 'amal'
  | 'cuban'
  | 'user'
  | 'system';

export type AvatarVariant = 'standard' | 'transparent';

interface AvatarConfig {
  standard: string;
  transparent: string;
  fallback: string;
  displayName: string;
}

// ============================================
// AVATAR REGISTRY
// ============================================

/**
 * Complete avatar configuration for all agents
 */
export const avatarRegistry: Record<AgentName, AvatarConfig> = {
  elon: {
    standard: elonMusk,
    transparent: elonMuskNoBg,
    fallback: 'EM',
    displayName: 'Elon Musk',
  },
  steve: {
    standard: steveJobs,
    transparent: steveJobsNoBg,
    fallback: 'SJ',
    displayName: 'Steve Jobs',
  },
  oprah: {
    standard: oprah,
    transparent: oprahNoBg,
    fallback: 'OW',
    displayName: 'Oprah Winfrey',
  },
  zaha: {
    standard: agentPlaceholder,
    transparent: agentPlaceholder,
    fallback: 'ZH',
    displayName: 'Zaha Hadid',
  },
  jony: {
    standard: jonyIve,
    transparent: jonyIveNoBg,
    fallback: 'JI',
    displayName: 'Jony Ive',
  },
  bartlett: {
    standard: stevenBartlett,
    transparent: stevenBartlettNoBg,
    fallback: 'SB',
    displayName: 'Steven Bartlett',
  },
  amal: {
    standard: amalClooney,
    transparent: amalClooneyNoBg,
    fallback: 'AC',
    displayName: 'Amal Clooney',
  },
  cuban: {
    standard: agentPlaceholder,
    transparent: agentPlaceholder,
    fallback: 'MC',
    displayName: 'Mark Cuban',
  },
  user: {
    standard: agentPlaceholder,
    transparent: agentPlaceholder,
    fallback: 'U',
    displayName: 'User',
  },
  system: {
    standard: agentPlaceholder,
    transparent: agentPlaceholder,
    fallback: 'S',
    displayName: 'System',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get avatar image for an agent
 * @param agentName - Name of the agent (case-insensitive)
 * @param variant - 'standard' or 'transparent' background
 * @returns Avatar image URL
 */
export function getAgentAvatar(
  agentName: string,
  variant: AvatarVariant = 'standard'
): string {
  const normalized = normalizeAgentName(agentName);
  const config = avatarRegistry[normalized];
  return variant === 'transparent' ? config.transparent : config.standard;
}

/**
 * Get avatar fallback initials
 */
export function getAgentFallback(agentName: string): string {
  const normalized = normalizeAgentName(agentName);
  return avatarRegistry[normalized].fallback;
}

/**
 * Get agent display name
 */
export function getAgentDisplayName(agentName: string): string {
  const normalized = normalizeAgentName(agentName);
  return avatarRegistry[normalized].displayName;
}

/**
 * Get full avatar config
 */
export function getAgentConfig(agentName: string): AvatarConfig {
  const normalized = normalizeAgentName(agentName);
  return avatarRegistry[normalized];
}

/**
 * Normalize agent name to registry key
 */
export function normalizeAgentName(name: string): AgentName {
  const lower = name.toLowerCase().trim();

  // Handle common variations
  const mappings: Record<string, AgentName> = {
    'elon musk': 'elon',
    elon: 'elon',
    'steve jobs': 'steve',
    steve: 'steve',
    'oprah winfrey': 'oprah',
    oprah: 'oprah',
    'zaha hadid': 'zaha',
    zaha: 'zaha',
    'jony ive': 'jony',
    jony: 'jony',
    'steven bartlett': 'bartlett',
    bartlett: 'bartlett',
    'amal clooney': 'amal',
    amal: 'amal',
    'mark cuban': 'cuban',
    cuban: 'cuban',
    user: 'user',
    system: 'system',
  };

  return mappings[lower] ?? 'user';
}

/**
 * Check if agent name is valid
 */
export function isValidAgentName(name: string): boolean {
  const normalized = normalizeAgentName(name);
  return normalized in avatarRegistry;
}

/**
 * Get all available agent names
 */
export function getAllAgentNames(): AgentName[] {
  return Object.keys(avatarRegistry) as AgentName[];
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================

// Standard avatars
export {
  elonMusk as elonAvatar,
  steveJobs as steveAvatar,
  oprah as oprahAvatar,
  jonyIve as jonyAvatar,
  stevenBartlett as bartlettAvatar,
  amalClooney as amalAvatar,
  agentPlaceholder as zahaAvatar,
  agentPlaceholder,
};

// Transparent avatars
export {
  elonMuskNoBg as elonMuskAvatar,
  steveJobsNoBg as steveJobsAvatar,
  oprahNoBg as oprahWinfreyAvatar,
  jonyIveNoBg as jonyIveAvatar,
  stevenBartlettNoBg as stevenBartlettAvatar,
  amalClooneyNoBg as amalClooneyAvatar,
};

// Re-export standard versions with consistent naming
export {
  elonMusk,
  steveJobs,
  oprah,
  jonyIve,
  stevenBartlett,
  amalClooney,
  elonMuskNoBg,
  steveJobsNoBg,
  oprahNoBg,
  jonyIveNoBg,
  stevenBartlettNoBg,
  amalClooneyNoBg,
};
