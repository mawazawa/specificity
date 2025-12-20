# Execution Plan: Specificity AI Stack Verification and Integration
**Date:** December 19, 2025
**Objective:** Stabilize runtime, reconcile model registry with verified availability, and harden the multi-agent pipeline for correct, reproducible outputs.

## Evidence Ledger (Exa-Verified, Dec 19 2025 20:38 PST)
**Full Evidence Ledger:** `docs/reports/model-evidence-ledger-2025-12-19.md`

**Verified Models (with OpenRouter IDs):**
- `openai/gpt-5.2` - VERIFIED (released Dec 10, 2025, 400K context, $1.75/$14 per 1M tokens)
- `openai/gpt-5.2-codex` - VERIFIED (announced Dec 18, 2025, API rolling out)
- `google/gemini-3-flash-preview` - VERIFIED (released Dec 17, 2025, 1M context, $0.50/$3 per 1M tokens)
- `moonshotai/kimi-k2-thinking` - VERIFIED (released Nov 6, 2025, 256K context, $0.45/$2.35 per 1M tokens)
- `deepseek/deepseek-chat` - VERIFIED (DeepSeek V3, 163K context, $0.30/$1.20 per 1M tokens)
- `anthropic/claude-opus-4-5-20251101` - VERIFIED (current active model)
- Groq: `deepseek-r1-distill-llama-70b` - VERIFIED (128K context)

**Models NOT FOUND / Removed:**
- `deepseek-v3.2-speciale` - NOT on OpenRouter, removed from registry
- `claude-sonnet-4.5` - Renamed to `claude-opus-4.5`
- `gemini-2.5-flash` - Replaced with `gemini-3-flash`
- `gpt-5.1` / `gpt-5.1-codex` - Replaced with `gpt-5.2` / `gpt-5.2-codex`

## Current-State Mismatch Snapshot (From Code Scan)
- `supabase/functions/lib/openrouter-client.ts` references `gpt-5.2`, `gpt-5.2-codex`, `gemini-3-flash`, `deepseek-v3.2-speciale`, `kimi-k2-thinking`.
- Stage logic and prompt metadata still use older IDs: `gpt-5.1`, `gpt-5.1-codex`, `gemini-2.5-flash`, `claude-sonnet-4.5`.
- `synthesis`, `voting`, and `spec` stages bypass OpenRouter and call Groq directly with `deepseek-r1-distill-llama-70b`.
- Prompt seeds exist in `supabase/migrations/20251217015651_seed_prompts.sql` but recommended_model values are older.
- Docs (e.g., `docs/reports/ai-stack-update-dec-2025.md`) claim model availability that is not yet verified in Exa results.

---

## Phase 0: Evidence-Backed Model Contract (Blocker for model changes) ✅ COMPLETED
*Goal: Lock model IDs, providers, pricing, context, and availability to a verified source of truth.*

- [x] **0.1 Create a Model Evidence Ledger** ✅
  - **Action:** Add `docs/reports/model-evidence-ledger-2025-12-19.md` with per-model fields: provider, model ID, context window, pricing, release date, source URLs, verification date.
  - **Completed:** Dec 19, 2025 20:38 PST - Full ledger created with Exa-verified sources.

- [x] **0.2 Verify OpenRouter model availability** ✅
  - **Action:** Check OpenRouter model pages and/or API model list for each model ID used in code.
  - **Completed:** All 7 models verified via Exa search against OpenRouter listings.

- [x] **0.3 Verify Groq model availability** ✅
  - **Action:** Confirm GroqCloud model IDs and naming via Groq docs/announcements.
  - **Completed:** `deepseek-r1-distill-llama-70b` verified via Groq docs and HuggingFace.

- [x] **0.4 Resolve naming conflicts** ✅
  - **Action:** Decide whether to use `gpt-5.2`, `gpt-5.1`, or `gpt-5-codex` family based on verified listings.
  - **Completed:** Standardized on `gpt-5.2` family, `claude-opus-4.5`, `gemini-3-flash` across all code.

