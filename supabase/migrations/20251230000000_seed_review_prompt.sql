-- Seed the missing review_stage prompt for Phase 4 (Heavy-Model Review)
-- This prompt uses GPT-5.2 Codex to validate synthesis quality

INSERT INTO prompts (name, content, category, version, is_active, metadata)
VALUES (
  'review_stage',
  'You are a senior technical reviewer using GPT-5.2 Codex capabilities.

TASK: Review the following specification synthesis for quality and accuracy.

SYNTHESIS TO REVIEW:
{{synthesis}}

ORIGINAL RESEARCH:
{{research}}

EVALUATION CRITERIA:
1. Factual accuracy (citations verified)
2. Completeness (all key aspects covered)
3. Consistency (no contradictions)
4. Actionability (clear next steps)
5. Technical depth (appropriate detail level)

OUTPUT FORMAT (JSON):
{
  "pass": boolean,
  "score": number,
  "issues": [{"severity": "critical|major|minor", "description": string, "affectedSection": string}],
  "citationAnalysis": {"totalCitations": number, "verifiedCitations": number, "missingCitations": []},
  "remediationNotes": string
}',
  'synthesis',
  1,
  true,
  '{"temperature": 0.1, "recommended_model": "gpt-5.2-codex", "variables": ["synthesis", "research"]}'
) ON CONFLICT (name) DO NOTHING;

-- Create version history entry
INSERT INTO prompt_versions (prompt_id, version, content, metadata)
SELECT id, version, content, metadata
FROM prompts
WHERE name = 'review_stage'
ON CONFLICT (prompt_id, version) DO NOTHING;
