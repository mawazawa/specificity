# Specificity AI - Atomic Task Plan (World-Class Readiness)

## Timestamp
2025-12-19 11:50:24 PST

## Scope
This plan focuses on removing runtime blockers, stabilizing the multi-agent pipeline, tightening UX flows, and setting a foundation for scalable, world-class delivery.

## Temporal Metacognition Notes
- Critical path: fix edge-function blockers first (prompts, imports, rate-limit signature, spec stage).
- Fast feedback loop: add smoke tests right after blockers to verify runtime quickly.
- Risk buffers: 20-30 percent buffer on edge function changes due to deployment/test latency.
- Parallelization: frontend wiring fixes can run in parallel with backend fixes, but should not block prompt seeding and spec stage correctness.

---

## Phase 0 - Runtime Blockers (Critical Path)
- [ ] P0-1 Add prompt seed: research_stage
  - Success: `prompts` table contains `research_stage` and `renderPrompt('research_stage')` returns non-empty content.
- [ ] P0-2 Add prompt seed: synthesis_stage
  - Success: `prompts` table contains `synthesis_stage` and `renderPrompt('synthesis_stage')` returns non-empty content.
- [ ] P0-3 Add prompt seed: voting_stage
  - Success: `prompts` table contains `voting_stage` and `renderPrompt('voting_stage')` returns non-empty content.
- [ ] P0-4 Fix spec stage import or prompt source
  - Success: `supabase/functions/multi-agent-spec/lib/stages/spec.ts` references a defined `Prompts` or uses `renderPrompt`, and builds without runtime errors.
- [ ] P0-5 Remove invalid duplicate import in research stage
  - Success: `supabase/functions/multi-agent-spec/lib/stages/research.ts` has a single valid `AgentConfig` import and typecheck passes.
- [ ] P0-6 Fix rate-limit RPC signature in voice-to-text
  - Success: `supabase/functions/voice-to-text/index.ts` calls `check_and_increment_rate_limit` with `p_window_hours`, returning `allowed` without errors.
- [ ] P0-7 Wire refinement continuation in chat view
  - Success: `ChatView` receives `currentStage` and `onProceedToGeneration` and displays the "Start Expert Panel Analysis" button when appropriate.

---

## Phase 1 - Pause/Resume Correctness
- [ ] P1-1 Track last input and next round in spec flow
  - Success: `useSpecFlow` stores `lastInput` and `nextRoundNumber` across pause/resume.
- [ ] P1-2 Resume re-enters the pipeline
  - Success: calling `resume()` triggers `runRound(lastInput, nextRoundNumber)` when paused and not processing.
- [ ] P1-3 Persist pause context to session state
  - Success: session state includes pause context (input + round) and survives reload via `useSessionPersistence`.

---

## Phase 2 - Prompt Ops and Analytics
- [ ] P2-1 Track prompt usage for question generation
  - Success: a question generation call inserts a row in `prompt_usage` with model, tokens, and latency.
- [ ] P2-2 Track prompt usage for research stage
  - Success: each research agent inserts a row in `prompt_usage` for `research_stage`.
- [ ] P2-3 Track prompt usage for challenge generation/execution
  - Success: `challenge_generation` and `challenge_execution` are recorded in `prompt_usage`.
- [ ] P2-4 Track prompt usage for synthesis, voting, and spec
  - Success: rows are inserted for `synthesis_stage`, `voting_stage`, and `specification_generation`.

---

## Phase 3 - UX Completion and Consistency
- [ ] P3-1 Consolidate voice input into the active spec entry component
  - Success: voice input button appears in `SimpleSpecInput` and successful transcription appends text.
- [ ] P3-2 Handle voice input errors in the UI
  - Success: user sees a descriptive toast on transcription errors and can retry without reload.
- [ ] P3-3 Add "My Specs" entry point
  - Success: a new route lists user specs from `specifications` with open + delete actions.

---

## Phase 4 - Asset and Production Hardening
- [ ] P4-1 Replace `/src/assets/...` paths with imported assets in chat
  - Success: `ChatMessage` and `mentorProfiles` use imported image modules and render in production builds.
- [ ] P4-2 Use optimized WebP assets in chat
  - Success: chat avatars use `/src/assets/optimized/*.webp` where available.

---

## Phase 5 - Scalability Foundation
- [ ] P5-1 Add `spec_jobs` table (queued spec generation)
  - Success: migration creates `spec_jobs` with status, payload, result, and timestamps.
- [ ] P5-2 Add enqueue endpoint
  - Success: edge function can create a job and return `job_id` without blocking.
- [ ] P5-3 Add worker execution path
  - Success: a worker processes `spec_jobs` to completion and updates status.
- [ ] P5-4 Add UI job status polling
  - Success: UI shows live progress and transitions to spec view on completion.

---

## Phase 6 - QA and Regression Safety
- [ ] P6-1 Add edge-function smoke test script for all stages
  - Success: script exercises `questions`, `research`, `challenge`, `synthesis`, `voting`, and `spec` with 200 responses.
- [ ] P6-2 Add Playwright test for refinement -> proceed flow
  - Success: test reaches refinement, clicks proceed, and sees stage transition.
- [ ] P6-3 Add Playwright test for share link
  - Success: test creates a spec, clicks share, and loads `/spec/:id` successfully.

---

## Definition of Done (Global)
- No runtime exceptions in edge functions for the full pipeline.
- All prompt stages resolve via database-backed prompts.
- Chat refinement flow fully reaches spec generation.
- Voice input works in the primary entry path.
- New tests pass in CI and locally.
