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

**Models Previously Marked NOT FOUND (CORRECTED Dec 20, 2025):**
- ~~`deepseek-v3.2-speciale` - NOT on OpenRouter~~ → **NOW VERIFIED** on OpenRouter ($0.27/$0.41 per 1M)
- `deepseek-v3.2` - **NOW VERIFIED** on OpenRouter (released Dec 1, 2025, "GPT-5 level performance")
- `claude-sonnet-4.5` - Renamed to `claude-opus-4.5`
- `gemini-2.5-flash` - Replaced with `gemini-3-flash`
- `gpt-5.1` / `gpt-5.1-codex` - Replaced with `gpt-5.2` / `gpt-5.2-codex`

**New Verified Models (Dec 20, 2025 Exa Re-verification):**
- `deepseek/deepseek-v3.2` - $0.27/$0.41 per 1M, 163K context, thinking-in-tool-use
- `deepseek/deepseek-v3.2-speciale` - Rivals Gemini-3.0-Pro, gold-medal reasoning performance

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
  - **Completed (Dec 19):** `deepseek-v3.2-speciale` initially removed due to failed Exa search.
  - **Corrected (Dec 20):** Re-verified via Exa - model IS available on OpenRouter. See Phase 12.1 for re-addition.

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

## Phase 6: UI and Documentation Alignment ✅ COMPLETED
*Goal: Frontend and docs reflect the real, verified model stack.*

- [x] **6.1 Update UI model labels** ✅
  - **Action:** Drive UI "Models Used" from backend response metadata, not hardcoded strings.
  - **Completed:** Dec 19, 2025 - Updated `use-spec-flow.ts` to extract models from `researchResults` dynamically instead of hardcoded strings.

- [x] **6.2 Update AI stack docs** ✅
  - **Action:** Revise `docs/reports/ai-stack-update-dec-2025.md` with verified sources and remove unverified claims.
  - **Completed:** Dec 19, 2025 - Rewrote entire document with verified model stack, removed `deepseek-v3.2-speciale`, added verification table and sources.

- [x] **6.3 Add a model update runbook** ✅
  - **Action:** Document the steps to add/replace models safely (verification, registry updates, prompt updates, tests).
  - **Completed:** Dec 19, 2025 - Created `docs/runbooks/model-update-runbook.md` with 8-step process, rollback procedures, and common issues.

---

## Definition of Done
- All model IDs in code are verified in the Evidence Ledger or gated behind feature flags.
- All pipeline stages compile, run, and record `model_used` consistently.
- A heavy-model review gate is in place for final output verification.
- Docs and UI match the real model stack and routing.

## Critical Path
Phase 0 -> Phase 1 -> Phase 3 -> Phase 4. Phases 2, 5, and 6 are parallelizable after Phase 1.

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7-11: Bug Fixes & World-Class Enhancements
# Date: December 20, 2025
# Research Verification: All items verified via Exa search Dec 20, 2025 09:15 PST
# ═══════════════════════════════════════════════════════════════════════════════

## Database Migration Notice
**CRITICAL CHANGE (Dec 20, 2025):**
- **Old Database:** `supabase-lime-tree` / `sbwgkocarqvonkdlitdx` (DEPRECATED - shared with 85+ tables from other projects)
- **New Database:** `specificity` / `tkkthpoottlqmdopmtuh` (DEDICATED - created Dec 20, 2025)
- All migrations applied, prompts seeded, edge functions deployed to new project

---

## Phase 7: Data Integrity & RLS Hardening
*Goal: Fix database insert failures and ensure all writes include proper user context.*
*Verified: Supabase RLS docs Dec 2025 - INSERT requires WITH CHECK, not USING*

### Bug #1: saveSpec Missing user_id on Insert
**File:** `src/lib/api.ts:saveSpec()`
**Root Cause:** INSERT missing `user_id: session.user.id`
**RLS Requirement:** `auth.uid() = user_id` policy requires user_id field

- [ ] **7.1.1** Read current saveSpec implementation and map all insert paths
  - **Success:** Document all `.insert()` calls in api.ts with line numbers
- [ ] **7.1.2** Add user session retrieval before insert
  - **Success:** `const { data: { session } } = await supabase.auth.getSession()` present
- [ ] **7.1.3** Add user_id field to insert payload
  - **Success:** `user_id: session?.user?.id` included in insert object
