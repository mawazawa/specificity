/**
 * Bug Fixes Unit Tests
 * Tests for the 5 critical runtime bug fixes applied in Phase A-E
 *
 * Bugs Fixed:
 * 1. Division by zero in approval rate (use-spec-flow.ts)
 * 2. Division by zero in research depth (spec.ts)
 * 3. Division by zero in avg risk score (challenge.ts)
 * 4. Null/undefined access in synthesis.ts debate resolution
 * 5. Type coercion in VotingPanel.tsx boolean check
 */

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Bug #1: Division by Zero - Approval Rate
// File: src/hooks/spec-generation/use-spec-flow.ts:391
// ═══════════════════════════════════════════════════════════════════════════════

describe('Approval Rate Calculation', () => {
  // Simulates the fixed logic from use-spec-flow.ts
  const calculateApprovalRate = (votes: { approved: boolean }[]) => {
    return votes.length > 0
      ? votes.filter((v) => v.approved).length / votes.length
      : 0;
  };

  it('should return 0 when votes array is empty', () => {
    const result = calculateApprovalRate([]);
    expect(result).toBe(0);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('should calculate correct approval rate with all approved', () => {
    const votes = [{ approved: true }, { approved: true }];
    expect(calculateApprovalRate(votes)).toBe(1);
  });

  it('should calculate correct approval rate with mixed votes', () => {
    const votes = [
      { approved: true },
      { approved: false },
      { approved: true },
      { approved: false }
    ];
    expect(calculateApprovalRate(votes)).toBe(0.5);
  });

  it('should calculate correct approval rate with all rejected', () => {
    const votes = [{ approved: false }, { approved: false }];
    expect(calculateApprovalRate(votes)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug #2: Division by Zero - Research Depth Weighting
// File: supabase/functions/multi-agent-spec/lib/stages/spec.ts:19
// ═══════════════════════════════════════════════════════════════════════════════

describe('Research Depth Weighting', () => {
  // Simulates the fixed logic from spec.ts
  const calculateResearchDepth = (toolsUsed: number, avgToolsUsed: number) => {
    return avgToolsUsed > 0 ? toolsUsed / avgToolsUsed : 1;
  };

  it('should return 1 (neutral weight) when avgToolsUsed is 0', () => {
    const result = calculateResearchDepth(5, 0);
    expect(result).toBe(1);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('should calculate correct ratio when avgToolsUsed is positive', () => {
    expect(calculateResearchDepth(4, 2)).toBe(2);
    expect(calculateResearchDepth(2, 4)).toBe(0.5);
    expect(calculateResearchDepth(3, 3)).toBe(1);
  });

  it('should handle 0 tools used correctly', () => {
    expect(calculateResearchDepth(0, 5)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug #3: Division by Zero - Average Risk Score
// File: supabase/functions/multi-agent-spec/lib/stages/challenge.ts:68
// ═══════════════════════════════════════════════════════════════════════════════

describe('Average Risk Score Calculation', () => {
  interface ChallengeResponse {
    riskScore: number;
  }

  // Simulates the fixed logic from challenge.ts
  const calculateAvgRiskScore = (challengeResponses: ChallengeResponse[]) => {
    return challengeResponses.length > 0
      ? challengeResponses.reduce((sum, c) => sum + c.riskScore, 0) / challengeResponses.length
      : 0;
  };

  it('should return 0 when challengeResponses is empty', () => {
    const result = calculateAvgRiskScore([]);
    expect(result).toBe(0);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('should calculate correct average with multiple responses', () => {
    const responses = [
      { riskScore: 2 },
      { riskScore: 4 },
      { riskScore: 6 }
    ];
    expect(calculateAvgRiskScore(responses)).toBe(4);
  });

  it('should handle single response correctly', () => {
    expect(calculateAvgRiskScore([{ riskScore: 7.5 }])).toBe(7.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug #4: Safe Array Access - Debate Resolution
// File: supabase/functions/multi-agent-spec/lib/stages/synthesis.ts
// ═══════════════════════════════════════════════════════════════════════════════

describe('Debate Resolution Safe Access', () => {
  interface DebateResolution {
    resolution: string;
    challenges?: string[];
    confidenceChange?: number;
    adoptedAlternatives?: string[];
  }

  // Simulates the fixed logic from synthesis.ts
  const getDebateContext = (
    debateResolutions: DebateResolution[],
    idx: number
  ): string => {
    const debateResolution = idx < debateResolutions.length ? debateResolutions[idx] : undefined;

    if (!debateResolution || !debateResolution.resolution) {
      return '';
    }

    return `Resolution: ${debateResolution.resolution}
Challenges: ${(debateResolution.challenges || []).join('; ')}
Confidence: ${debateResolution.confidenceChange || 0}%
Alternatives: ${(debateResolution.adoptedAlternatives || []).join(', ') || 'None'}`;
  };

  it('should return empty string when idx is out of bounds', () => {
    const resolutions: DebateResolution[] = [{ resolution: 'Test' }];
    expect(getDebateContext(resolutions, 5)).toBe('');
  });

  it('should return empty string when array is empty', () => {
    expect(getDebateContext([], 0)).toBe('');
  });

  it('should return empty string when resolution property is missing', () => {
    const resolutions = [{ resolution: '' }];
    expect(getDebateContext(resolutions, 0)).toBe('');
  });

  it('should return formatted context when valid', () => {
    const resolutions: DebateResolution[] = [{
      resolution: 'Use React',
      challenges: ['Performance', 'Complexity'],
      confidenceChange: 15,
      adoptedAlternatives: ['Vue alternative']
    }];
    const result = getDebateContext(resolutions, 0);
    expect(result).toContain('Resolution: Use React');
    expect(result).toContain('Challenges: Performance; Complexity');
    expect(result).toContain('Confidence: 15%');
    expect(result).toContain('Alternatives: Vue alternative');
  });

  it('should handle missing optional fields gracefully', () => {
    const resolutions: DebateResolution[] = [{ resolution: 'Minimal' }];
    const result = getDebateContext(resolutions, 0);
    expect(result).toContain('Resolution: Minimal');
    expect(result).toContain('Challenges: ');
    expect(result).toContain('Confidence: 0%');
    expect(result).toContain('Alternatives: None');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug #5: Type Coercion - Boolean Check
// File: src/components/VotingPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════════

describe('Vote Approval Boolean Check', () => {
  interface Vote {
    agent: string;
    approved: boolean | null | undefined;
  }

  // Simulates the fixed logic from VotingPanel.tsx
  const categorizeVotes = (votes: Vote[]) => {
    // Explicit boolean check to handle null/undefined/truthy values from API
    const approved = votes.filter(v => v.approved === true);
    const dissented = votes.filter(v => v.approved !== true);
    return { approved, dissented };
  };

  it('should correctly categorize explicit true as approved', () => {
    const votes: Vote[] = [
      { agent: 'elon', approved: true },
      { agent: 'steve', approved: false }
    ];
    const { approved, dissented } = categorizeVotes(votes);
    expect(approved.length).toBe(1);
    expect(dissented.length).toBe(1);
  });

  it('should treat null as dissent (not approved)', () => {
    const votes: Vote[] = [
      { agent: 'elon', approved: null }
    ];
    const { approved, dissented } = categorizeVotes(votes);
    expect(approved.length).toBe(0);
    expect(dissented.length).toBe(1);
  });

  it('should treat undefined as dissent (not approved)', () => {
    const votes: Vote[] = [
      { agent: 'elon', approved: undefined }
    ];
    const { approved, dissented } = categorizeVotes(votes);
    expect(approved.length).toBe(0);
    expect(dissented.length).toBe(1);
  });

  it('should handle empty votes array', () => {
    const { approved, dissented } = categorizeVotes([]);
    expect(approved.length).toBe(0);
    expect(dissented.length).toBe(0);
  });

  it('should correctly count mixed approval states', () => {
    const votes: Vote[] = [
      { agent: 'elon', approved: true },
      { agent: 'steve', approved: true },
      { agent: 'oprah', approved: false },
      { agent: 'zaha', approved: null },
      { agent: 'jony', approved: undefined }
    ];
    const { approved, dissented } = categorizeVotes(votes);
    expect(approved.length).toBe(2);
    expect(dissented.length).toBe(3);
  });
});
