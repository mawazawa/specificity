/**
 * Spec Serializers
 *
 * Export utilities for converting specs to various formats:
 * - YAML frontmatter (agent-ready)
 * - JSON (machine-readable)
 * - AGENTS.md (GitHub Copilot compatible)
 * - GitHub Spec Kit (spec.md + plan.md with Given/When/Then)
 */

export { generateYamlFrontmatter, generateAgentReadyMarkdown } from './yaml-frontmatter';
export { generateSpecJson, generateSpecJsonString } from './json-export';
export { generateAgentsMd } from './agents-md';
export { transformToSpecKit, generateSpecKitMarkdown } from './speckit-transformer';