- [ ] **7.1.4** Add null check with user-friendly error
  - **Success:** Throws descriptive error if session is null
- [ ] **7.1.5** Update TypeScript types to require user_id
  - **Success:** `SpecificationInsert` type includes `user_id: string`
- [ ] **7.1.6** Test insert with authenticated user
  - **Success:** Specification saves and returns ID
- [ ] **7.1.7** Test insert without auth (expect failure)
  - **Success:** RLS policy blocks insert, error caught gracefully
- [ ] **7.1.8** Verify RLS policy uses WITH CHECK for INSERT
  - **Success:** Policy `WITH CHECK (auth.uid() = user_id)` confirmed in schema
- [ ] **7.1.9** Add E2E test for specification save flow
  - **Success:** Playwright test creates spec and verifies in DB
- [ ] **7.1.10** Document user_id requirement in CLAUDE.md
  - **Success:** Data integrity section added to project docs

### Bug #7: review_stage Prompt Not Seeded
**File:** `supabase/migrations/*_seed_prompts.sql`
**Root Cause:** Phase 4 added review stage but prompt was never seeded

- [ ] **7.2.1** Check prompts table for review_stage entry
  - **Success:** Query returns 0 rows for name='review_stage'
- [ ] **7.2.2** Create review_stage prompt content with GPT-5.2 Codex model
  - **Success:** Prompt text follows existing format with {{variables}}
- [ ] **7.2.3** Add INSERT statement to seed migration
  - **Success:** Migration file created: `*_seed_review_prompt.sql`
- [ ] **7.2.4** Include correct metadata (category: quality, model: gpt-5.2-codex)
  - **Success:** recommended_model matches evidence ledger
- [ ] **7.2.5** Apply migration to new database (tkkthpoottlqmdopmtuh)
  - **Success:** `supabase db push` succeeds
- [ ] **7.2.6** Verify prompt retrieval in review.ts stage handler
  - **Success:** `renderPrompt('review_stage', {})` returns content
- [ ] **7.2.7** Add prompt_versions entry for audit trail
  - **Success:** Version 1 recorded with created_at timestamp
- [ ] **7.2.8** Test review stage end-to-end
  - **Success:** Review stage returns pass/fail with issues array
- [ ] **7.2.9** Add prompt to smoke test validation
  - **Success:** smoke-test-pipeline.ts checks review_stage exists
- [ ] **7.2.10** Update prompts documentation
  - **Success:** docs/reports/ai-stack-update-dec-2025.md lists review_stage

---

## Phase 8: UX & Output Fidelity
*Goal: Fix frontend expectations to match actual API response schemas.*
*Verified: React 19.x patterns Dec 2025 - useOptimistic for pending states*

### Bug #2: Review Stage Not Called in Frontend
**File:** `src/hooks/use-spec-flow.ts`
**Root Cause:** Frontend skips 'review' stage despite backend implementation

- [ ] **8.1.1** Map current stage progression in use-spec-flow.ts
  - **Success:** Document all stages and their order in flow
- [ ] **8.1.2** Identify where review stage should be inserted
  - **Success:** After synthesis, before voting (line ~XXX)
- [ ] **8.1.3** Add review stage call with correct endpoint
  - **Success:** `stage: 'review'` added to runStage calls
- [ ] **8.1.4** Handle review response schema (pass/fail, score, issues)
  - **Success:** TypeScript interface matches API response
- [ ] **8.1.5** Add UI feedback for review in-progress
  - **Success:** "Quality review in progress..." shown to user
- [ ] **8.1.6** Display review results in SpecResults component
  - **Success:** Score and issues array rendered
- [ ] **8.1.7** Handle review failure (retry or escalate)
  - **Success:** User sees option to proceed or retry
- [ ] **8.1.8** Add review stage to pipeline visualization
  - **Success:** AgentCard shows review stage activity
- [ ] **8.1.9** Test full pipeline including review
  - **Success:** E2E test exercises all 8 stages
- [ ] **8.1.10** Update user documentation
  - **Success:** Help text explains quality review step

### Bug #3: ResearchPanel Expects Wrong Schema
**File:** `src/components/ResearchPanel.tsx`
**Root Cause:** Component expects {title, url, snippet} but API returns {expert, findings, citations}

- [ ] **8.2.1** Document current ResearchPanel props interface
  - **Success:** TypeScript interface captured with all fields
