/**
 * Spec Serializers
 *
 * Export utilities for converting specs to various formats:
 * - YAML frontmatter (agent-ready)
 * - JSON (machine-readable)
 * - AGENTS.md (GitHub Copilot compatible)
 */

export { generateYamlFrontmatter, generateAgentReadyMarkdown } from './yaml-frontmatter';
export { generateSpecJson, generateSpecJsonString } from './json-export';
export { generateAgentsMd } from './agents-md';
