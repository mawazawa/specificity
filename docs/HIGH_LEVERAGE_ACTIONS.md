# 10 Highest Leverage Actions - Specificity AI

> Generated: December 26, 2025
> Based on comprehensive audit of performance, security, error handling, testing, and accessibility

---

## Executive Summary

| Rank | Action | Confidence | Impact | Effort |
|------|--------|------------|--------|--------|
| 1 | Security: Session Persistence Validation | 98% | CRITICAL | Medium |
| 2 | Observability: Sentry Error Boundary Integration | 95% | HIGH | Low |
| 3 | Accessibility: Keyboard Navigation for Cards | 92% | HIGH | Medium |
| 4 | Performance: Memoization & Memory Leak Fixes | 90% | HIGH | Medium |
| 5 | Testing: Unit Tests for Core Hooks | 88% | HIGH | High |
| 6 | Security: Input Validation with Zod Schemas | 94% | HIGH | Medium |
| 7 | Resilience: Error Handling Improvements | 87% | MEDIUM | Medium |
| 8 | Testing: Edge Function Integration Tests | 85% | HIGH | High |
| 9 | Accessibility: Reduced Motion Support | 90% | MEDIUM | Low |
| 10 | Resilience: API Timeout & Retry Logic | 82% | MEDIUM | Medium |

---

## Action 1: Security - Session Persistence Validation

**Confidence: 98%**

**Problem:** `JSON.parse(savedSession)` parses untrusted localStorage data without schema validation. Malicious session data could corrupt application state or enable XSS attacks.

**User Perspective:** Users expect their session data to be secure and not exploitable by malicious scripts or browser extensions.

**Files Affected:** 3 files

### Atomic Subtasks (10 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 1.1 | Create Zod schema for session data structure | `src/types/schemas.ts` | Add sessionDataSchema |
| 1.2 | Create safe JSON parse utility with schema validation | `src/lib/utils.ts` | Add safeJsonParse<T> |
| 1.3 | Update useSessionPersistence to use safe parse | `src/hooks/useSessionPersistence.ts` | Replace JSON.parse |
| 1.4 | Add error recovery when parse fails | `src/hooks/useSessionPersistence.ts` | Graceful degradation |
| 1.5 | Add toast notification on corrupted session | `src/hooks/useSessionPersistence.ts` | User feedback |
| 1.6 | Create unit tests for safe parse utility | `src/lib/__tests__/utils.test.ts` | Edge cases |
| 1.7 | Add session data migration for schema changes | `src/hooks/useSessionPersistence.ts` | Version migration |
| 1.8 | Implement localStorage encryption option | `src/lib/crypto.ts` | Optional encryption |
| 1.9 | Add session integrity hash verification | `src/hooks/useSessionPersistence.ts` | Tamper detection |
| 1.10 | Update CLAUDE.md with session security docs | `CLAUDE.md` | Documentation |

---

## Action 2: Observability - Sentry Error Boundary Integration

**Confidence: 95%**

**Problem:** `ErrorBoundary.componentDidCatch()` only logs to console. Production errors go completely untracked, preventing incident diagnosis and user impact assessment.

**User Perspective:** When something breaks, users expect the team to know about it and fix it quickly.

**Files Affected:** 2 files

### Atomic Subtasks (10 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 2.1 | Import Sentry in error boundary | `src/components/ui/error-boundary.tsx` | Add import |
| 2.2 | Add Sentry.captureException in componentDidCatch | `src/components/ui/error-boundary.tsx` | Error reporting |
| 2.3 | Add React error info context to Sentry | `src/components/ui/error-boundary.tsx` | Component stack |
| 2.4 | Add user context (userId, plan) to Sentry scope | `src/components/ui/error-boundary.tsx` | User identification |
| 2.5 | Create error fingerprinting for deduplication | `src/components/ui/error-boundary.tsx` | Group similar errors |
| 2.6 | Add breadcrumbs for last user actions | `src/components/ui/error-boundary.tsx` | Debug context |
| 2.7 | Create custom Sentry tags for spec stage | `src/components/ui/error-boundary.tsx` | Stage tracking |
| 2.8 | Add Sentry feedback widget on error | `src/components/ui/error-boundary.tsx` | User feedback |
| 2.9 | Create unit tests for error boundary | `src/components/ui/__tests__/error-boundary.test.tsx` | Test coverage |
| 2.10 | Document error tracking in CLAUDE.md | `CLAUDE.md` | Documentation |

