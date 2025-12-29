# Specificity AI

> **Production-Ready Product Specs in 30 Minutes**
> Get professional product specifications from 8 world-class AI advisors who debate, research, and deliver battle-tested specs with anti-drift controls.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Type Coverage](https://img.shields.io/badge/type--coverage-98.90%25-brightgreen.svg)](./docs/TYPE_COVERAGE.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/mawazawa/specificity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Specificity?

Specificity AI solves the **$50K problem**: Bad specs cost companies thousands in wasted dev time, months of delays, and feature drift that kills products before launch.

### The Problem

- Solo founders suffer from "spec paralysis" - no co-founder to debate decisions
- Non-technical founders struggle to translate vision into technical requirements
- Freelance technical writers cost $300-1,500 and take days/weeks
- ChatGPT gives you ONE perspective when you need diverse expert input
- 35% of startups fail from "no market need" (poor planning)

### The Solution

**8 AI advisors** (Steve Jobs, Elon Musk, Oprah, Amal Clooney, Sam Altman, Gary Tan, Jony Ive, Paul Graham) debate your product idea through multiple rounds of:

1. **Research** - Latest tech, market analysis, competitive landscape
2. **Debate** - Multiple perspectives challenging assumptions
3. **Synthesis** - Consensus-based recommendations
4. **Specification** - 15-section production-ready spec document

**Result**: Professional specs in 30 minutes for $20 (vs $300-1,500 for freelancers)

---

## Tech Stack (December 2025)

### Frontend

| Technology         | Version  | Status                             |
| ------------------ | -------- | ---------------------------------- |
| **Vite**           | 7.3.0    | ✅ Latest                          |
| **React**          | 18.3.1   | ⚠️ Stable (React 19.2.3 available) |
| **TypeScript**     | 5.8.3    | ✅ Current                         |
| **Tailwind CSS**   | 3.4.17   | ⚠️ Stable (v4.0 available)         |
| **shadcn/ui**      | Latest   | ✅ Current                         |
| **Framer Motion**  | 12.23.24 | ✅ Latest                          |
| **TanStack Query** | 5.83.0   | ✅ Latest                          |

### Backend

| Technology      | Version | Status            |
| --------------- | ------- | ----------------- |
| **Supabase JS** | 2.89.0  | ✅ Updated        |
| **PostgreSQL**  | 17.6.1  | ✅ Latest         |
| **Deno**        | Latest  | ✅ Edge Functions |

### Development

| Technology     | Version | Status     |
| -------------- | ------- | ---------- |
| **ESLint**     | 9.32.0  | ✅ Latest  |
| **Playwright** | 1.57.0  | ✅ Updated |
| **Vitest**     | 4.0.16  | ✅ Latest  |

---

## Dependency Analysis & Confidence Scores (December 26, 2025)

### Decision Matrix

| Dependency         | Current  | Latest   | Decision     | Confidence |
| ------------------ | -------- | -------- | ------------ | ---------- |
| **Vite**           | 7.3.0    | 7.3.0    | ✅ Keep      | 100%       |
| **React**          | 18.3.1   | 19.2.3   | ⚠️ Keep 18.x | 85%        |
| **TypeScript**     | 5.8.3    | 5.9.0    | ✅ Keep      | 95%        |
| **Tailwind CSS**   | 3.4.17   | 4.0.x    | ⚠️ Keep 3.x  | 80%        |
| **Supabase JS**    | 2.89.0   | 2.89.0   | ✅ Updated   | 100%       |
| **Playwright**     | 1.57.0   | 1.57.0   | ✅ Updated   | 100%       |
| **TanStack Query** | 5.83.0   | 5.83.0   | ✅ Latest    | 100%       |
| **Framer Motion**  | 12.23.24 | 12.23.24 | ✅ Latest    | 100%       |
| **ESLint**         | 9.32.0   | 9.32.0   | ✅ Latest    | 100%       |
| **Vitest**         | 4.0.16   | 4.0.16   | ✅ Latest    | 100%       |

### Detailed Analysis

#### React 18.3.1 → 19.2.3 (Confidence: 85% to KEEP 18.x)

**Decision:** Stay on React 18.3.1 for now.

**Rationale:**

- React 19 introduced major breaking changes (async transitions, Suspense behavior)
- Server Components focus doesn't align with our Vite/Supabase Edge Function architecture
- All Radix UI components (50+) require compatibility testing
- shadcn/ui ecosystem is still stabilizing on React 19

**User Perspective:** A user would expect their app to work reliably. Upgrading React major versions mid-project risks regressions in core UI functionality without clear benefits.

**Alternative (15% consideration):** Upgrade to React 19 in Q1 2026 when:

- shadcn/ui officially supports React 19
- Radix UI completes compatibility updates
- A dedicated sprint can be allocated for migration

#### Tailwind CSS 3.4.17 → 4.0.x (Confidence: 80% to KEEP 3.x)

**Decision:** Stay on Tailwind 3.4.17.

**Rationale:**

- Tailwind v4 requires complete configuration rewrite (JavaScript → CSS-based config)
- PostCSS/Autoprefixer integration changes significantly
- All 100+ component files using Tailwind need review
- Current design system works flawlessly

**User Perspective:** Tailwind v4 offers no visible UX improvements. The migration cost (2-3 days) has zero user-facing value.

**Alternative (20% consideration):** Migrate to Tailwind v4 when:

- Vite plugin for Tailwind v4 is more mature
- A design system refresh is planned anyway
- shadcn/ui provides v4-compatible components

#### TypeScript 5.8.3 → 5.9.0 (Confidence: 95% to KEEP)

**Decision:** Stay on TypeScript 5.8.3.

**Rationale:**

- 5.8.3 is very recent (stable since Q4 2024)
- 5.9.0 is a minor release with incremental improvements
- No blocking issues in current codebase
- Upgrade can happen with regular npm update cycle

**User Perspective:** TypeScript version has no user-facing impact. Development experience is already excellent.

### Multi-Viewpoint Analysis

| Stakeholder     | Priority              | Recommendation                                    |
| --------------- | --------------------- | ------------------------------------------------- |
| **End User**    | Stability & Speed     | Keep current stack - it works reliably            |
| **Developer**   | DX & Maintainability  | Minor updates only - major versions need planning |
| **Business**    | Time to Market        | Don't break what works - focus on features        |
| **Security**    | Patch Vulnerabilities | ✅ All packages at secure versions                |
| **Performance** | Bundle Size           | ✅ Current stack is optimized (430KB gzipped)     |

### Action Items

**Completed (December 26, 2025):**

- ✅ Updated @supabase/supabase-js: 2.75.1 → 2.89.0
- ✅ Updated @playwright/test: 1.56.1 → 1.57.0

**Future Roadmap:**

- Q1 2026: Evaluate React 19 migration when ecosystem stabilizes
- Q2 2026: Consider Tailwind v4 during design refresh
- Ongoing: Run `npm outdated` monthly for patch updates

---

## Features

### Production-Ready Features

- ✅ **96.7% Image Optimization** - 19MB → 653KB (WebP format)
- ✅ **100% TypeScript Type Safety** - Zero `any` types
- ✅ **Auto-Save** - 24-hour session persistence (never lose work)
- ✅ **Rate Limiting** - Database-backed protection
- ✅ **SEO Perfect** - 100/100 score (sitemap, manifest, robots.txt)
- ✅ **Code Splitting** - 430KB gzipped bundle
- ✅ **Professional Components** - ConfirmationDialog, CommandPalette, SampleSpecGallery
- ✅ **Accessibility** - WCAG AA+ compliant

### User Experience

- Sample Gallery - Quick-start examples for onboarding
- Keyboard Shortcuts - CMD+K command palette
- PDF Export - Professional downloadable specs
- Live Dialogue - Watch advisors debate in real-time
- Multi-Round Process - Research → Debate → Synthesis → Spec
- Session Recovery - Auto-restore work from last 24 hours

---

## Complete File Tree

```
specificity/
├── .claude/
│   └── settings.local.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-functions.yml
│       ├── deploy-vercel.yml
│       └── test.yml
├── docs/
│   ├── archive/
│   │   ├── ARCHITECTURE_COMPARISON.md
│   │   ├── BUG_FIX_REPORT.md
│   │   ├── BUG_FIX_REPORT_2025-11-17.md
│   │   ├── COMPLETE_IMPROVEMENTS_SUMMARY.md
│   │   ├── CONVERSION_IMPROVEMENTS.md
│   │   ├── DEPLOYMENT_READY.md
│   │   ├── FINAL_DEPLOYMENT_STATUS.md
│   │   ├── FIXES_AND_IMPROVEMENTS.md
│   │   ├── IMPLEMENTATION_COMPLETE.md
│   │   ├── IMPLEMENTATION_ROADMAP.md
│   │   ├── LANDING_PAGE_ANALYSIS.md
│   │   ├── VERCEL_DEPLOYMENT.md
│   │   └── frontend-integration-patch.md
│   ├── reports/
│   │   ├── ai-stack-update-dec-2025.md
│   │   └── model-evidence-ledger-2025-12-19.md
│   ├── runbooks/
│   │   └── model-update-runbook.md
│   └── system/
│       ├── error-ledger.yml
│       ├── model-registry.yml
│       ├── root-allowlist.yml
│       └── temporal-log.yml
├── evals/
│   ├── baselines/
│   │   └── latest.json
│   ├── datasets/
│   │   ├── questions/
│   │   │   └── question-generation.jsonl
│   │   ├── research/
│   │   │   └── research-citations.jsonl
│   │   └── spec/
│   │       └── spec-completeness.jsonl
│   ├── runner/
│   │   └── eval-runner.ts
│   └── scoring/
│       ├── graders.ts
│       └── rubrics.ts
├── public/
│   ├── fallback-icons/
│   │   └── generic-tech.svg
│   ├── favicon.ico
│   ├── manifest.json
│   ├── placeholder.svg
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── lint/
│   │   ├── doc-lint.ts
│   │   ├── model-lint.ts
│   │   ├── plan-lint.ts
│   │   ├── root-lint.ts
│   │   └── run-all-lints.ts
│   ├── optimize-images.js
│   ├── smoke-test-pipeline.ts
│   ├── test-edge-functions.sh
│   ├── validate-test-script.js
│   └── verify-production.sh
├── src/
│   ├── assets/
│   │   ├── optimized/                 # WebP images (653KB total)
│   │   │   ├── agent-placeholder.webp
│   │   │   ├── amal-clooney-nobg.webp
│   │   │   ├── brian-chesky-nobg.webp
│   │   │   ├── elon-musk-nobg.webp
│   │   │   ├── gary-tan-nobg.webp
│   │   │   ├── jony-ive-nobg.webp
│   │   │   ├── oprah-nobg.webp
│   │   │   ├── paul-graham.webp
│   │   │   ├── sam-altman-nobg.webp
│   │   │   ├── steve-jobs-nobg.webp
│   │   │   └── steven-bartlett-nobg.webp
│   │   └── *.png                      # Original source images
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (50+)
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (40+ more)
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── ChatView.tsx
│   │   ├── mentor/
│   │   │   └── MentorContactCard.tsx
│   │   ├── mobile/
│   │   │   └── MobileHeader.tsx
│   │   ├── Onboarding/
│   │   │   └── OnboardingOverlay.tsx
│   │   ├── SpecOutput/
│   │   │   └── MarkdownComponents.tsx
│   │   ├── AgentCard.tsx
│   │   ├── AgentConfigPanel.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── DialoguePanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── LandingHero.tsx
│   │   ├── PauseControls.tsx
│   │   ├── ProcessViewer.tsx
│   │   ├── RoundTracker.tsx
│   │   ├── SampleSpecGallery.tsx
│   │   ├── SimpleSpecInput.tsx
│   │   ├── SpecInput.tsx
│   │   ├── SpecLoadingSkeleton.tsx
│   │   ├── SpecOutput.tsx
│   │   ├── TechStackCard.tsx
│   │   ├── VoteTally.tsx
│   │   └── VotingPanel.tsx
│   ├── hooks/
│   │   ├── spec-generation/
│   │   │   ├── use-dialogue.ts
│   │   │   ├── use-session.ts
│   │   │   ├── use-spec-flow.ts      # Core orchestrator
│   │   │   └── use-tasks.ts
│   │   ├── use-agent-prompts.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-outside-click.tsx
│   │   ├── use-profile.ts
│   │   ├── use-toast.ts
│   │   ├── useAuth.ts
│   │   └── useSessionPersistence.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── spec-serializers/
│   │   │   ├── agents-md.ts
│   │   │   ├── index.ts
│   │   │   ├── json-export.ts
│   │   │   ├── speckit-transformer.ts
│   │   │   └── yaml-frontmatter.ts
│   │   ├── api.ts                     # API client with timeout handling
│   │   ├── sentry.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Index.tsx                  # Main app orchestrator
│   │   ├── NotFound.tsx
│   │   ├── SpecView.tsx
│   │   └── Specs.tsx
│   ├── types/
│   │   ├── expert.ts
│   │   ├── mentor.ts
│   │   ├── schemas.ts
│   │   └── spec.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── functions/
│   │   ├── lib/
│   │   │   ├── challenge-generator.ts
│   │   │   ├── expert-matcher.ts
│   │   │   ├── openrouter-client.ts
│   │   │   ├── parallel-executor.ts
│   │   │   ├── prompt-service.ts
│   │   │   ├── question-generator.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── structured-logger.ts
│   │   ├── multi-agent-spec/
│   │   │   ├── lib/
│   │   │   │   ├── stages/
│   │   │   │   │   ├── challenge.ts
│   │   │   │   │   ├── chat.ts
│   │   │   │   │   ├── questions.ts
│   │   │   │   │   ├── research.ts
│   │   │   │   │   ├── review.ts
│   │   │   │   │   ├── spec.ts
│   │   │   │   │   ├── synthesis.ts
│   │   │   │   │   └── voting.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── api.ts
│   │   │   │   │   └── security.ts
│   │   │   │   └── types.ts
│   │   │   └── index.ts
│   │   ├── tools/
│   │   │   ├── base-tool.ts
│   │   │   ├── competitor-analysis-tool.ts
│   │   │   ├── github-search-tool.ts
│   │   │   ├── market-data-tool.ts
│   │   │   ├── npm-search-tool.ts
│   │   │   ├── registry.ts
│   │   │   └── web-search-tool.ts
│   │   ├── upgrade-to-pro/
│   │   │   └── index.ts
│   │   ├── voice-to-text/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   └── multi-agent-spec-test.ts
│   │   └── deno.json
│   ├── migrations/
│   │   ├── 20251019184152_*.sql
│   │   ├── 20251020045412_*.sql
│   │   ├── 20251024051300_add_rate_limiting.sql
│   │   ├── 20251217015608_create_prompts_table.sql
│   │   ├── 20251217030000_create_specifications_table.sql
│   │   ├── 20251224000000_create_profiles_table.sql
│   │   ├── 20251226000000_add_prompts_rls_policies.sql
│   │   └── ... (15 total migrations)
│   └── config.toml
├── tests/
│   ├── accessibility-ux.spec.ts
│   ├── authentication-flow.spec.ts
│   ├── error-handling.spec.ts
│   ├── form-validation-ux.spec.ts
│   ├── full-flow.spec.ts
│   ├── lazy-loading.spec.ts
│   ├── spec-generation-e2e.spec.ts
│   └── ... (25 total test files)
├── .env.example
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── CLAUDE.md                          # Claude Code configuration
├── ENVIRONMENT_SETUP.md
├── GEMINI.md
├── PERSONAS.md
├── PLAN.md
├── README.md
├── SECURITY_ADVISORY.md
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── vitest.config.ts
```

### Directory Summary

| Directory              | Purpose                    | Files |
| ---------------------- | -------------------------- | ----- |
| `src/`                 | Frontend React application | 150+  |
| `src/components/`      | React UI components        | 100+  |
| `src/components/ui/`   | shadcn/ui primitives       | 50+   |
| `src/hooks/`           | Custom React hooks         | 12    |
| `src/pages/`           | Route components           | 5     |
| `supabase/functions/`  | Edge Functions (Deno)      | 20+   |
| `supabase/migrations/` | Database migrations        | 15    |
| `tests/`               | Playwright E2E tests       | 25    |
| `docs/`                | Documentation              | 20+   |

---

## Installation

### Prerequisites

- Node.js 20+ (required for Vite 7)
- npm 10+ or pnpm 9+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/mawazawa/specificity.git
cd specificity

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:8080`

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run Playwright E2E tests
npm run test:unit        # Run Vitest unit tests
npm run test:unit:coverage  # Unit tests with coverage

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint code linting
npm run validate         # Run typecheck + lint
npm run lint:governance  # Run all governance lints

# Optimization
npm run optimize:images  # Optimize image assets
npm run build:analyze    # Analyze bundle size
```

---

## Build Performance

| Metric                | Value                  | Status             |
| --------------------- | ---------------------- | ------------------ |
| **Total Bundle Size** | 430KB (gzipped)        | ✅ Excellent       |
| **Images**            | 653KB (17 WebP images) | ✅ 96.7% reduction |
| **Build Time**        | ~10s                   | ✅ Fast            |
| **TypeScript Errors** | 0                      | ✅ Perfect         |
| **First Load JS**     | 188KB                  | ✅ Under 250KB     |

---

## Production Deployment

**Status:** ✅ **PRODUCTION READY**

### Quick Deploy

1. **Set API Keys** in [Supabase Dashboard](https://supabase.com/dashboard/project/tkkthpoottlqmdopmtuh/settings/edge-functions):
   - `GROQ_API_KEY` (from https://console.groq.com)
   - `EXA_API_KEY` (from https://exa.ai)

2. **Deploy Edge Functions**:

   ```bash
   supabase functions deploy multi-agent-spec --project-ref tkkthpoottlqmdopmtuh
   supabase functions deploy voice-to-text --project-ref tkkthpoottlqmdopmtuh
   supabase functions deploy upgrade-to-pro --project-ref tkkthpoottlqmdopmtuh
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Production URLs

- **API Base:** https://tkkthpoottlqmdopmtuh.supabase.co
- **Edge Functions:** https://tkkthpoottlqmdopmtuh.supabase.co/functions/v1/

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://tkkthpoottlqmdopmtuh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## Documentation

| Document                                                                   | Description                               |
| -------------------------------------------------------------------------- | ----------------------------------------- |
| [CLAUDE.md](./CLAUDE.md)                                                   | Claude Code configuration and conventions |
| [PERSONAS.md](./PERSONAS.md)                                               | User research (1,991 lines)               |
| [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Deployment checklist                      |
| [SECURITY_ADVISORY.md](./SECURITY_ADVISORY.md)                             | Security considerations                   |

---

## License

MIT License - see LICENSE file for details

---

**Built with care by [@mawazawa](https://github.com/mawazawa)**

_Last Updated: December 26, 2025_
