// Mock Deno modules that are imported by URL in the original file
// Since we are running in Node context with Vitest, we need to mock these imports
// or restructure the test to avoid importing files with URL imports directly.

// However, the issue is that 'supabase/functions/lib/expert-matcher.ts' uses
// Deno URL imports:
// import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// We cannot easily run this file in Node/Vitest without transpilation or mocking.
// A simpler approach for verification is to extract the logic into a pure function
// in the test file that replicates the bug, confirming the logic error,
// then fix it in the source file.

import { describe, it, expect } from 'vitest';

// Replicating the logic from expert-matcher.ts to demonstrate the bug
// because we can't import the Deno file directly in this environment.

interface ResearchQuestion {
  id: string;
  priority: number;
  domain: string;
}

interface ExpertAssignment {
  expertId: string;
  questions: ResearchQuestion[];
}

function balanceWorkload(assignments: ExpertAssignment[]): ExpertAssignment[] {
  // Find max questions assigned to any expert
  const maxQuestions = Math.max(...assignments.map(a => a.questions.length));

  // If any expert has more than 2x the average, redistribute
  // BUG: Division by zero if assignments is empty
  const avgQuestions = assignments.reduce((sum, a) => sum + a.questions.length, 0) / assignments.length;

  if (maxQuestions > avgQuestions * 2) {
    // ... logic ...
  }

  return assignments;
}

describe('Expert Matcher - Workload Balance Bug', () => {
  it('should reproduce -Infinity maxQuestions with empty assignments', () => {
    const emptyAssignments: ExpertAssignment[] = [];
    const maxQuestions = Math.max(...emptyAssignments.map(a => a.questions.length));
    expect(maxQuestions).toBe(-Infinity);
  });

  it('should reproduce NaN avgQuestions with empty assignments', () => {
    const emptyAssignments: ExpertAssignment[] = [];
    const avgQuestions = emptyAssignments.reduce((sum, a) => sum + a.questions.length, 0) / emptyAssignments.length;
    expect(avgQuestions).toBeNaN();
  });
});
