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

/**
 * Resolve nested values using a dot path. Supports "items[]"
 * to flatten array segments, e.g., "researchResults[].toolsUsed".
 */
function getPathValues(source: unknown, path?: string): unknown[] {
  if (!path) return [source];

  const segments = path.split('.');
  let current: unknown[] = [source];

  for (const segment of segments) {
    const isArray = segment.endsWith('[]');
    const key = isArray ? segment.slice(0, -2) : segment;
    const next: unknown[] = [];

    for (const value of current) {
      if (!value || typeof value !== 'object') continue;
      const child = (value as Record<string, unknown>)[key];
      if (isArray) {
        if (Array.isArray(child)) {
          next.push(...child);
        }
      } else if (child !== undefined) {
        next.push(child);
      }
    }

    current = next;
  }

  return current;
}

function flattenValues(values: unknown[]): unknown[] {
  return values.flatMap(value => Array.isArray(value) ? value : [value]);
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
  const values = flattenValues(getPathValues(output, field));
  const count = values.length;

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
  output: unknown,
  min: number,
  field?: string
): GradeResult {
  const values = flattenValues(getPathValues(output, field));
  const text = values
    .map(value => typeof value === 'string' ? value : JSON.stringify(value))
    .join(' ');
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
  output: unknown,
  required: string[],
  field?: string
): GradeResult {
  const values = flattenValues(getPathValues(output, field));
  const text = values
    .map(value => typeof value === 'string' ? value : JSON.stringify(value))
    .join('\n');
  const outputLower = text.toLowerCase();
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
 * Metadata field >= grader - checks nested metadata fields
 * Supports dot notation: 'metadata.totalToolsUsed'
 */
export function gradeMetadataFieldGte(
  output: Record<string, unknown>,
  field: string,
  min: number
): GradeResult {
  // Parse dot-notation path
  const parts = field.split('.');
  let value: unknown = output;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return {
        score: 0,
        passed: false,
        details: `Field not found: ${field}`,
      };
    }
  }

  const numValue = typeof value === 'number' ? value : 0;
  const passed = numValue >= min;
  const score = passed ? 100 : Math.round((numValue / min) * 100);

  return {
    score,
    passed,
    details: `${field}: ${numValue} (min: ${min})`,
  };
}

/**
 * Set coverage grader - checks that expected items appear in the output set.
 */
export function gradeSetCoverage(
  output: unknown,
  expected: string[],
  field?: string,
  minCoverage = 70
): GradeResult {
  if (!Array.isArray(expected) || expected.length === 0) {
    return {
      score: 0,
      passed: false,
      details: 'Expected set missing or empty',
    };
  }

  const values = flattenValues(getPathValues(output, field))
    .map(value => String(value).toLowerCase());
  const expectedLower = expected.map(item => item.toLowerCase());
  const found = expectedLower.filter(item => values.includes(item));
  const score = expectedLower.length > 0
    ? Math.round((found.length / expectedLower.length) * 100)
    : 100;
  const passed = score >= minCoverage;

  return {
    score,
    passed,
    details: `Coverage: ${found.length}/${expectedLower.length} (${score}%)`,
  };
}

/**
 * LLM Judge grader - uses LLM to score output or deterministic heuristics
 * When no LLM client is provided, uses content-based heuristics for scoring
 */
export async function gradeLlmJudge(
  output: unknown,
  prompt: string,
  llmClient?: (prompt: string) => Promise<string>
): Promise<GradeResult> {
  // If LLM client available, use it
  if (llmClient) {
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

  // Deterministic heuristics when no LLM client
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
  let score = 50;  // Base score
  const factors: string[] = [];

  // Content length scoring (more content = higher score, up to a point)
  const wordCount = outputStr.split(/\s+/).length;
  if (wordCount > 100) {
    score += 10;
    factors.push(`good length (${wordCount} words)`);
  }
  if (wordCount > 500) {
    score += 10;
    factors.push('comprehensive');
  }

  // Structure scoring (has lists, headers, or JSON structure)
  if (outputStr.includes('- ') || outputStr.includes('* ') || outputStr.includes('1.')) {
    score += 5;
    factors.push('has lists');
  }
  if (outputStr.includes('#') || outputStr.includes('**')) {
    score += 5;
    factors.push('has structure');
  }

  // Specificity scoring (numbers, dates, technical terms)
  if (/\d+%|\$\d+|\d{4}/.test(outputStr)) {
    score += 10;
    factors.push('has specifics');
  }

  // No empty or minimal output
  if (wordCount < 20) {
    score = 20;
    factors.length = 0;
    factors.push('too brief');
  }

  const passed = score >= 70;
  return {
    score: Math.min(100, score),
    passed,
    details: `Heuristic score: ${score}% (${factors.join(', ') || 'baseline'})`,
  };
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
  | 'llm_judge'
  | 'metadata_field_gte'
  | 'set_coverage';

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
      return gradeWordCountGte(
        output,
        params.min as number,
        params.field as string | undefined
      );

    case 'section_presence':
      return gradeSectionPresence(
        output,
        params.required as string[],
        params.field as string | undefined
      );

    case 'llm_judge':
      return gradeLlmJudge(output, params.prompt as string, llmClient);

    case 'metadata_field_gte':
      return gradeMetadataFieldGte(
        output as Record<string, unknown>,
        params.field as string,
        params.min as number
      );

    case 'set_coverage':
      return gradeSetCoverage(
        output,
        params.expected as string[],
        params.field as string | undefined,
        params.minCoverage as number | undefined
      );

    default:
      return {
        score: 0,
        passed: false,
        details: `Unknown scorer: ${scorer}`,
      };
  }
}
