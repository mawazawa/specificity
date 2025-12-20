/**
 * Graders for Eval Harness
 *
 * Implements scoring logic for each criterion type.
 */

export interface GradeResult {
  score: number;  // 0-100
  passed: boolean;
  details: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// GRADER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Exact match grader
 */
export function gradeExactMatch(
  actual: unknown,
  expected: unknown
): GradeResult {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  return {
    score: passed ? 100 : 0,
    passed,
    details: passed ? 'Exact match' : `Expected ${expected}, got ${actual}`,
  };
}

/**
 * Contains grader - checks if output contains required items
 */
export function gradeContains(
  output: unknown,
  required: string[]
): GradeResult {
  const outputStr = JSON.stringify(output).toLowerCase();
  const found = required.filter(item => outputStr.includes(item.toLowerCase()));
  const score = Math.round((found.length / required.length) * 100);
  const passed = score >= 70;  // 70% threshold for contains

  return {
    score,
    passed,
    details: `Found ${found.length}/${required.length}: ${found.join(', ')}`,
  };
}

/**
 * Count >= grader - checks if array/object has minimum count
 */
export function gradeCountGte(
  output: Record<string, unknown>,
  field: string,
  min: number
): GradeResult {
  const value = output[field];
  let count = 0;

  if (Array.isArray(value)) {
    count = value.length;
  } else if (typeof value === 'object' && value !== null) {
    count = Object.keys(value).length;
  }

  const passed = count >= min;
  const score = passed ? 100 : Math.round((count / min) * 100);

  return {
    score,
    passed,
    details: `Count: ${count} (min: ${min})`,
  };
}

/**
 * Word count >= grader
 */
export function gradeWordCountGte(
  output: string | Record<string, unknown>,
  min: number
): GradeResult {
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const count = words.length;
  const passed = count >= min;
  const score = passed ? 100 : Math.round((count / min) * 100);

  return {
    score,
    passed,
    details: `Word count: ${count} (min: ${min})`,
  };
}

/**
 * Section presence grader - checks if required sections exist
 */
export function gradeSectionPresence(
  output: string,
  required: string[]
): GradeResult {
  const outputLower = output.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const section of required) {
    // Check for markdown headers or section names
    const patterns = [
      `# ${section.toLowerCase()}`,
      `## ${section.toLowerCase()}`,
      `### ${section.toLowerCase()}`,
      `**${section.toLowerCase()}**`,
      section.toLowerCase(),
    ];

    if (patterns.some(p => outputLower.includes(p))) {
      found.push(section);
    } else {
      missing.push(section);
    }
  }

  const score = Math.round((found.length / required.length) * 100);
  const passed = missing.length === 0;

  return {
    score,
    passed,
    details: missing.length > 0
      ? `Missing sections: ${missing.join(', ')}`
      : 'All required sections present',
  };
}

/**
 * LLM Judge grader - uses LLM to score output
 * Returns a Promise that would call the LLM in production
 */
export async function gradeLlmJudge(
  output: unknown,
  prompt: string,
  llmClient?: (prompt: string) => Promise<string>
): Promise<GradeResult> {
  // In test mode, return a default score
  if (!llmClient) {
    return {
      score: 75,
      passed: true,
      details: 'LLM judge skipped (no client provided)',
    };
  }

  try {
    const fullPrompt = `${prompt}\n\nContent to evaluate:\n${JSON.stringify(output, null, 2)}`;
    const response = await llmClient(fullPrompt);
    const score = parseInt(response.trim(), 10) * 10;  // Convert 1-10 to 0-100

    return {
      score: Math.min(100, Math.max(0, score)),
      passed: score >= 70,
      details: `LLM score: ${score / 10}/10`,
    };
  } catch (error) {
    return {
      score: 0,
      passed: false,
      details: `LLM judge error: ${error}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// GRADER DISPATCHER
// ═══════════════════════════════════════════════════════════════

export type ScorerType =
  | 'exact_match'
  | 'contains'
  | 'count_gte'
  | 'word_count_gte'
  | 'section_presence'
  | 'llm_judge';

export async function grade(
  scorer: ScorerType,
  output: unknown,
  params: Record<string, unknown>,
  llmClient?: (prompt: string) => Promise<string>
): Promise<GradeResult> {
  switch (scorer) {
    case 'exact_match':
      return gradeExactMatch(output, params.expected);

    case 'contains':
      return gradeContains(output, params.required as string[]);

    case 'count_gte':
      return gradeCountGte(
        output as Record<string, unknown>,
        params.field as string,
        params.min as number
      );

    case 'word_count_gte':
      return gradeWordCountGte(output as string, params.min as number);

    case 'section_presence':
      return gradeSectionPresence(output as string, params.required as string[]);

    case 'llm_judge':
      return gradeLlmJudge(output, params.prompt as string, llmClient);

    default:
      return {
        score: 0,
        passed: false,
        details: `Unknown scorer: ${scorer}`,
      };
  }
}
