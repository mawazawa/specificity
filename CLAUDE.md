# Specificity AI - Claude Code Guide

## Project Overview

**Specificity AI** is a production-ready SaaS application that generates professional technical specifications in ~30 minutes using a multi-agent AI panel. The app orchestrates 8 AI "advisors" (personas like Steve Jobs, Elon Musk, Oprah, etc.) that debate, research, and synthesize technical requirements through a structured multi-round workflow.

**Key Value Proposition:**
- 8 expert perspectives vs. 1 biased human view
- 93% cheaper than hiring freelancers ($20 vs $300-1,500)
- Instant delivery vs. days/weeks of waiting
- Professional quality suitable for investor/stakeholder approval

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework with hooks-based architecture |
| TypeScript | 5.8 | Full type safety |
| Vite | 7.3 | Lightning-fast build tool with HMR |
| Tailwind CSS | 3.4 | Utility-first styling with custom design system |
| shadcn/ui | - | High-quality component library built on Radix UI |
| Framer Motion | 12.23 | Spring-physics animations |
| React Router | 6.30 | Client-side routing |
| TanStack Query | 5.83 | Server state management with intelligent caching |
| React Hook Form | 7.61 | Lightweight form handling |
| Zod | 3.25 | Runtime type validation and schema management |

### Backend & Infrastructure
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database + Auth + Edge Functions |
| Edge Functions (Deno) | Serverless API for AI orchestration |
| OpenRouter & Groq APIs | Multi-model LLM support |
| Exa AI | Research tool for web searches |

### Development & Quality
| Tool | Purpose |
|------|---------|
| ESLint 9 | Code quality enforcement |
| Playwright 1.56 | E2E testing |
| Vitest 4.0 | Unit testing framework |
| Sentry 10.31 | Error tracking and observability |

---

## Supabase Configuration

| Field | Value |
|-------|-------|
| **Project Name** | `specificity` |
| **Project Ref** | `tkkthpoottlqmdopmtuh` |
| **Region** | `us-east-1` |
| **Organization** | `vercel_icfg_9FDuWsXNcDTafFbuyOkfLzHZ` |
| **Database Host** | `db.tkkthpoottlqmdopmtuh.supabase.co` |
| **API URL** | `https://tkkthpoottlqmdopmtuh.supabase.co` |
| **PostgreSQL Version** | 17.6.1.063 |

### Environment Variables