---

## Action 3: Accessibility - Keyboard Navigation for Cards

**Confidence: 92%**

**Problem:** 8 interactive card components use `onClick` on non-button elements without keyboard support. Screen reader users and keyboard-only users cannot access core functionality.

**User Perspective:** Users with motor disabilities, vision impairments, or those who prefer keyboard navigation are completely locked out of key features.

**Files Affected:** 8 files

### Atomic Subtasks (12 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 3.1 | Create reusable InteractiveCard wrapper | `src/components/ui/interactive-card.tsx` | Shared component |
| 3.2 | Add keyboard handler utility (Enter/Space) | `src/lib/a11y.ts` | Utility function |
| 3.3 | Fix SampleSpecGallery card accessibility | `src/components/SampleSpecGallery.tsx` | Add role, tabIndex, onKeyDown |
| 3.4 | Fix ExpertCard expand/collapse accessibility | `src/components/ExpertCard.tsx` | Add keyboard support |
| 3.5 | Fix TechStackCard selection accessibility | `src/components/TechStackCard.tsx` | Add keyboard support |
| 3.6 | Fix ExpandableAgentCard accessibility | `src/components/ExpandableAgentCard.tsx` | Add keyboard support |
| 3.7 | Fix MobileHeader agent selection | `src/components/mobile/MobileHeader.tsx` | Add keyboard support |
| 3.8 | Fix ChatMessage avatar click | `src/components/chat/ChatMessage.tsx` | Add keyboard support |
| 3.9 | Add visible focus indicators (focus-visible) | `src/index.css` | Focus ring styles |
| 3.10 | Add aria-pressed for toggle states | Multiple files | State communication |
| 3.11 | Create a11y Playwright tests | `tests/accessibility-keyboard.spec.ts` | E2E verification |
| 3.12 | Document a11y patterns in CLAUDE.md | `CLAUDE.md` | Documentation |

---

## Action 4: Performance - Memoization & Memory Leak Fixes

**Confidence: 90%**

**Problem:** AgentCard event listener leak (2-5MB over time), unmemoized text parsing in LiveAgentCard, ChatMessage re-renders, and large useState objects cause performance degradation.

**User Perspective:** Long sessions become sluggish, mobile users experience jank, and battery drain increases.

**Files Affected:** 6 files

### Atomic Subtasks (15 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 4.1 | Fix AgentCard event listener leak | `src/components/AgentCard.tsx` | Remove x,y from deps |
| 4.2 | Memoize LiveAgentCard text parsing | `src/components/LiveAgentCard.tsx` | Add useMemo |
| 4.3 | Optimize getTagsFromText toLowerCase | `src/components/LiveAgentCard.tsx` | Single toLowerCase |
| 4.4 | Add React.memo to ChatMessage | `src/components/chat/ChatMessage.tsx` | Prevent re-renders |
| 4.5 | Memoize ChatMessage callbacks | `src/components/chat/ChatMessage.tsx` | useCallback |
| 4.6 | Extract default tech stack to constant | `src/components/SpecOutput.tsx` | Module-level constant |
| 4.7 | Add lazy initialization for techStack | `src/components/SpecOutput.tsx` | useState callback |
| 4.8 | Create memoized DialogueEntryItem | `src/components/DialoguePanel.tsx` | Separate component |
| 4.9 | Cache scroll viewport with useRef | `src/components/chat/ChatView.tsx` | Remove querySelector |
| 4.10 | Add loading="lazy" to avatar images | `src/components/AgentCard.tsx` | Lazy loading |
| 4.11 | Create shared avatar imports module | `src/lib/avatars.ts` | Deduplicate imports |
| 4.12 | Update AgentCard to use shared avatars | `src/components/AgentCard.tsx` | Use shared module |
| 4.13 | Update ChatMessage to use shared avatars | `src/components/chat/ChatMessage.tsx` | Use shared module |
| 4.14 | Update LiveAgentCard to use shared avatars | `src/components/LiveAgentCard.tsx` | Use shared module |
| 4.15 | Update DialoguePanel to use shared avatars | `src/components/DialoguePanel.tsx` | Use shared module |