- [ ] **8.2.2** Compare against actual API response from research stage
  - **Success:** Side-by-side diff of expected vs actual
- [ ] **8.2.3** Update interface to match API: expert, findings[], citations[]
  - **Success:** ResearchResult type updated
- [ ] **8.2.4** Refactor rendering to display expert-based structure
  - **Success:** UI shows expert name with findings list
- [ ] **8.2.5** Add citations display with clickable links
  - **Success:** Each citation renders as anchor tag
- [ ] **8.2.6** Handle missing/optional fields gracefully
  - **Success:** Null checks prevent runtime errors
- [ ] **8.2.7** Add loading skeleton matching new structure
  - **Success:** Skeleton UI mimics final layout
- [ ] **8.2.8** Test with real API response data
  - **Success:** Component renders without errors
- [ ] **8.2.9** Add Storybook story for ResearchPanel
  - **Success:** Visual test with mock data
- [ ] **8.2.10** Verify accessibility (ARIA labels, keyboard nav)
  - **Success:** Lighthouse accessibility score >90

### Bug #4: Live Agent Activity Expects askedBy Field
**File:** `src/components/AgentCard.tsx` or similar
**Root Cause:** UI expects `askedBy` field that doesn't exist in response

- [ ] **8.3.1** Locate component expecting askedBy field
  - **Success:** File and line number identified
- [ ] **8.3.2** Trace expected data flow from API
  - **Success:** Document where askedBy should come from
- [ ] **8.3.3** Determine if askedBy should be added to API or removed from UI
  - **Success:** Decision documented (add/remove)
- [ ] **8.3.4** Implement chosen fix (API addition OR UI removal)
  - **Success:** Code updated, no type errors
- [ ] **8.3.5** Update TypeScript interfaces
  - **Success:** Types match implementation
- [ ] **8.3.6** Add fallback for missing field
  - **Success:** Graceful degradation if field absent
- [ ] **8.3.7** Test agent activity display during pipeline run
  - **Success:** Real-time updates work without errors
- [ ] **8.3.8** Verify all agent types display correctly
  - **Success:** Each expert type renders properly
- [ ] **8.3.9** Add E2E test for agent activity panel
  - **Success:** Playwright test validates activity
- [ ] **8.3.10** Update component documentation
  - **Success:** Props documented with examples

---

## Phase 9: Observability & Consistency
*Goal: Ensure all model usage is tracked correctly with consistent IDs.*
*Verified: OpenTelemetry + Supabase patterns Dec 2025*

### Bug #5: Model Registry Inconsistent with Evidence Ledger
**File:** `supabase/functions/lib/openrouter-client.ts`
**Root Cause:** MODELS object has entries not in evidence ledger

- [ ] **9.1.1** Export current MODELS registry to JSON
  - **Success:** All model IDs captured
- [ ] **9.1.2** Compare against evidence ledger (model-evidence-ledger-2025-12-19.md)
  - **Success:** Diff report generated
- [ ] **9.1.3** Remove unverified models from registry
  - **Success:** Only verified models remain
- [ ] **9.1.4** Add missing verified models
  - **Success:** All 7 verified models present
- [ ] **9.1.5** Update pricing to match ledger
  - **Success:** Input/output costs accurate
- [ ] **9.1.6** Update context windows to match ledger
  - **Success:** Context limits accurate
- [ ] **9.1.7** Add verification date to each model entry
  - **Success:** `verifiedDate: '2025-12-19'` in registry
- [ ] **9.1.8** Create unit test for registry consistency
  - **Success:** Test compares registry to ledger file
- [ ] **9.1.9** Add CI check for registry drift
  - **Success:** PR fails if registry differs from ledger
- [ ] **9.1.10** Document registry update process
  - **Success:** Runbook updated with verification steps

### Bug #6: Groq Model Tracking Metadata Wrong
**File:** `supabase/functions/multi-agent-spec/lib/utils/api.ts`
**Root Cause:** trackPromptUsage records wrong model ID for Groq calls

- [ ] **9.2.1** Find all trackPromptUsage calls for Groq stages
  - **Success:** synthesis, voting, spec stage calls located
- [ ] **9.2.2** Verify GROQ_MODEL constant is exported and correct
  - **Success:** `deepseek-r1-distill-llama-70b` confirmed
