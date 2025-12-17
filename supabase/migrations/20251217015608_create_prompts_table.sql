-- Create prompts management system
-- This enables dynamic prompt management with versioning, usage tracking, and performance metrics

-- Main prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  category TEXT, -- 'agent', 'question', 'challenge', 'debate', 'spec'
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb, -- For templating variables, examples, config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Performance tracking fields
  avg_quality_score DECIMAL(3,2) DEFAULT NULL,
  total_uses INTEGER DEFAULT 0,
  avg_cost_cents INTEGER DEFAULT NULL,

  CONSTRAINT valid_version CHECK (version > 0),
  CONSTRAINT valid_quality_score CHECK (avg_quality_score IS NULL OR (avg_quality_score >= 0 AND avg_quality_score <= 10)),
  CONSTRAINT valid_category CHECK (category IN ('agent', 'question', 'challenge', 'debate', 'spec'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prompts_name_active ON prompts(name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON prompts(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompts_updated_at_trigger
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompts_updated_at();

-- Version history table for rollback capability
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(prompt_id, version)
);

-- Index for version lookups
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON prompt_versions(created_at DESC);

-- Usage tracking for analytics and optimization
CREATE TABLE IF NOT EXISTS prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  session_id UUID,
  quality_score DECIMAL(3,2), -- User rating or automated eval (0-10)
  cost_cents INTEGER, -- API cost in cents
  latency_ms INTEGER, -- Response time
  model_used TEXT, -- Which LLM was used
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_quality_score_usage CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 10)),
  CONSTRAINT valid_cost CHECK (cost_cents IS NULL OR cost_cents >= 0),
  CONSTRAINT valid_latency CHECK (latency_ms IS NULL OR latency_ms >= 0)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_session_id ON prompt_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_created_at ON prompt_usage(created_at DESC);

-- Function to update prompt statistics based on usage
CREATE OR REPLACE FUNCTION update_prompt_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prompts
  SET
    total_uses = total_uses + 1,
    avg_quality_score = (
      SELECT AVG(quality_score)
      FROM prompt_usage
      WHERE prompt_id = NEW.prompt_id AND quality_score IS NOT NULL
    ),
    avg_cost_cents = (
      SELECT AVG(cost_cents)::INTEGER
      FROM prompt_usage
      WHERE prompt_id = NEW.prompt_id AND cost_cents IS NOT NULL
    )
  WHERE id = NEW.prompt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_usage_statistics_trigger
  AFTER INSERT ON prompt_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_statistics();

-- Comments for documentation
COMMENT ON TABLE prompts IS 'Centralized prompt management with versioning and analytics';
COMMENT ON TABLE prompt_versions IS 'Version history for rollback and auditing';
COMMENT ON TABLE prompt_usage IS 'Usage tracking for performance optimization and cost analysis';
COMMENT ON COLUMN prompts.metadata IS 'JSON config for template variables, model settings, etc.';
COMMENT ON COLUMN prompts.category IS 'Prompt category: agent, question, challenge, debate, spec';