---

## Action 5: Testing - Unit Tests for Core Hooks

**Confidence: 88%**

**Problem:** Zero unit tests exist for 9 critical hooks including useSpecFlow (1400+ LOC state machine), useSessionPersistence, and useAuth. Any refactoring risks breaking core functionality.

**User Perspective:** Users expect the app to work reliably after updates. Untested code leads to regressions that break their workflow.

**Files Affected:** 9+ new test files

### Atomic Subtasks (18 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 5.1 | Set up Vitest testing utilities | `src/test/setup.ts` | Test configuration |
| 5.2 | Create Supabase mock utilities | `src/test/mocks/supabase.ts` | Mock client |
| 5.3 | Create localStorage mock utilities | `src/test/mocks/storage.ts` | Mock storage |
| 5.4 | Test useSession reducer actions | `src/hooks/spec-generation/__tests__/use-session.test.ts` | State transitions |
| 5.5 | Test useDialogue reducer actions | `src/hooks/spec-generation/__tests__/use-dialogue.test.ts` | Entry management |
| 5.6 | Test useTasks reducer actions | `src/hooks/spec-generation/__tests__/use-tasks.test.ts` | Task tracking |
| 5.7 | Test useSpecFlow stage transitions | `src/hooks/spec-generation/__tests__/use-spec-flow.test.ts` | Stage machine |
| 5.8 | Test useSpecFlow error handling | `src/hooks/spec-generation/__tests__/use-spec-flow.test.ts` | Fallback logic |
| 5.9 | Test useSpecFlow pause/resume | `src/hooks/spec-generation/__tests__/use-spec-flow.test.ts` | Control flow |
| 5.10 | Test useSessionPersistence debounce | `src/hooks/__tests__/useSessionPersistence.test.ts` | Timing logic |
| 5.11 | Test useSessionPersistence quota | `src/hooks/__tests__/useSessionPersistence.test.ts` | Error recovery |
| 5.12 | Test useSessionPersistence expiry | `src/hooks/__tests__/useSessionPersistence.test.ts` | 24h validation |
| 5.13 | Test useAuth state management | `src/hooks/__tests__/useAuth.test.ts` | Auth flow |
| 5.14 | Test useAuth session refresh | `src/hooks/__tests__/useAuth.test.ts` | Polling logic |
| 5.15 | Test useProfile fetching | `src/hooks/__tests__/use-profile.test.ts` | Data loading |
| 5.16 | Test useProfile upgrade flow | `src/hooks/__tests__/use-profile.test.ts` | Plan changes |
| 5.17 | Test use-toast memory management | `src/hooks/__tests__/use-toast.test.ts` | Timeout cleanup |
| 5.18 | Add CI workflow for unit tests | `.github/workflows/test.yml` | CI integration |

---

## Action 6: Security - Input Validation with Zod Schemas

**Confidence: 94%**

**Problem:** User inputs passed directly to Edge Functions without client-side Zod validation. XSS risks in TechStackCard URL construction. Chat messages have no length limits.

**User Perspective:** Users trust the app to handle their input safely without security vulnerabilities being exploited.

**Files Affected:** 5 files

### Atomic Subtasks (12 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 6.1 | Create comprehensive input schemas | `src/types/schemas.ts` | Zod definitions |
| 6.2 | Add userInput schema (25-5000 chars) | `src/types/schemas.ts` | Spec input validation |
| 6.3 | Add chatMessage schema (1-2000 chars) | `src/types/schemas.ts` | Chat validation |
| 6.4 | Add URL validation schema | `src/types/schemas.ts` | URL safety |
| 6.5 | Validate input in api.ts before invoke | `src/lib/api.ts` | Client-side gate |
| 6.6 | Add URL validation to TechStackCard | `src/components/TechStackCard.tsx` | Prevent XSS |
| 6.7 | Add domain whitelist for tech logos | `src/components/TechStackCard.tsx` | Allowed domains |
| 6.8 | Add chat input validation in ChatInput | `src/components/chat/ChatInput.tsx` | Length check |
| 6.9 | Add validation error UI feedback | `src/components/SimpleSpecInput.tsx` | User messages |
| 6.10 | Create validation error toast utility | `src/lib/validation.ts` | Consistent errors |
| 6.11 | Test schema edge cases | `src/types/__tests__/schemas.test.ts` | Unit tests |
| 6.12 | Document validation in CLAUDE.md | `CLAUDE.md` | Documentation |

