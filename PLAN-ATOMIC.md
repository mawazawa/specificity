# ═══════════════════════════════════════════════════════════════════════════════
# SPECIFICITY AI - ATOMIC IMPLEMENTATION PLAN
# ═══════════════════════════════════════════════════════════════════════════════
# Generated: December 23, 2025 14:12 PST
# Source Analysis: 2025-12-23-specificity-ai-comprehensive-codebase-analysis-and-world-class-roadmap.md
# Research Verification: Exa queries Dec 23, 2025
# Methodology: CTO Advisor Framework + Temporal Metacognition Protocol
# ═══════════════════════════════════════════════════════════════════════════════

## Executive Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Overall Completion | 65% | 100% | 35% |
| TypeScript Errors | 0 | 0 | ✅ |
| ESLint `any` Types | 42 | 0 | 42 errors |
| Bundle Size (gzip) | 430KB | <200KB | 230KB reduction |
| LCP | ~2s | <1s | 1s improvement |
| Test Coverage | Unknown | >70% | Measurement needed |
| E2E Tests | 19 files | 30+ files | 11+ files |

**Critical Blockers (Must Fix First):**
1. Rate limiting disabled (security/cost risk)
2. Review stage not called from frontend (quality gate bypassed)
3. ResearchPanel schema mismatch (UI broken)
4. vitest not installed (tests broken)
5. 42 ESLint `any` type errors (type safety regression)

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE A: CRITICAL BLOCKERS (Priority 0 - Do First)
# Timeline: 2-3 days
# Risk Level: HIGH - Production blocking
# ═══════════════════════════════════════════════════════════════════════════════

## A.1 Enable Rate Limiting (Security Critical)

**File:** `supabase/functions/multi-agent-spec/index.ts:132`
**Root Cause:** Rate limit check commented out
**Risk:** Unbounded API costs, DoS vulnerability
**Research:** Exa-verified Supabase Edge Functions rate limiting patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| A.1.1 | Locate rate limit code in multi-agent-spec/index.ts | Line numbers documented | `grep -n "rate" index.ts` |
| A.1.2 | Verify `check_and_increment_rate_limit` RPC exists in DB | Function signature confirmed | `supabase db list --functions` |
| A.1.3 | Uncomment rate limit check | Code path active | Read file, verify no comment markers |
| A.1.4 | Set rate limit: 100 requests/hour/user | Constant defined | `MAX_REQUESTS = 100` in code |
| A.1.5 | Add 429 response with Retry-After header | HTTP 429 returned when exceeded | `curl` test returns 429 |
| A.1.6 | Add X-RateLimit-Remaining header to all responses | Header present | Response headers inspection |
| A.1.7 | Test: 100 requests succeed, 101st returns 429 | Boundary condition works | Integration test |
| A.1.8 | Add admin bypass for rate limit | Admin users not limited | Test with admin JWT |
| A.1.9 | Add rate limit exceeded logging | Logs show user ID + endpoint | Structured log output |
| A.1.10 | Deploy to production | Function live | `supabase functions deploy` succeeds |

**Rollback Plan:** Re-comment rate limit code if causing issues

---

## A.2 Install vitest and Fix Test Infrastructure