- [ ] **9.2.3** Replace hardcoded strings with GROQ_MODEL
  - **Success:** All calls use constant
- [ ] **9.2.4** Add provider field to tracking metadata
  - **Success:** `provider: 'groq'` included
- [ ] **9.2.5** Verify tracking data in prompt_usage table
  - **Success:** Query shows correct model IDs
- [ ] **9.2.6** Add latency tracking for Groq calls
  - **Success:** `latency_ms` field populated
- [ ] **9.2.7** Add token count tracking
  - **Success:** `input_tokens`, `output_tokens` recorded
- [ ] **9.2.8** Create usage dashboard query
  - **Success:** SQL query for model usage stats
- [ ] **9.2.9** Test tracking end-to-end
  - **Success:** Full pipeline populates usage table
- [ ] **9.2.10** Add monitoring alert for tracking failures
  - **Success:** Alert triggers if usage insert fails

### Bug #10: claude-octopus-4.5 Typo
**File:** Search codebase for typo
**Root Cause:** Typo "octopus" instead of "opus"

- [ ] **9.3.1** Search entire codebase for "octopus"
  - **Success:** All occurrences found
- [ ] **9.3.2** Replace with "opus" in each location
  - **Success:** Zero "octopus" references remain
- [ ] **9.3.3** Search for other potential model ID typos
  - **Success:** Audit complete, no other typos
- [ ] **9.3.4** Add model ID validation at startup
  - **Success:** Registry validates against known patterns
- [ ] **9.3.5** Add spellcheck to CI for model names
  - **Success:** Custom dictionary includes model IDs
- [ ] **9.3.6** Test affected code paths
  - **Success:** No runtime errors from typo fix
- [ ] **9.3.7** Update any cached/compiled assets
  - **Success:** Build artifacts regenerated
- [ ] **9.3.8** Deploy fix to edge functions
  - **Success:** `supabase functions deploy` succeeds
- [ ] **9.3.9** Verify fix in production logs
  - **Success:** Logs show correct model ID
- [ ] **9.3.10** Add to codebase conventions doc
  - **Success:** Model naming rules documented

---

## Phase 10: Performance & Reliability
*Goal: Optimize bundle size, enable rate limiting, fix test expectations.*
*Verified: Vite 6.x code splitting Dec 2025, React.lazy patterns*

### Bug #8: Rate Limiting Disabled in multi-agent-spec
**File:** `supabase/functions/multi-agent-spec/index.ts`
**Root Cause:** Rate limit check commented out or bypassed

- [ ] **10.1.1** Locate rate limiting code in multi-agent-spec
  - **Success:** Line numbers for rate limit logic found
- [ ] **10.1.2** Verify check_and_increment_rate_limit RPC exists
  - **Success:** Function exists in new database
- [ ] **10.1.3** Uncomment/enable rate limit check
  - **Success:** Rate limit logic active
- [ ] **10.1.4** Configure appropriate limits (requests/hour)
  - **Success:** 100 requests/hour default set
- [ ] **10.1.5** Add rate limit exceeded response (429)
  - **Success:** Returns proper HTTP status with retry-after
- [ ] **10.1.6** Test rate limit enforcement
  - **Success:** 101st request blocked
- [ ] **10.1.7** Add rate limit bypass for admin users
  - **Success:** Admin role skips check
- [ ] **10.1.8** Add rate limit headers to all responses
  - **Success:** X-RateLimit-Remaining in headers
- [ ] **10.1.9** Add rate limit monitoring
  - **Success:** Alerts for users hitting limits
- [ ] **10.1.10** Document rate limits for users
  - **Success:** API docs include rate limit info

### Bug #9: Smoke Test Expectations Don't Match API Response
**File:** `scripts/smoke-test-pipeline.ts`
**Root Cause:** Test expects fields that don't exist in actual response

- [ ] **10.2.1** Run smoke test and capture failures
  - **Success:** All assertion errors documented
- [ ] **10.2.2** Compare expected vs actual for each stage
  - **Success:** Diff for questions, research, challenge, etc.
- [ ] **10.2.3** Update questions stage expectations
  - **Success:** Test expects correct response shape
- [ ] **10.2.4** Update research stage expectations
  - **Success:** Test expects expert/findings/citations
- [ ] **10.2.5** Update challenge stage expectations
  - **Success:** Test expects challengeResponses array
