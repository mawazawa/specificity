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
  scorer: 'exact_match' | 'contains' | 'count_gte' | 'word_count_gte' | 'section_presence' | 'llm_judge';
  params?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// QUESTION GENERATION RUBRIC
// ═══════════════════════════════════════════════════════════════

export const questionGenerationRubric: Rubric = {
  name: 'question-generation',
  description: 'Evaluates the quality of AI-generated research questions',
  threshold: 75,  // 75% to pass
  criteria: [
    {
      name: 'question_count',
      weight: 0.3,
      scorer: 'count_gte',
      params: { field: 'questions', min: 5 },
    },
    {
      name: 'domain_coverage',
      weight: 0.4,
      scorer: 'contains',
      params: { field: 'questions', required: ['technical', 'market'] },
    },
    {
      name: 'question_quality',
      weight: 0.3,
      scorer: 'llm_judge',
      params: {
        prompt: `Rate the quality of these research questions on a scale of 1-10.
                 Good questions are: specific, actionable, domain-appropriate.
                 Return ONLY a number 1-10.`,
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// RESEARCH CITATIONS RUBRIC
// ═══════════════════════════════════════════════════════════════

export const researchCitationsRubric: Rubric = {
  name: 'research-citations',
  description: 'Evaluates research depth and citation quality',
  threshold: 70,  // 70% to pass
  criteria: [
    {
      name: 'citation_count',
      weight: 0.4,
      scorer: 'count_gte',
      params: { field: 'citations', min: 3 },
    },
    {
      name: 'tool_usage',
      weight: 0.3,
      scorer: 'count_gte',
      params: { field: 'tools_used', min: 2 },
    },
    {
      name: 'citation_recency',
      weight: 0.3,
      scorer: 'llm_judge',
      params: {
        prompt: `Evaluate whether these citations are from 2024-2025 (recent) or older.
                 Return a score 1-10 where 10 = all citations from 2024-2025.`,
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SPEC COMPLETENESS RUBRIC
// ═══════════════════════════════════════════════════════════════

export const specCompletenessRubric: Rubric = {
  name: 'spec-completeness',
  description: 'Evaluates final specification quality and completeness',
  threshold: 80,  // 80% to pass (higher bar for final output)
  criteria: [
    {
      name: 'required_sections',
      weight: 0.4,
      scorer: 'section_presence',
      params: {
        required: [
          'Executive Summary',
          'Core Requirements',
          'Technical Architecture',
          'Implementation Phases',
          'Dependencies',
          'Risk Analysis',
          'Success Metrics',
        ],
      },
    },
    {
      name: 'minimum_length',
      weight: 0.2,
      scorer: 'word_count_gte',
      params: { min: 1000 },
    },
    {
      name: 'actionability',
      weight: 0.4,
      scorer: 'llm_judge',
      params: {
        prompt: `Rate this product specification on a scale of 1-10 for actionability.
                 An actionable spec has: clear next steps, specific technologies named,
                 prioritized requirements, and realistic timelines.
                 Return ONLY a number 1-10.`,
      },
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