**File:** `package.json`, `tests/model-routing.spec.ts`
**Root Cause:** Tests import vitest but only Playwright installed
**Risk:** No unit test coverage, CI failures
**Research:** Exa-verified vitest + TypeScript + ESLint configuration (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| A.2.1 | Install vitest and dependencies | Package in devDependencies | `pnpm add -D vitest @vitest/coverage-v8` |
| A.2.2 | Create `vitest.config.ts` | Config file exists | File presence check |
| A.2.3 | Configure test environment: node | `environment: 'node'` set | Read config |
| A.2.4 | Configure globals: true | No explicit imports needed | Config verification |
| A.2.5 | Add vitest to package.json scripts | `"test:unit": "vitest"` | Script exists |
| A.2.6 | Run model-routing.spec.ts | All 17 tests pass | `pnpm test:unit` |
| A.2.7 | Configure coverage thresholds (70%) | Threshold in config | `coverage.thresholds` set |
| A.2.8 | Add ESLint plugin for vitest | `@vitest/eslint-plugin` installed | Package check |
| A.2.9 | Update ESLint config for test files | Test files use vitest globals | ESLint config review |
| A.2.10 | Add to CI pipeline | Tests run on PR | GitHub Actions workflow |

**vitest.config.ts Template (Exa-verified Dec 23, 2025):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 70, branches: 70, functions: 70 }
    }
  }
});
```

---

## A.3 Fix ESLint `any` Type Errors (42 errors)

**Files:** Multiple files in `/supabase/functions/lib/`
**Root Cause:** Type safety regression during rapid development
**Risk:** Runtime errors, maintainability issues
**Research:** Exa-verified ESLint strict TypeScript configuration (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| A.3.1 | Run ESLint to get full error list | 42 errors documented with file:line | `pnpm lint 2>&1 \| grep any` |
| A.3.2 | Categorize errors by file | Error count per file | Tabulated list |
| A.3.3 | Fix `openrouter-client.ts` any types | 0 errors in file | File-specific lint |
| A.3.4 | Fix `parallel-executor.ts` any types | 0 errors in file | File-specific lint |
| A.3.5 | Fix `question-generator.ts` any types | 0 errors in file | File-specific lint |
| A.3.6 | Fix `challenge-generator.ts` any types | 0 errors in file | File-specific lint |
| A.3.7 | Fix `expert-matcher.ts` any types | 0 errors in file | File-specific lint |
| A.3.8 | Fix `prompt-service.ts` any types | 0 errors in file | File-specific lint |
| A.3.9 | Fix remaining files | 0 total any errors | Full lint run |
| A.3.10 | Add strict ESLint rule to prevent regression | `@typescript-eslint/no-explicit-any: error` | ESLint config |

**Type Replacement Patterns:**
```typescript
// BAD: any
const response: any = await fetch(...);

// GOOD: Specific type
interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}
const response: OpenRouterResponse = await fetch(...).then(r => r.json());
```

---

## A.4 Integrate Review Stage in Frontend

**File:** `src/hooks/spec-generation/use-spec-flow.ts`
**Root Cause:** Backend review stage exists but frontend skips it
**Risk:** Quality gate bypassed, specifications not verified
**Research:** Exa-verified React 19 patterns for async state (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| A.4.1 | Map current stage order in use-spec-flow.ts | Stages documented with line numbers | Code review |
| A.4.2 | Identify insertion point (after synthesis, before voting) | Line number for insertion | Code analysis |
| A.4.3 | Create ReviewResult TypeScript interface | Interface matches API response | Type checking |
| A.4.4 | Add `runReviewStage()` function | Function compiles | TypeScript check |
| A.4.5 | Insert review stage call in pipeline | Call executes in sequence | Console logging |
| A.4.6 | Handle review pass scenario | Pipeline continues to voting | E2E test |
| A.4.7 | Handle review fail scenario | User sees retry option | Manual test |
| A.4.8 | Add "Quality Review" UI feedback | Progress indicator shows review | Visual check |
| A.4.9 | Display review results (score, issues) | Results visible in UI | Screenshot |
| A.4.10 | Add review stage to pipeline visualization | AgentCard shows review | Visual check |

**ReviewResult Interface:**
```typescript
interface ReviewResult {
  pass: boolean;
  score: number;
  issues: Array<{
    severity: 'critical' | 'major' | 'minor';
    description: string;
    affectedSection: string;
  }>;
  citationAnalysis: {
    totalCitations: number;
    verifiedCitations: number;
    missingCitations: string[];
  };
  remediationNotes?: string;
}
```

---

## A.5 Fix ResearchPanel Schema Mismatch

**File:** `src/components/ResearchPanel.tsx`
**Root Cause:** UI expects `{title, url, snippet}` but API returns `{expert, findings, citations}`
**Risk:** Research results not displayed, broken UX
**Research:** Exa-verified component patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| A.5.1 | Document current ResearchPanel props interface | Interface captured | Read component |
| A.5.2 | Capture actual API response from research stage | JSON structure documented | Network tab / logs |
| A.5.3 | Create new ResearchResult type matching API | Type compiles | TypeScript check |
| A.5.4 | Update component props to use new type | Props typed correctly | Type check |
| A.5.5 | Refactor render to display expert-based structure | Expert name + findings list | Visual check |
| A.5.6 | Add citations section with clickable links | Links render and work | Click test |
| A.5.7 | Add null/undefined handling for optional fields | No runtime errors | Error boundary test |
| A.5.8 | Update loading skeleton to match new structure | Skeleton resembles final | Visual check |
| A.5.9 | Add empty state for no research results | "No results" message | Empty data test |
| A.5.10 | Verify with real pipeline data | Component renders correctly | E2E test |

**Updated Type:**
```typescript
interface ResearchResult {
  expert: string;
  findings: string[];
  citations: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
  model_used: string;
  latency_ms: number;
}
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE B: DATA INTEGRITY & DATABASE (Priority 1)
# Timeline: 1-2 days
# Risk Level: HIGH - Data loss potential
# ═══════════════════════════════════════════════════════════════════════════════