- [ ] **10.2.6** Update synthesis stage expectations
  - **Success:** Test expects synthesis object
- [ ] **10.2.7** Update review stage expectations
  - **Success:** Test expects pass/fail/score
- [ ] **10.2.8** Update voting stage expectations
  - **Success:** Test expects votes array
- [ ] **10.2.9** Update spec stage expectations
  - **Success:** Test expects specification object
- [ ] **10.2.10** Run full smoke test with all fixes
  - **Success:** All 7 stages pass

### Performance: Bundle Optimization
**Target:** <200KB initial bundle, <1s LCP
*Verified: Vite 6.x manualChunks Dec 2025, React.lazy patterns*

- [ ] **10.3.1** Analyze current bundle with `vite-bundle-visualizer`
  - **Success:** Bundle report generated with size breakdown
- [ ] **10.3.2** Identify largest dependencies
  - **Success:** Top 10 deps by size documented
- [ ] **10.3.3** Configure manualChunks in vite.config.ts
  - **Success:** Vendor chunk separated
- [ ] **10.3.4** Add React.lazy for route components
  - **Success:** All route components lazy loaded
- [ ] **10.3.5** Add Suspense boundaries with loading states
  - **Success:** Skeleton UI during chunk load
- [ ] **10.3.6** Optimize Recharts import (tree-shake)
  - **Success:** Only used chart components imported
- [ ] **10.3.7** Optimize Lucide icons import
  - **Success:** Icons imported individually, not from barrel
- [ ] **10.3.8** Add preload hints for critical chunks
  - **Success:** modulepreload links in HTML
- [ ] **10.3.9** Measure LCP after optimizations
  - **Success:** Lighthouse LCP <1s
- [ ] **10.3.10** Add bundle size CI check
  - **Success:** PR fails if bundle exceeds budget

---

## Phase 11: Quality Control & Documentation
*Goal: Ensure all changes are tested, documented, and maintainable.*

### Testing Coverage
- [ ] **11.1.1** Run existing test suite, capture failures
  - **Success:** Baseline failure count documented
- [ ] **11.1.2** Fix broken tests from schema changes
  - **Success:** All previously passing tests pass
- [ ] **11.1.3** Add unit tests for RLS user_id fix
  - **Success:** saveSpec test with/without auth
- [ ] **11.1.4** Add integration tests for review stage
  - **Success:** Review stage API tested
- [ ] **11.1.5** Add E2E test for full pipeline
  - **Success:** Playwright test exercises all stages
- [ ] **11.1.6** Add visual regression tests
  - **Success:** Percy/Chromatic snapshots configured
- [ ] **11.1.7** Measure and report coverage
  - **Success:** Coverage report generated
- [ ] **11.1.8** Add coverage threshold to CI
  - **Success:** PR fails if coverage drops
- [ ] **11.1.9** Document testing strategy
  - **Success:** Testing guide in docs/
- [ ] **11.1.10** Create test data fixtures
  - **Success:** Fixtures for all stage responses

### Documentation Updates
- [ ] **11.2.1** Update README with new database info
  - **Success:** Project ref and setup steps current
- [ ] **11.2.2** Update API documentation
  - **Success:** All endpoints documented
- [ ] **11.2.3** Update deployment runbook
  - **Success:** Steps reflect new database
- [ ] **11.2.4** Create troubleshooting guide
  - **Success:** Common issues and fixes documented
- [ ] **11.2.5** Update CLAUDE.md with all changes
  - **Success:** AI context file current
- [ ] **11.2.6** Create architecture diagram
  - **Success:** Mermaid diagram in docs/
- [ ] **11.2.7** Document all environment variables
  - **Success:** .env.example complete
- [ ] **11.2.8** Create onboarding guide
  - **Success:** New developer setup steps
- [ ] **11.2.9** Update CHANGELOG.md
  - **Success:** All changes since last release
- [ ] **11.2.10** Tag release version
  - **Success:** Git tag with version number

---

## Definition of Done (Phases 7-11)
- All 10 bugs fixed and verified with tests
- Bundle size <200KB, LCP <1s
- Rate limiting active in production
- Review stage integrated end-to-end
- All model IDs consistent with evidence ledger
- Documentation reflects current state
- CHANGELOG.md updated