---

## Action 7: Resilience - Error Handling Improvements

**Confidence: 87%**

**Problem:** FileReader errors not handled, canvas.toBlob silent failures, empty catch blocks in session persistence, missing partial failure notifications in parallel execution.

**User Perspective:** When things fail, users get no feedback or actionable information. They're left wondering if the app is broken.

**Files Affected:** 7 files

### Atomic Subtasks (14 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 7.1 | Add FileReader error handling in SpecInput | `src/components/SpecInput.tsx` | Null check + toast |
| 7.2 | Add FileReader error handling in SimpleSpecInput | `src/components/SimpleSpecInput.tsx` | Null check + toast |
| 7.3 | Add canvas render error handling | `src/components/SpecOutput.tsx` | Try-catch + toast |
| 7.4 | Add blob validation before download | `src/components/SpecOutput.tsx` | Null check |
| 7.5 | Replace empty catch with error logging | `src/hooks/useSessionPersistence.ts` | Console + Sentry |
| 7.6 | Add partial failure notification | `src/hooks/spec-generation/use-spec-flow.ts` | Warning toast |
| 7.7 | Track failure rate in parallel executor | `supabase/functions/lib/parallel-executor.ts` | Metadata |
| 7.8 | Add getSession error handling | `src/hooks/useAuth.ts` | Catch block |
| 7.9 | Add await to fetchProfile after upgrade | `src/hooks/use-profile.ts` | Sync state |
| 7.10 | Improve SpecView error messages | `src/pages/SpecView.tsx` | Actionable feedback |
| 7.11 | Add response.json() error handling | `supabase/functions/voice-to-text/index.ts` | Try-catch |
| 7.12 | Add req.json() error handling | `supabase/functions/multi-agent-spec/index.ts` | 400 vs 500 |
| 7.13 | Create error categorization utility | `src/lib/errors.ts` | Classify errors |
| 7.14 | Test error scenarios | `tests/error-handling.spec.ts` | E2E coverage |

---

## Action 8: Testing - Edge Function Integration Tests

**Confidence: 85%**

**Problem:** No tests for 8-stage multi-agent-spec pipeline, voice-to-text validation, or upgrade-to-pro payment flow. Bugs in these functions cause revenue loss and data corruption.

**User Perspective:** Users expect the core spec generation feature to work reliably. Payment issues cause trust damage.

**Files Affected:** 4 new test files

### Atomic Subtasks (16 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 8.1 | Create Deno test configuration | `supabase/functions/deno.json` | Test setup |
| 8.2 | Create mock LLM responses | `supabase/functions/tests/mocks/llm.ts` | API mocks |
| 8.3 | Create mock Supabase client | `supabase/functions/tests/mocks/supabase.ts` | DB mocks |
| 8.4 | Test questions stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 1 |
| 8.5 | Test research stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 2 |
| 8.6 | Test challenge stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 3 |
| 8.7 | Test synthesis stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 4 |
| 8.8 | Test review stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 5 |
| 8.9 | Test voting stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 6 |
| 8.10 | Test spec stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 7 |
| 8.11 | Test chat stage | `supabase/functions/tests/multi-agent-spec.test.ts` | Stage 8 |
| 8.12 | Test rate limiting | `supabase/functions/tests/multi-agent-spec.test.ts` | 5 req/hour |
| 8.13 | Test voice-to-text validation | `supabase/functions/tests/voice-to-text.test.ts` | Audio formats |
| 8.14 | Test voice-to-text errors | `supabase/functions/tests/voice-to-text.test.ts` | Edge cases |
| 8.15 | Test upgrade-to-pro flow | `supabase/functions/tests/upgrade-to-pro.test.ts` | Payment |
| 8.16 | Add edge function tests to CI | `.github/workflows/test.yml` | CI integration |

---

## Action 9: Accessibility - Reduced Motion Support

**Confidence: 90%**

**Problem:** AgentCard 3D tilt effect and Framer Motion animations don't respect `prefers-reduced-motion`. Users with vestibular disorders experience dizziness.