## B.1 Fix saveSpec Missing user_id

**File:** `src/lib/api.ts`
**Root Cause:** INSERT missing `user_id: session.user.id`
**RLS Requirement:** `auth.uid() = user_id` policy requires user_id field
**Research:** Exa-verified Supabase RLS INSERT patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| B.1.1 | Locate all `.insert()` calls in api.ts | Line numbers documented | grep search |
| B.1.2 | Identify saveSpec function | Function location confirmed | Code read |
| B.1.3 | Add session retrieval before insert | `getSession()` call present | Code read |
| B.1.4 | Add null check for session | Error thrown if null | Try unauthenticated |
| B.1.5 | Add `user_id` field to insert payload | Field in object literal | Code read |
| B.1.6 | Update SpecificationInsert TypeScript type | Type requires user_id | Type check |
| B.1.7 | Test: authenticated insert succeeds | Spec saved with ID returned | Integration test |
| B.1.8 | Test: unauthenticated insert blocked | RLS policy error | Integration test |
| B.1.9 | Verify WITH CHECK policy on specifications table | Policy uses WITH CHECK | DB schema check |
| B.1.10 | Add E2E test for save flow | Playwright test passes | E2E run |

**Code Pattern:**
```typescript
async function saveSpec(spec: Specification) {
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error('Authentication required to save specifications');
  }

  const { data, error } = await supabase
    .from('specifications')
    .insert({
      ...spec,
      user_id: session.user.id  // Critical: RLS requires this
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## B.2 Seed review_stage Prompt

**File:** `supabase/migrations/*_seed_prompts.sql`
**Root Cause:** Phase 4 added review stage but prompt never seeded
**Risk:** Review stage fails at runtime
**Research:** Exa-verified GPT-5.2 Codex prompt patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| B.2.1 | Query prompts table for review_stage | 0 rows returned | SQL query |
| B.2.2 | Create review_stage prompt content | Prompt text complete | Document review |
| B.2.3 | Create migration file | `*_seed_review_prompt.sql` exists | File check |
| B.2.4 | Add INSERT with correct metadata | category: quality, model: gpt-5.2-codex | SQL review |
| B.2.5 | Apply migration | `supabase db push` succeeds | Command output |
| B.2.6 | Verify prompt in database | SELECT returns prompt | Query check |
| B.2.7 | Add prompt_versions entry | Version 1 with timestamp | Query check |
| B.2.8 | Test renderPrompt('review_stage', {}) | Content returned | Unit test |
| B.2.9 | Test review stage end-to-end | Stage returns pass/fail | Integration test |
| B.2.10 | Update prompts documentation | review_stage listed | Doc check |

**Migration SQL:**
```sql
INSERT INTO prompts (name, content, category, recommended_model, supports_variables, variables, active)
VALUES (
  'review_stage',
  'You are a senior technical reviewer using GPT-5.2 Codex capabilities.

TASK: Review the following specification synthesis for quality and accuracy.

SYNTHESIS TO REVIEW:
{{synthesis}}

ORIGINAL RESEARCH:
{{research}}

EXPERT VOTES:
{{votes}}

EVALUATION CRITERIA:
1. Factual accuracy (citations verified)
2. Completeness (all key aspects covered)
3. Consistency (no contradictions)
4. Actionability (clear next steps)
5. Technical depth (appropriate detail level)

OUTPUT FORMAT (JSON):
{
  "pass": boolean,
  "score": number (0-100),
  "issues": [{"severity": "critical|major|minor", "description": string, "affectedSection": string}],
  "citationAnalysis": {"totalCitations": number, "verifiedCitations": number, "missingCitations": []},
  "remediationNotes": string
}',
  'quality',
  'gpt-5.2-codex',
  true,
  '["synthesis", "research", "votes"]',
  true
);
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE C: MODEL REGISTRY & OBSERVABILITY (Priority 2)
# Timeline: 1-2 days
# Risk Level: MEDIUM - Consistency issues
# ═══════════════════════════════════════════════════════════════════════════════

## C.1 Align Model Registry with Evidence Ledger

**File:** `supabase/functions/lib/openrouter-client.ts`
**Reference:** `docs/reports/model-evidence-ledger-2025-12-19.md`
**Risk:** Wrong model IDs cause API failures
**Research:** Exa-verified OpenRouter model IDs (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| C.1.1 | Export current MODELS object to JSON | All IDs captured | Script output |
| C.1.2 | Diff against evidence ledger | Differences documented | Diff tool |
| C.1.3 | Remove unverified models | Only 7 verified models remain | Count check |
| C.1.4 | Add DeepSeek V3.2 models (now verified) | V3.2 and V3.2-Speciale present | Registry check |
| C.1.5 | Update pricing to match ledger | Costs accurate | Manual verification |
| C.1.6 | Update context windows | Limits accurate | Manual verification |
| C.1.7 | Add `verifiedDate` field to each entry | Date present | Code read |
| C.1.8 | Create registry consistency unit test | Test compares to ledger | vitest |
| C.1.9 | Add CI check for registry drift | PR fails if mismatch | GitHub Actions |
| C.1.10 | Update model-update-runbook.md | Runbook current | Doc review |

**Verified Model Registry (Dec 23, 2025):**
```typescript
export const MODELS = {
  'gpt-5.2': {
    id: 'openai/gpt-5.2',
    provider: 'openrouter',
    context: 400_000,
    pricing: { input: 1.75, output: 14.00 },
    verifiedDate: '2025-12-23'
  },
  'gpt-5.2-codex': {
    id: 'openai/gpt-5.2-codex',
    provider: 'openrouter',
    context: 400_000,
    pricing: { input: 1.75, output: 14.00 },
    verifiedDate: '2025-12-23'
  },
  'gemini-3-flash': {
    id: 'google/gemini-3-flash-preview',
    provider: 'openrouter',
    context: 1_000_000,
    pricing: { input: 0.50, output: 3.00 },
    verifiedDate: '2025-12-23'
  },
  'claude-opus-4.5': {
    id: 'anthropic/claude-opus-4-5-20251101',
    provider: 'openrouter',
    context: 200_000,
    pricing: { input: 15.00, output: 75.00 },
    verifiedDate: '2025-12-23'
  },
  'deepseek-v3.2': {
    id: 'deepseek/deepseek-v3.2',
    provider: 'openrouter',
    context: 163_840,
    pricing: { input: 0.27, output: 0.41 },
    verifiedDate: '2025-12-23'
  },
  'deepseek-v3.2-speciale': {
    id: 'deepseek/deepseek-v3.2-speciale',
    provider: 'openrouter',
    context: 163_840,
    pricing: { input: 0.27, output: 0.41 },
    verifiedDate: '2025-12-23'
  },
  'kimi-k2-thinking': {
    id: 'moonshotai/kimi-k2-thinking',
    provider: 'openrouter',
    context: 256_000,
    pricing: { input: 0.45, output: 2.35 },
    verifiedDate: '2025-12-23'
  },
  'llama-3.3-70b': {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    context: 131_072,
    pricing: { input: 0.00, output: 0.00 },  // Free tier
    verifiedDate: '2025-12-23'
  }
} as const;
```

---

## C.2 Fix Groq Model Tracking

**File:** `supabase/functions/multi-agent-spec/lib/utils/api.ts`
**Root Cause:** trackPromptUsage records wrong model ID for Groq calls
**Risk:** Usage analytics incorrect, cost tracking broken
**Research:** Exa-verified Supabase usage tracking patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| C.2.1 | Find all trackPromptUsage calls | Line numbers documented | grep search |
| C.2.2 | Verify GROQ_MODEL constant value | `llama-3.3-70b-versatile` | Code read |
| C.2.3 | Replace hardcoded strings with constant | All calls use GROQ_MODEL | grep verify |
| C.2.4 | Add `provider` field to tracking | `provider: 'groq'` in all calls | Code read |
| C.2.5 | Query prompt_usage table | Correct model IDs present | SQL query |
| C.2.6 | Add `latency_ms` tracking | Field populated | Query check |
| C.2.7 | Add `input_tokens`, `output_tokens` | Fields populated | Query check |
| C.2.8 | Create usage stats query | SQL aggregates by model | Query test |
| C.2.9 | Test full pipeline tracking | All stages recorded | E2E test |
| C.2.10 | Add alerting for tracking failures | Alert fires on error | Error injection |

---

## C.3 Fix claude-octopus Typo

**File:** Search entire codebase
**Root Cause:** Typo "octopus" instead of "opus"
**Risk:** Model lookups fail silently

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| C.3.1 | Search for "octopus" in codebase | All occurrences found | `grep -r "octopus"` |
| C.3.2 | Replace with "opus" | Zero "octopus" matches | grep verify |
| C.3.3 | Search for other model typos | Audit complete | Pattern search |
| C.3.4 | Add model ID validation at import | Invalid IDs throw | Unit test |
| C.3.5 | Test affected code paths | No runtime errors | Integration test |
| C.3.6 | Rebuild and deploy | Edge functions updated | Deploy command |

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE D: UX POLISH & SCHEMA ALIGNMENT (Priority 2)
# Timeline: 2-3 days
# Risk Level: MEDIUM - User experience degraded
# ═══════════════════════════════════════════════════════════════════════════════

## D.1 Fix Live Agent Activity (askedBy field)

**File:** `src/components/AgentCard.tsx` or similar
**Root Cause:** UI expects `askedBy` field not in response
**Risk:** Partial UI rendering

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| D.1.1 | Locate component expecting askedBy | File:line identified | grep search |
| D.1.2 | Trace data flow from API | Source documented | Code tracing |
| D.1.3 | Decision: add to API or remove from UI | Decision documented | Team review |
| D.1.4 | Implement chosen fix | Code updated | Code read |
| D.1.5 | Update TypeScript interfaces | Types match | Type check |
| D.1.6 | Add optional chaining fallback | Graceful degradation | Code read |
| D.1.7 | Test real-time activity display | Updates work | Manual test |
| D.1.8 | Verify all 8 expert types display | All render correctly | Visual check |
| D.1.9 | Add E2E test for activity panel | Playwright passes | Test run |
| D.1.10 | Document props interface | JSDoc complete | Doc check |

---

## D.2 Fix Smoke Test Expectations

**File:** `scripts/smoke-test-pipeline.ts`
**Root Cause:** Test expects fields not in actual API response
**Risk:** CI failures, false negatives
**Research:** Exa-verified multi-agent testing patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| D.2.1 | Run smoke test, capture all failures | Error list documented | Test output |
| D.2.2 | Document actual vs expected per stage | Diff table created | Manual analysis |
| D.2.3 | Update questions stage assertions | Assertions match reality | Test passes |
| D.2.4 | Update research stage assertions | expert/findings/citations | Test passes |
| D.2.5 | Update challenge stage assertions | challengeResponses array | Test passes |
| D.2.6 | Update synthesis stage assertions | synthesis object | Test passes |
| D.2.7 | Update review stage assertions | pass/fail/score | Test passes |
| D.2.8 | Update voting stage assertions | votes array | Test passes |
| D.2.9 | Update spec stage assertions | specification object | Test passes |
| D.2.10 | Run full smoke test | All 8 stages pass | Green output |

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE E: PERFORMANCE OPTIMIZATION (Priority 3)
# Timeline: 1-2 weeks
# Risk Level: LOW - Enhancement not blocker
# ═══════════════════════════════════════════════════════════════════════════════

## E.1 Bundle Size Optimization

**Target:** <200KB initial bundle, <1s LCP
**Current:** 430KB gzip, ~2s LCP
**Research:** Exa-verified Vite 6 code splitting (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| E.1.1 | Install vite-bundle-visualizer | Package installed | pnpm list |
| E.1.2 | Generate bundle report | Report HTML created | File exists |
| E.1.3 | Identify top 10 deps by size | List documented | Report analysis |
| E.1.4 | Configure manualChunks for vendors | Vendor chunk separated | Build output |
| E.1.5 | Add React.lazy to route components | Lazy imports present | Code check |
| E.1.6 | Add Suspense with skeletons | Fallback UI works | Visual test |
| E.1.7 | Tree-shake Recharts (individual imports) | Only used components | Import analysis |
| E.1.8 | Tree-shake Lucide icons | No barrel import | Import analysis |
| E.1.9 | Add modulepreload hints | Links in HTML | View source |
| E.1.10 | Measure final LCP | <1s in Lighthouse | Lighthouse run |

**Vite Config for Chunking:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
        }
      }
    }
  }
});
```

---

## E.2 Deno 2.1 Migration

**Files:** All Edge Functions
**Benefit:** npm: imports, better performance
**Research:** Exa-verified Supabase Deno 2.1 patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| E.2.1 | Update supabase/config.toml | `deno_version = 2` | Config read |
| E.2.2 | Migrate esm.sh imports to npm: prefix | All imports updated | grep verify |
| E.2.3 | Update deno.json import map | Deno 2 syntax | Config read |
| E.2.4 | Remove deprecated CLI flags | No warnings | Deploy output |
| E.2.5 | Test all Edge Functions locally | Functions work | Local test |
| E.2.6 | Deploy to staging | Deployment succeeds | Deploy output |
| E.2.7 | Run smoke tests against staging | All pass | Test output |
| E.2.8 | Deploy to production | Live deployment | Verify in dashboard |
| E.2.9 | Monitor for errors | Zero new errors | Log check |
| E.2.10 | Document migration in runbook | Steps recorded | Doc check |

**Import Migration Pattern:**
```typescript
// Before (Deno 1.x)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// After (Deno 2.1)
import { createClient } from 'npm:@supabase/supabase-js@2';
```

---

## E.3 React 19 Pattern Adoption

**Benefit:** Better form handling, async loading
**Research:** Exa-verified React 19 useActionState patterns (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| E.3.1 | Identify form components | List of components | Code search |
| E.3.2 | Implement useActionState for main form | Hook used correctly | Code read |
| E.3.3 | Add isPending state for submit button | Button disabled during submit | Visual test |
| E.3.4 | Implement use() for Suspense data | Pattern adopted | Code read |
| E.3.5 | Add resource hints (preconnect, prefetch) | Links in head | View source |
| E.3.6 | Add useDeferredValue for search | Responsive during typing | UX test |
| E.3.7 | Test all form interactions | No regressions | E2E test |
| E.3.8 | Measure performance improvement | Metrics documented | Lighthouse |
| E.3.9 | Remove deprecated patterns | No useEffect for data | Code audit |
| E.3.10 | Document patterns in README | Examples provided | Doc check |

**useActionState Pattern:**
```typescript
import { useActionState } from 'react';

function SpecGeneratorForm() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await generateSpec(formData.get('idea'));
      return { success: true, data: result };
    },
    { success: false, data: null }
  );

  return (
    <form action={submitAction}>
      <textarea name="idea" />
      <button disabled={isPending}>
        {isPending ? 'Generating...' : 'Generate Spec'}
      </button>
      {state.success && <SpecResults data={state.data} />}
    </form>
  );
}
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE F: TESTING & QUALITY GATES (Priority 3)
# Timeline: 1 week
# Risk Level: LOW - Quality improvement
# ═══════════════════════════════════════════════════════════════════════════════

## F.1 Expand Test Coverage

**Target:** >70% coverage, 30+ E2E tests
**Research:** Exa-verified agent evaluation frameworks (Dec 23, 2025)

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| F.1.1 | Run coverage report | Baseline documented | vitest coverage |
| F.1.2 | Identify uncovered critical paths | List created | Coverage report |
| F.1.3 | Add unit tests for RLS user_id | saveSpec tested | Test passes |
| F.1.4 | Add integration tests for review stage | API tested | Test passes |
| F.1.5 | Add E2E test for full 8-stage pipeline | Playwright passes | Test run |
| F.1.6 | Add visual regression tests | Percy/Chromatic configured | Snapshots taken |
| F.1.7 | Add test data fixtures | Fixtures for all stages | Files exist |
| F.1.8 | Measure final coverage | >70% achieved | Coverage report |
| F.1.9 | Add coverage threshold to CI | PR fails if drops | GitHub Actions |
| F.1.10 | Document testing strategy | Guide in docs/ | Doc exists |

---

## F.2 Eval System Enhancement

**Reference:** `evals/` directory
**Research:** Exa-verified multi-agent eval patterns (Dec 23, 2025) - Sources:
- Botpress: Multi-Agent Eval Systems 2025
- Google Cloud: Methodical Agent Evaluation
- Statsig: Agent Eval Frameworks

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| F.2.1 | Review existing eval runner | Capabilities documented | Code read |
| F.2.2 | Add eval dataset for each stage | JSONL files per stage | File check |
| F.2.3 | Implement LLM-as-judge for synthesis | Automated quality scoring | Test run |
| F.2.4 | Add citation verification eval | Citations checked against sources | Eval output |
| F.2.5 | Add consistency eval (no contradictions) | Cross-reference check | Eval output |
| F.2.6 | Set pass threshold: 85% | Threshold in config | Config check |
| F.2.7 | Add eval to CI pipeline | Runs on PR | GitHub Actions |
| F.2.8 | Create eval dashboard query | Results queryable | SQL test |
| F.2.9 | Document eval methodology | Methodology in docs | Doc exists |
| F.2.10 | Run baseline eval | Results documented | Eval output |

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE G: DOCUMENTATION & RELEASE (Priority 4)
# Timeline: 2-3 days
# Risk Level: LOW - Maintenance improvement
# ═══════════════════════════════════════════════════════════════════════════════

## G.1 Documentation Updates

| Task ID | Task | Success Criteria | Verification Method |
|---------|------|------------------|---------------------|
| G.1.1 | Update README with current stack | Stack table current | Doc review |
| G.1.2 | Update API documentation | All endpoints documented | Doc review |
| G.1.3 | Update deployment runbook | Steps work | Follow steps |
| G.1.4 | Create troubleshooting guide | Common issues listed | Doc review |
| G.1.5 | Update CLAUDE.md | AI context current | Doc review |
| G.1.6 | Create architecture diagram (Mermaid) | Diagram in docs/ | File exists |
| G.1.7 | Document all env variables | .env.example complete | File review |
| G.1.8 | Create onboarding guide | New dev can set up | Follow steps |
| G.1.9 | Update CHANGELOG.md | All changes since last | Doc review |
| G.1.10 | Tag release version | Git tag created | git tag -l |

---

# ═══════════════════════════════════════════════════════════════════════════════
# RISK REGISTER
# ═══════════════════════════════════════════════════════════════════════════════

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Rate limit bypass causes cost spike | HIGH | HIGH | A.1: Enable immediately |
| Model API changes break pipeline | MEDIUM | HIGH | Model registry + fallbacks |
| Schema changes break frontend | MEDIUM | MEDIUM | TypeScript strict mode |
| Deno 2.1 migration breaks functions | LOW | HIGH | Test in staging first |
| Bundle size regression | LOW | MEDIUM | CI size budget check |
| Test flakiness delays releases | MEDIUM | LOW | Retry logic, deterministic tests |

---

# ═══════════════════════════════════════════════════════════════════════════════
# CRITICAL PATH
# ═══════════════════════════════════════════════════════════════════════════════

```
Phase A (Critical Blockers) ──┬──> Phase B (Data Integrity) ──> Phase C (Observability)
                              │
                              └──> Phase D (UX) ──────────────> Phase E (Performance)
                                                                        │
                                                                        v
                              Phase F (Testing) <────────────────────────┘
                                      │
                                      v
                              Phase G (Documentation & Release)
```

**Parallel Execution Possible:**
- A.1 (Rate Limiting) || A.2 (vitest) || A.3 (ESLint)
- B.1 (user_id) || B.2 (review prompt)
- C.1 (Registry) || C.2 (Tracking) || C.3 (Typos)
- E.1 (Bundle) || E.2 (Deno) || E.3 (React 19)

---

# ═══════════════════════════════════════════════════════════════════════════════
# SUCCESS METRICS (Definition of Done)
# ═══════════════════════════════════════════════════════════════════════════════

| Metric | Before | After | Verification |
|--------|--------|-------|--------------|
| ESLint `any` errors | 42 | 0 | `pnpm lint` clean |
| Rate limiting | Disabled | 100 req/hr/user | Integration test |
| Review stage | Not called | Integrated | E2E test |
| ResearchPanel | Schema mismatch | Renders correctly | Visual + E2E |
| vitest | Not installed | 17+ tests pass | `pnpm test:unit` |
| Bundle size | 430KB | <200KB | Lighthouse |
| LCP | ~2s | <1s | Lighthouse |
| Test coverage | Unknown | >70% | Coverage report |
| E2E tests | 19 files | 30+ files | File count |
| Eval pass rate | Unknown | >85% | Eval runner |

---

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICATION SOURCES (Exa Research Dec 23, 2025)
# ═══════════════════════════════════════════════════════════════════════════════

| Topic | Source | Key Insight |
|-------|--------|-------------|
| Supabase Rate Limiting | drdroid.io, zuplo.com | RPC + sliding window pattern |
| React 19 useActionState | react.dev, medium.com | Form submission with pending state |
| vitest Configuration | vitest.dev, github.com/vitest-dev | globals: true, environment: node |
| ESLint Strict TypeScript | eslint.org, tsconfig strictTypeChecked | no-explicit-any: error |
| Multi-Agent Eval | botpress.com, cloud.google.com | LLM-as-judge, trajectory evaluation |
| Deno 2.1 npm imports | supabase.com/docs | npm: prefix for Node packages |
| Vite 6 Code Splitting | vite.dev | manualChunks for vendor bundles |

---

**Document Version:** 1.0.0
**Last Updated:** December 23, 2025 14:12 PST
**Author:** Claude Opus 4.5 (via CTO Advisor + Temporal Metacognition)
**Next Review:** After Phase A completion