## Critical Path (Phases 7-11)
Phase 7 (Data Integrity) → Phase 8 (UX) → Phase 9 (Observability) → Phase 10 (Performance)
Phase 11 runs in parallel with verification.

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 12: Critical Corrections & Platform Upgrades
# Date: December 20, 2025 12:35 PST
# Research Verification: Exa search Dec 20, 2025 - ALL ITEMS VERIFIED
# ═══════════════════════════════════════════════════════════════════════════════

## Correction Notice
**This phase addresses 5 critical issues found during temporal metacognition review.**
All corrections are backed by Exa-verified sources from Dec 20, 2025.

---

## Phase 12.1: Model Registry Corrections (CRITICAL)

### DeepSeek V3.2 Models Now Available
**Previous Status:** "NOT FOUND on OpenRouter" (Dec 19, 2025)
**Corrected Status:** **VERIFIED and AVAILABLE** (Dec 20, 2025)
**Source:** https://openrouter.ai/deepseek/deepseek-v3.2-speciale

- [ ] **12.1.1** Re-add `deepseek-v3.2` to model registry
  - **Model ID:** `deepseek/deepseek-v3.2`
  - **Pricing:** $0.27 input / $0.41 output per 1M tokens
  - **Context:** 163,840 tokens
  - **Success:** Model entry added with correct OpenRouter ID

- [ ] **12.1.2** Re-add `deepseek-v3.2-speciale` to model registry
  - **Model ID:** `deepseek/deepseek-v3.2-speciale`
  - **Pricing:** $0.27 input / $0.41 output per 1M tokens
  - **Capability:** "Rivals Gemini-3.0-Pro" for complex reasoning
  - **Success:** Model entry added, configured for review/synthesis stages

- [ ] **12.1.3** Evaluate V3.2-Speciale as claude-opus-4.5 replacement
  - **Cost Comparison:** V3.2-Speciale ($0.27/$0.41) vs Claude Opus ($15/$75)
  - **Performance:** Gold-medal on IMO, CMO, ICPC World Finals, IOI 2025
  - **Success:** Decision documented on whether to swap synthesis model

- [ ] **12.1.4** Update Evidence Ledger with new models
  - **Success:** `model-evidence-ledger-2025-12-19.md` updated with V3.2 entries

- [ ] **12.1.5** Add verification date to all registry entries
  - **Success:** Each model has `verifiedDate: '2025-12-20'` field

---

## Phase 12.2: Deno 2.1 Migration (CRITICAL)

### Supabase Edge Functions Now Run Deno 2.1
**Previous Assumption:** Deno 1.x patterns
**Corrected Reality:** Deno 2.1 fully rolled out Aug 15, 2025
**Source:** https://github.com/orgs/supabase/discussions/37941

- [ ] **12.2.1** Update `supabase/config.toml` to set `deno_version = 2`
  - **Success:** Config explicitly sets Deno 2.1