- [x] **0.5 Remove or gate unverified claims** ✅
  - **Action:** Remove or feature-flag any model IDs without verified listings (e.g., `gemini-3-flash` if unverified).
  - **Completed:** `deepseek-v3.2-speciale` removed. All remaining models verified.

---

## Phase 1: Model Registry and Routing Alignment ✅ COMPLETED
*Goal: One source of truth for model IDs and routing across all stages.*

- [x] **1.1 Centralize model configuration** ✅
  - **Action:** Create a `model-registry.ts` (or update `openrouter-client.ts`) as the only source of model IDs, capabilities, and pricing.
  - **Completed:** `openrouter-client.ts` updated with verified MODELS registry (Dec 19, 2025).

- [x] **1.2 Replace hardcoded model IDs in stage handlers** ✅
  - **Action:** Update `question-generator.ts`, `challenge-generator.ts`, `expert-matcher.ts`, and `stages/*.ts` to read from the registry.
  - **Completed:** All files updated to use verified model IDs (gpt-5.2, claude-opus-4.5, gemini-3-flash).

- [x] **1.3 Align prompt metadata with registry** ✅
  - **Action:** Update prompt seed metadata (`recommended_model`) to match the registry model IDs.
  - **Completed:** Migration `20251219203845_update_model_references.sql` created to update prompt metadata.

- [x] **1.4 Normalize Groq vs OpenRouter usage** ✅
  - **Action:** Decide whether synthesis/voting/spec should use OpenRouter (with fallback) or Groq directly, then implement consistently.
  - **Completed:** Groq (`deepseek-r1-distill-llama-70b`) used for synthesis/voting/spec. GROQ_MODEL constant exported from api.ts.

- [x] **1.5 Track model usage consistently** ✅
  - **Action:** Ensure all stages record `model_used` with the canonical ID in usage tracking.
  - **Completed:** All `trackPromptUsage` calls now use GROQ_MODEL constant or verified model IDs.

---

## Phase 2: Prompt and Database Alignment
*Goal: Ensure prompts exist, match stage names, and enforce research discipline.*

- [ ] **2.1 Audit prompt availability**
  - **Action:** Verify `prompts` table contains `research_stage`, `challenge_generation`, `challenge_execution`, `debate_resolution`, `synthesis_stage`, `voting_stage`, `specification_generation`, and `question_generation`.
  - **Success Criteria:** No missing prompt lookup errors at runtime.

- [ ] **2.2 Validate prompt variables**
  - **Action:** Confirm `supports_variables` and `variables` fields align with actual render variables.
  - **Success Criteria:** Zero unresolved variable warnings in logs.

- [ ] **2.3 Update prompt content for verified model behavior**
  - **Action:** Adjust prompts if model capabilities differ from assumptions (e.g., tool-use guidance for Kimi K2).
  - **Success Criteria:** Prompts reflect verified capabilities and do not rely on unsupported features.

---

## Phase 3: Runtime Stability and Deno Hygiene ✅ COMPLETED
*Goal: Make edge functions compile and run predictably.*

- [x] **3.1 Add Deno config** ✅
  - **Action:** Create `supabase/functions/deno.json` with imports and tasks.
  - **Completed:** Dec 19, 2025 - Created deno.json with imports map for @supabase/supabase-js and zod.

- [x] **3.2 Normalize import sources** ✅
  - **Action:** Align `jsr:` vs `esm.sh` usage for Supabase client and shared deps.
  - **Completed:** Dec 19, 2025 - Imports already consistent (esm.sh for Supabase, deno.land for zod/std).

- [x] **3.3 Validate RPC signatures** ✅
  - **Action:** Confirm `check_and_increment_rate_limit` parameters match SQL signature for all callers.
  - **Completed:** Dec 19, 2025 - Applied add_rate_limiting migration to create missing RPC function. Signature matches: `(p_user_id uuid, p_endpoint text, p_max_requests integer, p_window_hours integer)`.