```bash
VITE_SUPABASE_URL=https://tkkthpoottlqmdopmtuh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SENTRY_DSN=<sentry-dsn>  # Optional
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile info (email, full_name, avatar_url) |
| `specifications` | User-generated specifications |
| `rate_limits` | API rate limiting (5 req/hour) |
| `user_roles` | Role-based access (admin, moderator, user) |
| `prompts` | Centralized prompt management with versioning |
| `prompt_versions` | Version history for rollback |
| `prompt_usage` | Usage tracking for analytics |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `multi-agent-spec` | 8-stage AI pipeline for spec generation |
| `voice-to-text` | Audio transcription service |

---

## Directory Structure

```
specificity/
├── src/
│   ├── pages/                    # Route components (lazy-loaded)
│   │   ├── Index.tsx            # Main app orchestrator (280 LOC)
│   │   ├── Auth.tsx             # Authentication (sign up/sign in)
│   │   ├── Specs.tsx            # Spec history/library
│   │   └── SpecView.tsx         # Individual spec viewer
│   │
│   ├── components/              # 95+ React components
│   │   ├── ui/                  # shadcn/ui base components (30+ primitives)
│   │   ├── Onboarding/          # Onboarding flow components
│   │   ├── SpecOutput/          # Spec display & export
│   │   ├── chat/                # Chat view with agent dialogue
│   │   ├── mentor/              # Mentor components
│   │   └── mobile/              # Mobile-specific components
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── spec-generation/     # Core spec flow hooks
│   │   │   ├── use-spec-flow.ts # State machine orchestrator
│   │   │   ├── use-session.ts   # Session state reducer
│   │   │   ├── use-dialogue.ts  # Dialogue thread management
│   │   │   └── use-tasks.ts     # Task queue & progress
│   │   ├── useAuth.ts           # Authentication state
│   │   ├── useSessionPersistence.ts # Debounced localStorage
│   │   └── use-toast.ts         # Toast notification state
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client (PKCE auth)
│   │       └── types.ts         # Auto-generated TypeScript types
│   │
│   ├── lib/
│   │   ├── api.ts               # Supabase function invocation layer
│   │   ├── sentry.ts            # Error tracking initialization
│   │   └── utils.ts             # Utility functions
│   │
│   ├── types/
│   │   ├── spec.ts              # Core domain types
│   │   └── schemas.ts           # Zod schemas for validation
│   │
│   └── assets/optimized/        # WebP images (653KB, 17 images)
│
├── supabase/
│   ├── functions/
│   │   ├── multi-agent-spec/    # Main AI orchestration engine
│   │   │   ├── index.ts         # 8-stage pipeline handler
│   │   │   └── lib/stages/      # Stage-specific handlers
│   │   ├── voice-to-text/       # Audio transcription
│   │   ├── tools/               # Tool registry (5+ tools)
│   │   └── lib/                 # Shared utilities
│   └── migrations/              # Database schema migrations
│
├── tests/                       # Playwright E2E tests (23 suites)
├── evals/                       # Evaluation framework
├── scripts/                     # Build & lint scripts
└── docs/                        # Documentation
```

---

## Architecture

### Multi-Agent Spec Generation Pipeline

The spec generation follows an 8-stage pipeline:

```
Stage 1: Questions     → GPT-5.2 generates targeted research questions
Stage 2: Research      → Parallel research with Exa + OpenRouter (multi-model)
Stage 3: Challenge     → GPT-5.2 runs devil's advocate debates (Dalio style)
Stage 4: Synthesis     → Groq llama-3.3-70b synthesizes findings
Stage 5: Review        → GPT-5.2 Codex quality gate verification
Stage 6: Voting        → Groq llama-3.3-70b consensus voting
Stage 7: Spec          → Groq llama-3.3-70b final specification
Stage 8: Chat          → GPT-5.2 1:1 conversation mode
```

### State Management

The app uses a **hybrid approach**:

**Component-level State (React Hooks):**
- `useSpecFlow` - Core state machine orchestrator
- `useSession` - Session state via `useReducer`
- `useDialogue` - Agent dialogue entries with timestamps
- `useTasks` - Task queue and progress tracking
- `useSessionPersistence` - Debounced localStorage (2s delay, 24h expiry)

**Server State:**
- TanStack Query for caching and sync with Supabase
- Default stale time: 1 minute, retry: 1 attempt

### Data Flow

```
User Input → useSpecFlow (Orchestrator)
                ├→ useSession (State)
                ├→ useDialogue (Entries)
                └→ API calls via src/lib/api.ts
                        ↓
          Supabase Edge Function (multi-agent-spec)
                        ↓
          Component Updates → UI Renders
```

---

## Development Workflow

### NPM Scripts

```bash
npm run dev              # Start dev server (localhost:8080)
npm run build            # Production build
npm run typecheck        # TypeScript verification
npm run lint             # ESLint check
npm run validate         # typecheck + lint
npm run test             # Playwright E2E tests
npm run test:unit        # Vitest unit tests
npm run optimize:images  # Compress images with Sharp
npm run lint:governance  # Run all governance lints
```

### Pre-Commit Checklist

```bash
npm run typecheck        # Must pass with 0 errors
npm run lint             # Must pass with 0 warnings
npm run build            # Must complete successfully
```

### Testing

**Playwright E2E Tests:**
- 23 test suites in `tests/`
- Base URL: `http://localhost:8080`
- Single worker, no parallelization
- Traces, screenshots, videos on failure

**Vitest Unit Tests:**
- Coverage with `@vitest/coverage-v8`
- Run with `npm run test:unit:coverage`

---

## Code Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Pages | PascalCase | `Index.tsx`, `Auth.tsx` |
| Components | PascalCase | `AgentCard.tsx`, `DialoguePanel.tsx` |
| Hooks | `use*` prefix | `useAuth.ts`, `useSpecFlow.ts` |
| Utilities | camelCase | `utils.ts`, `api.ts` |

### Variable Naming

| Pattern | Usage | Example |
|---------|-------|---------|
| `is*`, `has*`, `show*` | Boolean state | `isProcessing`, `hasHydrated` |
| `handle*` | Event handlers | `handleSubmit`, `handleGetStarted` |
| `on*` | Callback props | `onSubmit`, `onResume` |

### Component Structure

```tsx
// 1. Imports
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// 2. Types
interface Props {
  onSubmit: (value: string) => void;
}

// 3. Component
export function MyComponent({ onSubmit }: Props) {
  // 3a. Hooks
  const { toast } = useToast();
  const [value, setValue] = useState('');

  // 3b. Callbacks
  const handleSubmit = useCallback(() => {
    onSubmit(value);
  }, [value, onSubmit]);

  // 3c. Render
  return <div>...</div>;
}
```

### Import Aliases

Use `@/` for src imports:
```tsx
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
```

---

## Styling

### Design System (HSL-based)

All colors are defined in `src/index.css` using HSL:

