-- Update model references to verified December 2025 models
-- Evidence Ledger: docs/reports/model-evidence-ledger-2025-12-19.md
-- Date: December 19, 2025

-- Update agent prompts with verified model references
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"gpt-5.2"'
)
WHERE name IN ('agent_elon', 'agent_steve', 'agent_amal');

-- Update Gemini models (gemini-2.5-flash -> gemini-3-flash)
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"gemini-3-flash"'
)
WHERE name IN ('agent_oprah', 'agent_bartlett');

-- Update Claude models (claude-sonnet-4.5 -> claude-opus-4.5)
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"claude-opus-4.5"'
)
WHERE name IN ('agent_zaha', 'agent_jony');

-- Update debate resolution model
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"claude-opus-4.5"'
)
WHERE name = 'debate_resolution';

-- Update specification generation model
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"gpt-5.2"'
)
WHERE name = 'specification_generation';

-- Update research stage prompt to reference December 2025 instead of November 2025
UPDATE prompts
SET content = REPLACE(content, 'November 2025', 'December 2025')
WHERE name IN ('research_stage', 'question_generation', 'synthesis_stage');

-- Update question generation to reference December 2025
UPDATE prompts
SET content = REPLACE(content, 'November 2025', 'December 2025')
WHERE name = 'question_generation';

-- Update specification generation to reference December 2025
UPDATE prompts
SET content = REPLACE(content, 'November 2025', 'December 2025')
WHERE name = 'specification_generation';

-- Add version history for these updates
INSERT INTO prompt_versions (prompt_id, version, content, metadata)
SELECT id, version + 1, content, metadata
FROM prompts
WHERE name IN (
    'agent_elon', 'agent_steve', 'agent_amal',
    'agent_oprah', 'agent_bartlett',
    'agent_zaha', 'agent_jony',
    'debate_resolution', 'specification_generation',
    'research_stage', 'question_generation', 'synthesis_stage'
)
ON CONFLICT (prompt_id, version) DO NOTHING;

-- Update version numbers
UPDATE prompts
SET version = version + 1
WHERE name IN (
    'agent_elon', 'agent_steve', 'agent_amal',
    'agent_oprah', 'agent_bartlett',
    'agent_zaha', 'agent_jony',
    'debate_resolution', 'specification_generation',
    'research_stage', 'question_generation', 'synthesis_stage'
);