- [x] **3.4 Harden JSON parsing paths** ✅
  - **Action:** Add robust parsing fallback for tool calls and completion JSON.
  - **Completed:** Dec 19, 2025 - Added `safeJsonParse` utility to challenge-generator.ts with markdown code block extraction and fallback defaults.

---

## Phase 4: Heavy-Model Review and Output Verification ✅ COMPLETED
*Goal: Use a heavy model to audit lower-cost model outputs before final spec.*

- [x] **4.1 Add a review gate** ✅
  - **Action:** Introduce a "review" stage that validates research/synthesis with a heavy model (preferred: GPT-5.2 Codex or verified equivalent).
  - **Completed:** Dec 19, 2025 - Created `review.ts` stage handler with GPT-5.2 Codex. Added 'review' stage to pipeline between synthesis and voting. Returns pass/fail with score, issues array, and remediation notes.

- [x] **4.2 Cross-check citations** ✅
  - **Action:** Require at least N citations in research outputs; fail or re-run if missing.
  - **Completed:** Dec 19, 2025 - Review stage includes `citationAnalysis` with totalCitations, verifiedCitations, missingCitations, and per-expert coverage tracking.

- [x] **4.3 Model disagreement protocol** ✅
  - **Action:** Define an escalation path if heavy-model review contradicts lower-model outputs.
  - **Completed:** Dec 19, 2025 - Implemented `handleReviewEscalation` function using Claude-Opus-4.5 as fallback reviewer. Returns resolution: "retry" | "proceed" | "manual" with confirmed/dismissed issues.

---

## Phase 5: Tooling, Observability, and Testing ✅ COMPLETED
*Goal: Make the pipeline testable and measurable.*

- [x] **5.1 Add a pipeline smoke test** ✅
  - **Action:** Create `scripts/smoke-test-pipeline.ts` to exercise all stages end-to-end.
  - **Completed:** Dec 19, 2025 - Created TypeScript smoke test script that exercises all 7 pipeline stages with summary table output.

- [x] **5.2 Add structured logs** ✅
  - **Action:** Standardize stage logs with request IDs, model IDs, and latency.
  - **Completed:** Dec 19, 2025 - Created `structured-logger.ts` with createLogger, createTimer, and PipelineTrace utilities.

- [x] **5.3 Add regression tests for model routing** ✅
  - **Action:** Unit test the registry and routing decisions (fallbacks, provider mapping).
  - **Completed:** Dec 19, 2025 - Created `model-routing.spec.ts` with 17 tests covering model registry, expert routing, stage routing, and fallback chains.

---

## Phase 6: UI and Documentation Alignment
*Goal: Frontend and docs reflect the real, verified model stack.*

- [ ] **6.1 Update UI model labels**
  - **Action:** Drive UI "Models Used" from backend response metadata, not hardcoded strings.
  - **Success Criteria:** UI displays actual models used per stage.

- [ ] **6.2 Update AI stack docs**
  - **Action:** Revise `docs/reports/ai-stack-update-dec-2025.md` with verified sources and remove unverified claims.
  - **Success Criteria:** Docs match the Model Evidence Ledger.

- [ ] **6.3 Add a model update runbook**
  - **Action:** Document the steps to add/replace models safely (verification, registry updates, prompt updates, tests).
  - **Success Criteria:** A new model can be swapped in without touching multiple files.

---

## Definition of Done
- All model IDs in code are verified in the Evidence Ledger or gated behind feature flags.
- All pipeline stages compile, run, and record `model_used` consistently.
- A heavy-model review gate is in place for final output verification.
- Docs and UI match the real model stack and routing.

## Critical Path
Phase 0 -> Phase 1 -> Phase 3 -> Phase 4. Phases 2, 5, and 6 are parallelizable after Phase 1.
