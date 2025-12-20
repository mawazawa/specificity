import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { ResearchQuestion, ResearchQuestionSchema } from './question-generator.ts';
import { AgentConfig, agentConfigSchema } from '../multi-agent-spec/lib/types.ts'; // Import from types.ts

export const ExpertAssignmentSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  questions: z.array(ResearchQuestionSchema),
  model: z.string(),
});

export type ExpertAssignment = z.infer<typeof ExpertAssignmentSchema>;

/**
 * Model selection based on expert specialty
 * Verified: December 19, 2025
 * See: docs/reports/model-evidence-ledger-2025-12-19.md
 */
const EXPERT_MODEL_MAP: Record<string, string> = {
  'elon': 'gpt-5.2-codex', // Technical/architecture - best for code
  'steve': 'claude-opus-4.5', // Design/UX - best reasoning
  'jony': 'claude-opus-4.5', // Design precision
  'zaha': 'claude-opus-4.5', // Creative design
  'bartlett': 'gemini-3-flash', // Market/growth - fast & cheap
  'oprah': 'gemini-3-flash', // Human connection
  'amal': 'gpt-5.2' // Legal reasoning - deep thinking
};

/**
 * Domain expertise scores for each expert
 */
const DOMAIN_EXPERTISE: Record<string, Record<string, number>> = {
  'technical': { elon: 10, jony: 8, steve: 6, amal: 3 },
  'design': { steve: 10, jony: 10, zaha: 9, oprah: 5 },
  'market': { bartlett: 10, oprah: 8, steve: 6 },
  'legal': { amal: 10, elon: 3 },
  'growth': { bartlett: 10, oprah: 8, steve: 6 },
  'security': { amal: 8, elon: 7 }
};

/**
 * Assign research questions to most qualified experts
 */
export function assignQuestionsToExperts(
  questions: ResearchQuestion[],
  availableExperts: AgentConfig[]
): ExpertAssignment[] {
  const assignments: Map<string, ExpertAssignment> = new Map();

  // Initialize assignments for all enabled experts
  availableExperts
    .filter(expert => expert.enabled)
    .forEach(expert => {
      assignments.set(expert.id, {
        expertId: expert.id,
        expertName: expert.agent,
        questions: [],
        model: selectModelForExpert(expert.id)
      });
    });

  // Assign each question to best-matched expert(s)
  questions.forEach(question => {
    const scoredExperts = availableExperts
      .filter(expert => expert.enabled)
      .map(expert => ({
        expert,
        score: calculateExpertScore(question, expert)
      }))
      .sort((a, b) => b.score - a.score);

    // High priority questions (8+) go to top 2 experts
    // Lower priority questions go to top 1 expert
    const assignToCount = question.priority >= 8 ? 2 : 1;
    const topExperts = scoredExperts.slice(0, assignToCount);

    topExperts.forEach(({ expert }) => {
      const assignment = assignments.get(expert.id);
      if (assignment) {
        assignment.questions.push(question);
      }
    });
  });

  // Filter out experts with no questions
  const result = Array.from(assignments.values())
    .filter(a => a.questions.length > 0);

  console.log(`[ExpertMatcher] Assigned questions to ${result.length} experts`);
  result.forEach(assignment => {
    console.log(`  - ${assignment.expertName}: ${assignment.questions.length} questions (model: ${assignment.model})`);
  });

  return result;
}

/**
 * Calculate how well an expert matches a question
 */
function calculateExpertScore(question: ResearchQuestion, expert: AgentConfig): number {
  let score = 0;

  // Domain expertise match
  const domainScore = DOMAIN_EXPERTISE[question.domain]?.[expert.id] || 0;
  score += domainScore * 2; // Weight domain expertise heavily

  // Explicit expertise requirement match
  if (question.requiredExpertise.includes(expert.id)) {
    score += 15; // Strong boost for explicit requirements
  }

  // Priority weighting (higher priority = slightly prefer specialists)
  score += question.priority / 2;

  return score;
}

/**
 * Select best model for each expert's specialty
 */
function selectModelForExpert(expertId: string): string {
  return EXPERT_MODEL_MAP[expertId] || 'deepseek-r1-distill'; // Verified fallback
}

/**
 * Balance workload across experts to prevent overload
 */
export function balanceWorkload(assignments: ExpertAssignment[]): ExpertAssignment[] {
  // Find max questions assigned to any expert
  const maxQuestions = Math.max(...assignments.map(a => a.questions.length));

  // If any expert has more than 2x the average, redistribute
  const avgQuestions = assignments.reduce((sum, a) => sum + a.questions.length, 0) / assignments.length;

  if (maxQuestions > avgQuestions * 2) {
    console.warn(`[ExpertMatcher] Workload imbalance detected. Max: ${maxQuestions}, Avg: ${avgQuestions.toFixed(1)}`);

    // Sort by question count descending
    const sorted = [...assignments].sort((a, b) => b.questions.length - a.questions.length);

    // Move low-priority questions from overloaded experts to underloaded ones
    const overloaded = sorted.filter(a => a.questions.length > avgQuestions * 1.5);
    const underloaded = sorted.filter(a => a.questions.length < avgQuestions);

    overloaded.forEach(overloadedExpert => {
      const lowPriorityQuestions = overloadedExpert.questions
        .filter(q => q.priority < 7)
        .sort((a, b) => a.priority - b.priority);

      lowPriorityQuestions.slice(0, Math.floor(lowPriorityQuestions.length / 2)).forEach(question => {
        // Find underloaded expert who can handle this domain
        const targetExpert = underloaded.find(expert =>
          DOMAIN_EXPERTISE[question.domain]?.[expert.expertId] > 5
        );

        if (targetExpert) {
          // Move question
          overloadedExpert.questions = overloadedExpert.questions.filter(q => q.id !== question.id);
          targetExpert.questions.push(question);
        }
      });
    });

    console.log('[ExpertMatcher] Workload rebalanced');
  }

  return assignments;
}