```css
--background: 0 0% 3%;        /* Near black */
--foreground: 0 0% 98%;       /* Off-white */
--primary: 0 0% 95%;          /* White buttons */
--accent: 210 100% 50%;       /* Electric blue */
--success: 142 76% 36%;       /* Green */
--warning: 38 92% 50%;        /* Amber */
--error: 0 84% 60%;           /* Red */
```

### Agent Colors

```css
--agent-elon: 0 0% 75%;       /* Grayscale */
--agent-cuban: 40 5% 70%;     /* Warm */
--agent-dev: 150 10% 65%;     /* Green */
--agent-designer: 280 15% 70%; /* Purple */
--agent-entrepreneur: 210 15% 65%; /* Blue */
--agent-legal: 220 10% 60%;   /* Dark blue */
```

### Typography

Fluid responsive typography using `clamp()`:
```css
h1: clamp(2.5rem, 5vw + 1rem, 4.5rem)
h2: clamp(2rem, 4vw + 0.5rem, 3.5rem)
p:  clamp(1rem, 1.5vw + 0.5rem, 1.125rem)
```

Fonts: `Geist Variable` (sans) and `Geist Mono` (mono)

---

## Error Handling

### Frontend Pattern

```typescript
const parseError = (error: unknown) => {
  const errMessage = error instanceof Error ? error.message : '';

  if (errMessage.includes('RATE_LIMIT') || errMessage.includes('429')) {
    return { title: '⚠️ Rate Limit Exceeded', message: 'Wait and retry' };
  }
  if (errMessage.includes('OPENROUTER')) {
    return { title: '⚠️ OpenRouter API Issue', message: 'Falling back to Groq' };
  }
  return { title: 'Error', message: errMessage || 'An error occurred' };
};
```

### Backend Integration

- Try-catch blocks around all API calls
- Automatic OpenRouter → Groq fallback
- Prompt injection detection in Edge Functions
- Sentry for error tracking

---

## Performance

### Bundle Optimization

| Metric | Target | Current |
|--------|--------|---------|
| Total Bundle (gzipped) | < 500KB | 430KB |
| First Load JS | < 250KB | 188KB |
| Images | < 1MB | 653KB (WebP) |

### Manual Chunks (vite.config.ts)

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/react-dialog', ...],
  'animation-vendor': ['framer-motion'],
  'pdf-vendor': ['jspdf', 'html2canvas'],
  'supabase-vendor': ['@supabase/supabase-js'],
}
```

### Optimization Techniques

- Lazy loading pages with `React.lazy` + `Suspense`
- Debounced localStorage persistence (2s delay, 10s maxWait)
- Memoized computations with `useMemo`/`useCallback`
- WebP images with 96.7% size reduction

---

## Verification Protocols

### Before Making Claims

**Exa Search Discipline:**
```
1. Search: "[exact term]"
2. Search: "[broader term] [provider]"
3. Search: "[provider] latest [category] 2025"
4. ACTUALLY CHECK the provider's page directly
5. If still nothing: "I could not find this" NOT "This does not exist"
```

### Completion Verification

| Claim Type | Verification |
|------------|--------------|
| File exists | `glob "**/[filename]"` |
| Code contains | `grep "[pattern]" path/to/file` |
| Config value | Read the actual config file |
| Migration done | Check BOTH source and destination |

### Document Amendment Protocol

1. **Grep first**: Search for related terms that might contradict
2. **Reconcile**: Update or remove old contradictory statements
3. **SUPERSEDES pattern**: Mark old sections with "CORRECTED: See [section]"
4. **Single source of truth**: One authoritative section, not multiple claims

---

## Common Tasks

### Adding a New Component

1. Create in `src/components/` or appropriate subdirectory
2. Use PascalCase filename
3. Import shadcn/ui primitives from `@/components/ui/`
4. Use Tailwind classes with design system tokens
5. Add TypeScript types for props

### Adding a New Hook

1. Create in `src/hooks/` with `use-` prefix
2. Return object with state and actions
3. Use `useCallback` for stable function references
4. Document with JSDoc if complex

### Modifying Edge Functions

1. Edit in `supabase/functions/`
2. Test locally with `supabase functions serve`
3. Deploy with GitHub Actions on push to `supabase/functions/**`

### Running Tests

```bash
# E2E tests (requires dev server running)
npm run test

# Unit tests
npm run test:unit

# With coverage
npm run test:unit:coverage
```

---

## Related Projects (Do NOT Confuse)

| Project | Ref | Purpose |
|---------|-----|---------|
| specificity | `tkkthpoottlqmdopmtuh` | THIS PROJECT |
| supabase-justiceos0930 | `rgrgfcesahcgxpuobbqq` | Different project (JusticeOS) |

---

*Last Updated: December 26, 2025*
