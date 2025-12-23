/**
 * Scoring Rubrics for Eval Harness
 *
 * Defines pass/fail thresholds and scoring criteria for each eval type.
 */

export interface Rubric {
  name: string;
  description: string;
  threshold: number;  // 0-100, percentage to pass
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  name: string;
  weight: number;  // 0-1, must sum to 1
  scorer: 'exact_match' | 'contains' | 'count_gte' | 'word_count_gte' | 'section_presence' | 'llm_judge' | 'metadata_field_gte' | 'set_coverage';
  params?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// QUESTION GENERATION RUBRIC
// ═══════════════════════════════════════════════════════════════

export const questionGenerationRubric: Rubric = {
  name: 'question-generation',
  description: 'Evaluates coverage and structure of AI-generated research questions',
  threshold: 75,  // 75% to pass
  criteria: [
    {
      name: 'question_count',
      weight: 0.5,
      scorer: 'count_gte',
      params: { field: 'questions', min: 5, minField: 'expected_question_count' },
    },
    {
      name: 'domain_coverage',
      weight: 0.5,
      scorer: 'set_coverage',
      params: { field: 'questions[].domain', expectedField: 'expected_domains', minCoverage: 70 },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// RESEARCH CITATIONS RUBRIC
// Maps to actual research stage output schema:
// - researchResults: Array<{ expertId, findings, toolsUsed: Array<{tool, success, duration}> }>
// - metadata: { totalToolsUsed, totalCost, totalTokens, duration }
// ═══════════════════════════════════════════════════════════════

export const researchCitationsRubric: Rubric = {
  name: 'research-citations',
  description: 'Evaluates research depth and tool coverage',
  threshold: 70,  // 70% to pass
  criteria: [
    {
      name: 'research_results_count',
      weight: 0.3,
      scorer: 'count_gte',
      params: { field: 'researchResults', min: 2 },  // At least 2 expert results
    },
    {
      name: 'tool_usage',
      weight: 0.3,
      scorer: 'count_gte',
      params: { field: 'researchResults[].toolsUsed', min: 2, minField: 'expected_min_tools' },
    },
    {
      name: 'tool_coverage',
      weight: 0.2,
      scorer: 'set_coverage',
      params: { field: 'researchResults[].toolsUsed[].tool', expectedField: 'expected_tools', minCoverage: 50 },
    },
    {
      name: 'findings_length',
      weight: 0.2,
      scorer: 'word_count_gte',
      params: { field: 'researchResults[].findings', min: 250 },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SPEC COMPLETENESS RUBRIC
// ═══════════════════════════════════════════════════════════════

export const specCompletenessRubric: Rubric = {
  name: 'spec-completeness',
  description: 'Evaluates final specification completeness',
  threshold: 80,  // 80% to pass (higher bar for final output)
  criteria: [
    {
      name: 'required_sections',
      weight: 0.5,
      scorer: 'section_presence',
      params: {
        field: 'spec',
        requiredField: 'required_sections',
      },
    },
    {
      name: 'minimum_length',
      weight: 0.3,
      scorer: 'word_count_gte',
      params: { field: 'spec', min: 1000, minField: 'min_word_count' },
    },
    {
      name: 'tech_stack_present',
      weight: 0.2,
      scorer: 'count_gte',
      params: { field: 'techStack', min: 1 },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const rubrics = {
  'question-generation': questionGenerationRubric,
  'research-citations': researchCitationsRubric,
  'spec-completeness': specCompletenessRubric,
};

export type RubricName = keyof typeof rubrics;

export function getRubric(name: RubricName): Rubric {
  return rubrics[name];
}

export function getThreshold(name: RubricName): number {
  return rubrics[name].threshold;
}
