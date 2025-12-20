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
  scorer: 'exact_match' | 'contains' | 'count_gte' | 'word_count_gte' | 'section_presence' | 'llm_judge' | 'metadata_field_gte';
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
      // Valid domains: technical, design, market, legal, growth, security
      params: { required: ['technical', 'market'] },
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
// Maps to actual research stage output schema:
// - researchResults: Array<{ expertId, findings, toolsUsed: Array<{tool, success, duration}> }>
// - metadata: { totalToolsUsed, totalCost, totalTokens, duration }
// ═══════════════════════════════════════════════════════════════

export const researchCitationsRubric: Rubric = {
  name: 'research-citations',
  description: 'Evaluates research depth and citation quality',
  threshold: 70,  // 70% to pass
  criteria: [
    {
      name: 'research_results_count',
      weight: 0.4,
      scorer: 'count_gte',
      params: { field: 'researchResults', min: 2 },  // At least 2 expert results
    },
    {
      name: 'tool_usage',
      weight: 0.3,
      scorer: 'metadata_field_gte',  // Custom scorer for nested metadata
      params: { field: 'metadata.totalToolsUsed', min: 2 },
    },
    {
      name: 'findings_quality',
      weight: 0.3,
      scorer: 'llm_judge',
      params: {
        prompt: `Evaluate the quality of these research findings on a scale of 1-10.
                 Good findings are: specific, cite sources, provide actionable insights.
                 Return ONLY a number 1-10.`,
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