**User Perspective:** Users with motion sensitivity need the app to respect their system preferences.

**Files Affected:** 4 files

### Atomic Subtasks (10 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 9.1 | Create useReducedMotion hook | `src/hooks/use-reduced-motion.ts` | Media query hook |
| 9.2 | Disable AgentCard tilt on reduced motion | `src/components/AgentCard.tsx` | Conditional effect |
| 9.3 | Create motion-safe variants for Framer | `src/lib/motion.ts` | Shared presets |
| 9.4 | Update DialoguePanel animations | `src/components/DialoguePanel.tsx` | Use motion presets |
| 9.5 | Update ChatView animations | `src/components/chat/ChatView.tsx` | Use motion presets |
| 9.6 | Update LiveAgentCard animations | `src/components/LiveAgentCard.tsx` | Use motion presets |
| 9.7 | Add CSS reduced motion fallbacks | `src/index.css` | @media query |
| 9.8 | Test with reduced motion enabled | `tests/accessibility-motion.spec.ts` | E2E verification |
| 9.9 | Document motion preferences | `CLAUDE.md` | Documentation |
| 9.10 | Add toggle in settings (future) | - | Future enhancement |

---

## Action 10: Resilience - API Timeout & Retry Logic

**Confidence: 82%**

**Problem:** AbortController timeout doesn't work with Supabase client. 35-minute spec generation can hang indefinitely. No retry logic for transient network failures.

**User Perspective:** Users stuck in "processing" state forever with no feedback or recovery option.

**Files Affected:** 3 files

### Atomic Subtasks (12 tasks)

| # | Task | Files | Scope |
|---|------|-------|-------|
| 10.1 | Verify Supabase signal support | `src/lib/api.ts` | Check compatibility |
| 10.2 | Implement manual timeout wrapper | `src/lib/api.ts` | Promise.race pattern |
| 10.3 | Add timeout error differentiation | `src/lib/api.ts` | Error types |
| 10.4 | Create retry utility with backoff | `src/lib/retry.ts` | Exponential backoff |
| 10.5 | Add retry for transient failures | `src/lib/api.ts` | Network errors only |
| 10.6 | Add timeout progress indicator | `src/components/ProcessViewer.tsx` | Visual feedback |
| 10.7 | Add cancel button for long operations | `src/components/ProcessViewer.tsx` | User control |
| 10.8 | Implement request cancellation | `src/hooks/spec-generation/use-spec-flow.ts` | AbortController |
| 10.9 | Add offline detection | `src/lib/network.ts` | Navigator.onLine |
| 10.10 | Show offline banner | `src/App.tsx` | User feedback |
| 10.11 | Test timeout scenarios | `tests/api-timeout.spec.ts` | E2E coverage |
| 10.12 | Document timeout behavior | `CLAUDE.md` | Documentation |

---

## Implementation Priority Matrix

### Week 1: Critical Security & Observability
- Action 1: Session Persistence Validation (98% confidence)
- Action 2: Sentry Error Boundary (95% confidence)

### Week 2: Accessibility & Performance
- Action 3: Keyboard Navigation (92% confidence)
- Action 4: Memoization Fixes (90% confidence)

### Week 3: Security & Resilience
- Action 6: Input Validation (94% confidence)
- Action 7: Error Handling (87% confidence)

### Week 4: Testing Foundation
- Action 5: Unit Tests for Hooks (88% confidence)
- Action 8: Edge Function Tests (85% confidence)

### Week 5: Polish
- Action 9: Reduced Motion (90% confidence)
- Action 10: API Timeout (82% confidence)

---

## Confidence Score Methodology

| Score | Meaning |
|-------|---------|
| 95-100% | Clear problem, proven solution, low risk |
| 85-94% | Well-understood problem, some implementation choices |
| 75-84% | Known issue, multiple valid approaches |
| <75% | Exploratory, needs more research |

**Alternative Considerations (for scores <85%):**

- **Action 8 (85%)**: Could use mock-service-worker instead of custom mocks
- **Action 10 (82%)**: Could use react-query's built-in retry instead of custom

---

*Document generated from parallel audit of 5 domains: Performance, Security, Error Handling, Testing, Accessibility*
