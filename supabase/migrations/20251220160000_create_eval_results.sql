-- ═══════════════════════════════════════════════════════════════
-- EVAL RESULTS TABLE
-- Stores results from automated evaluation runs
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS eval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  stage TEXT NOT NULL,
  test_id TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  model_used TEXT,
  git_sha TEXT,
  duration_ms INTEGER,
  criteria_results JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by run
CREATE INDEX idx_eval_results_run_id ON eval_results(run_id);

-- Index for querying by stage
CREATE INDEX idx_eval_results_stage ON eval_results(stage);

-- Index for time-based queries
CREATE INDEX idx_eval_results_created_at ON eval_results(created_at);

-- ═══════════════════════════════════════════════════════════════
-- EVAL RUNS TABLE
-- Stores summary of each evaluation run
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS eval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  git_sha TEXT,
  total_tests INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  aggregate_score NUMERIC(5,2) NOT NULL,
  stage_results JSONB NOT NULL,
  baseline_comparison JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-based queries
CREATE INDEX idx_eval_runs_timestamp ON eval_runs(timestamp);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- Eval results are read-only for authenticated users
-- Write access only via service role (CI)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE eval_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "eval_results_read_authenticated"
  ON eval_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "eval_runs_read_authenticated"
  ON eval_runs
  FOR SELECT
  TO authenticated
  USING (true);

-- Write access only for service role (CI/CD)
-- Note: service_role bypasses RLS by default

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE eval_results IS 'Individual test results from evaluation runs';
COMMENT ON TABLE eval_runs IS 'Summary of each evaluation run';
COMMENT ON COLUMN eval_results.run_id IS 'Links to eval_runs.run_id';
COMMENT ON COLUMN eval_results.stage IS 'questions, research, or spec';
COMMENT ON COLUMN eval_results.criteria_results IS 'Detailed per-criterion scores';
COMMENT ON COLUMN eval_runs.baseline_comparison IS 'Comparison against baseline if provided';