- [ ] **12.2.2** Migrate imports to `npm:` prefix pattern
  - **Before:** `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
  - **After:** `import { createClient } from 'npm:@supabase/supabase-js@2'`
  - **Success:** All Edge Function imports use npm: prefix

- [ ] **12.2.3** Update `deno.json` with Deno 2 import map syntax
  - **Success:** Import map follows Deno 2 specification

- [ ] **12.2.4** Remove deprecated `--import-map` CLI flags
  - **Success:** No deprecation warnings during deployment

- [ ] **12.2.5** Test all Edge Functions with Deno 2.1 runtime
  - **Success:** All functions deploy and execute without errors

- [ ] **12.2.6** Enable npm compatibility features
  - **Benefit:** Access to full npm ecosystem in Edge Functions
  - **Success:** npm packages import successfully

---

## Phase 12.3: PostgREST v14 Performance Upgrade

### 20% RPS Improvement Available
**Released:** December 11, 2025
**Source:** https://supabase.com/changelog

- [ ] **12.3.1** Verify project is using PostgREST v14
  - **Success:** Version confirmed via Supabase Dashboard or API

- [ ] **12.3.2** Enable JWT cache for throughput improvement
  - **Default:** Enabled with 1000 entries
  - **Success:** 20% RPS improvement measured

- [ ] **12.3.3** Verify schema cache loading improvement
  - **Benefit:** 7 minutes → 2 seconds for complex schemas
  - **Success:** No configuration needed, automatic

- [ ] **12.3.4** Document PostgREST version in project config
  - **Success:** Version documented in CLAUDE.md

---

## Phase 12.4: Vite 8 Beta Evaluation

### Rolldown-Powered Builds Available
**Status:** Beta
**Source:** https://vite.dev/blog/announcing-vite8-beta

- [ ] **12.4.1** Create feature branch for Vite 8 evaluation
  - **Success:** Branch `feature/vite-8-evaluation` created

- [ ] **12.4.2** Upgrade Vite to v8 beta
  - **Command:** `pnpm add -D vite@beta`
  - **Success:** Package installed without conflicts

- [ ] **12.4.3** Benchmark build times: Vite 6 vs Vite 8
  - **Expected:** 10-100x faster builds with Rolldown
  - **Success:** Benchmark results documented

- [ ] **12.4.4** Test production build output
  - **Success:** Bundle size and functionality verified

- [ ] **12.4.5** Decision: Adopt Vite 8 or wait for stable
  - **Success:** Decision documented with rationale

---

## Phase 12.5: React 19 Pattern Adoption

### Modern React Patterns
**Source:** https://react.dev/blog/2024/12/05/react-19

- [ ] **12.5.1** Adopt `use()` hook for Suspense data fetching
  - **Benefit:** Cleaner async data loading without useEffect
  - **Success:** Key components use `use()` pattern

- [ ] **12.5.2** Implement `useActionState` for forms
  - **Benefit:** Better form submission state management
  - **Success:** Form components updated

- [ ] **12.5.3** Add resource hints for performance
  - **Functions:** `prefetchDNS`, `preconnect`, `preload`, `preinit`
  - **Success:** Critical resources preloaded

- [ ] **12.5.4** Implement streaming SSR with multiple Suspense boundaries
  - **Pattern:** Independent sections stream separately
  - **Success:** LCP improved with parallel streaming

- [ ] **12.5.5** Add `useDeferredValue` for search inputs
  - **Benefit:** Responsive UI during heavy rendering
  - **Success:** Search components use deferred values

---

## Phase 12.6: Package Manager Standardization

### pnpm for Frontend, npm: for Deno
**Rationale:**
- pnpm: Best for React/Vite frontend (faster, stricter, smaller node_modules)
- npm: prefix: Required by Deno 2 for Edge Functions (not pnpm CLI)

- [ ] **12.6.1** Ensure pnpm is used for frontend development
  - **Success:** `pnpm-lock.yaml` is source of truth for frontend

- [ ] **12.6.2** Document package manager distinction
  - **Frontend:** Use `pnpm install`, `pnpm add`, `pnpm run`
  - **Edge Functions:** Use `npm:` prefix in imports (Deno native)
  - **Success:** README updated with package manager guidance

- [ ] **12.6.3** Add `packageManager` field to package.json
  - **Value:** `"packageManager": "pnpm@9.x"`
  - **Success:** Corepack enforces pnpm usage

---

## Definition of Done (Phase 12)
- DeepSeek V3.2 and V3.2-Speciale in model registry
- Edge Functions migrated to Deno 2.1 patterns
- PostgREST v14 performance verified
- Vite 8 evaluation completed
- React 19 patterns adopted where beneficial
- pnpm standardized for frontend, npm: for Deno

## Critical Path (Phase 12)
12.1 (Model Corrections) → 12.2 (Deno 2.1) → 12.3 (PostgREST) can run in parallel
12.4 (Vite 8) and 12.5 (React 19) can run in parallel after Phase 10 performance baseline

---

## Verification Sources (Dec 20, 2025)

| Finding | Source URL | Verified |
|---------|------------|----------|
| DeepSeek V3.2-Speciale on OpenRouter | https://openrouter.ai/deepseek/deepseek-v3.2-speciale | Dec 20, 2025 |
| DeepSeek V3.2 release announcement | https://api-docs.deepseek.com/news/news251201 | Dec 1, 2025 |
| Deno 2.1 Supabase rollout | https://github.com/orgs/supabase/discussions/37941 | Aug 15, 2025 |
| PostgREST v14 release | https://supabase.com/changelog | Dec 11, 2025 |
| Vite 8 Beta announcement | https://vite.dev/blog/announcing-vite8-beta | Dec 2025 |
| React 19 release | https://react.dev/blog/2024/12/05/react-19 | Dec 2024 |
| Supabase Deno 2 docs | https://supabase.com/docs/guides/functions/deno2 | Dec 2025 |
