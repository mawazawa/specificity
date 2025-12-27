# Changelog

All notable changes to Specificity will be documented in this file.

## [1.3.1] - 2025-12-27 11:35 UTC

### Database Query Optimization & Indices (Action 13 - 92% confidence)
- **supabase/migrations/20251227112832_add_performance_indices.sql** - Performance indices
- `idx_specifications_user_created` - Composite index for user spec listing
- `idx_specifications_public` - Partial index for public specs
- `idx_profiles_stripe_customer_id` - Stripe webhook customer lookups
- `idx_profiles_stripe_subscription_id` - Subscription queries
- `idx_profiles_plan` - Plan-based user filtering
- `idx_profiles_email` - Email lookup queries
- **src/lib/query-performance.ts** - Query performance monitoring utility
- `withQueryMetrics()` - Wrap queries with performance tracking
- `trackQuery()` - Decorator for class methods
- `RECOMMENDED_INDICES` - Documented index recommendations

### Product Analytics & User Tracking (Action 14 - 90% confidence)
- **src/lib/analytics.ts** - Privacy-respecting analytics module
- `identify()` - User identification with traits
- `track()` - Event tracking with Sentry integration
- `trackPageView()` / `trackFeature()` / `trackSpecFlow()` - Specialized trackers
- `trackConversion()` - Conversion event tracking
- `AnalyticsEvents` - Pre-defined event constants
- Respects `navigator.doNotTrack` preference
- Session ID management with sessionStorage

### Large Component Refactoring (Action 15 - 88% confidence)
- **src/lib/export-utils.ts** - Extracted export utilities from SpecOutput
- `downloadBlob()` - Generic blob download utility
- `generateFilename()` - Timestamped filename generator
- `copyToClipboard()` - Clipboard utility with toast feedback
- `DEFAULT_TECH_STACK` - Extracted default tech stack data
- `SUGGESTED_REFINEMENTS` - Extracted refinement suggestions
- `loadPdfLibraries()` / `loadDocxLibraries()` - Lazy loaders

### Quality Metrics
- TypeScript: 0 errors
- ESLint: 0 errors (warnings expected)
- Unit Tests: **238 passing tests** (10 new)
- Phase 2 Progress: 8/10 actions complete

---

## [1.3.0] - 2025-12-27 11:25 UTC

### Dependency Updates & Maintenance (Action 11 - 96% confidence)
- Updated all 27 @radix-ui packages to latest versions
- Updated @eslint/js 9.32.0 → 9.39.2
- Updated @playwright/test 1.56.1 → 1.57.0
- Updated @sentry/react 10.31.0 → 10.32.1
- Updated @supabase/supabase-js 2.75.1 → 2.89.0
- Updated @tailwindcss/typography 0.5.16 → 0.5.19
- Updated @tanstack/react-query 5.83.0 → 5.90.12
- Updated autoprefixer 10.4.21 → 10.4.23
- **.npmrc** - Added strict version pinning and engine-strict mode
- **.github/dependabot.yml** - Automated dependency update configuration

### Core Web Vitals & Performance Monitoring (Action 12 - 94% confidence)
- **src/lib/web-vitals.ts** - Web Vitals monitoring with Sentry integration
- `initWebVitals()` - Initialize LCP, FID, CLS, FCP, INP, TTFB tracking
- `getRating()` - Classify metrics as good/needs-improvement/poor
- `reportToSentry()` - Report poor metrics as Sentry warnings
- `markPerformance()` / `measurePerformance()` - Custom performance marks
- **main.tsx** - Web Vitals initialization at app startup

### Content Security Policy & Security Headers (Action 16 - 91% confidence)
- **vercel.json** - Added comprehensive security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` - Restricted camera, geolocation, FLoC
  - `Content-Security-Policy` - Allowlist for Supabase, Sentry, OpenRouter, Exa

### Environment Configuration & .env Validation (Action 18 - 89% confidence)
- **.env.example** - Template with all required environment variables
- **src/lib/env-validation.ts** - Runtime environment validation with Zod
- `validateEnv()` - Validate required Supabase config
- `logEnvValidation()` - Development-only validation logging
- `assertEnvValid()` - Throw if env is invalid
- `isDevelopment()` / `isProduction()` / `isDebugEnabled()` helpers

### ESLint & Code Quality Enhancement (Action 20 - 86% confidence)
- **eslint.config.js** - Enhanced with security and quality rules:
  - `no-console` - Warn for non-error console methods
  - `no-eval` / `no-implied-eval` / `no-new-func` - Security rules
  - `max-depth` / `max-nested-callbacks` - Complexity limits
  - `eqeqeq` / `prefer-const` / `prefer-template` - Best practices
  - Production-specific stricter rules
  - Test file relaxed rules

### Quality Metrics
- TypeScript: 0 errors
- ESLint: 2 errors, 351 warnings (mostly console.log statements)
- Unit Tests: **206 passing tests**
- Dependencies: All updated to latest compatible versions

---

## [1.2.1] - 2025-12-27 01:10 UTC

### Error Handling Improvements (Action 7 - 87% confidence)
- **src/lib/errors.ts** - Error categorization utility with user-friendly messages
- `categorizeError()` - Categorizes errors into 10 types (validation, network, timeout, rate_limit, auth, permission, not_found, server, client, unknown)
- `toToastError()` - Converts errors to toast-friendly format
- `logError()` - Structured error logging with context
- `isRetryable()` / `isRecoverable()` - Error recovery helpers
- **SimpleSpecInput.tsx** - FileReader error handling with onerror handler
- **SpecView.tsx** - Category-specific error UI with appropriate icons (WifiOff, Lock, AlertCircle)
- **use-profile.ts** - Enhanced error handling with ProfileError interface
- **useAuth.ts** - getSession error handling with proper error messaging

### API Timeout & Retry Logic (Action 10 - 82% confidence)
- **src/lib/retry.ts** - Retry utility with exponential backoff
- `withRetry()` - Execute async functions with automatic retry on transient failures
- `calculateDelay()` - Exponential backoff with optional jitter
- `isTransientError()` - Detect retryable errors (network, timeout, rate limit, 5xx)
- `withRetryWrapper()` - Create retry-wrapped function variants
- **src/lib/network.ts** - Network status monitoring utilities
- `useNetworkStatus()` - React hook for online/offline detection
- `checkConnectivity()` - Active connectivity check
- `waitForOnline()` - Wait for network recovery
- **API layer** - Automatic retry (2 retries with 2-15s backoff) for transient failures
- **retry.test.ts** - 23 tests for retry logic

### Testing
- **23 new retry tests** for exponential backoff, jitter, abort signals, and error categorization
- Total test count: **206 passing tests**

---

## [1.2.0] - 2025-12-27 00:00 UTC

### Added
- **Turn-End Requirements** in CLAUDE.md for mandatory TODO.md updates at every turn
- **Temporal Metacognition Protocol** - Claude validates documentation recency dynamically
- **TODO.md** with 10 high-leverage actions (129 atomic subtasks)
- **docs/HIGH_LEVERAGE_ACTIONS.md** - Comprehensive roadmap with confidence scores
- Complete file tree documentation in README.md (350+ files)
- Dependency analysis with confidence scores (82-100%)
- Multi-viewpoint analysis (user, developer, business, security, performance)

### Accessibility (Action 3 - 92% confidence)
- **src/lib/a11y.ts** - New accessibility utilities for keyboard navigation
- `getInteractiveProps()` - Adds role, tabIndex, onKeyDown to interactive elements
- `createKeyboardClickHandler()` - Handles Enter/Space key activation
- `prefersReducedMotion()` - Check for reduced motion preference
- SampleSpecGallery cards now keyboard accessible with visible focus rings

### Performance (Action 4 - 90% confidence)
- **AgentCard** memory leak fixed - removed motion values from useEffect deps
- Added cleanup for `mousemove` listener in AgentCard
- **LiveAgentCard** wrapped in `React.memo` to prevent unnecessary re-renders
- Memoized `extractInsights()` and `getTagsFromText()` with useMemo
- Optimized `getTagsFromText()` - single toLowerCase() instead of 6 calls
- Added `loading="lazy"` to avatar images for faster FCP

### Testing (Action 5 - 88% confidence)
- **94 new unit tests** for core hooks and utilities:
  - `use-session.test.ts` - 18 tests for session reducer actions
  - `use-dialogue.test.ts` - 16 tests for dialogue reducer actions
  - `use-tasks.test.ts` - 19 tests for task reducer actions
  - `utils.test.ts` - 21 tests for safeJsonParse and simpleHash
  - `a11y.test.ts` - 20 tests for keyboard accessibility utilities
- Updated `vitest.config.ts` to include `src/**/*.test.ts`
- Total test count: **183 passing tests**

### Input Validation (Action 6 - 94% confidence)
- **src/lib/validation.ts** - Validation utilities with error feedback
- `validateUserInput()` - Spec input validation (25-5000 chars)
- `validateChatMessage()` - Chat message validation (1-2000 chars)
- `validateUrl()` - URL security validation (http/https only)
- `getCharacterCount()` - Character counter with warning state
- **API layer validation** - Input validated before Edge Function calls
- **ChatInput** - Character limit display with warning at 100 remaining
- `validation.test.ts` - 40 tests for validation utilities

### Reduced Motion Support (Action 9 - 90% confidence)
- **src/hooks/use-reduced-motion.ts** - React hook for reduced motion preference
- `useReducedMotion()` - Subscribes to system preference changes
- `getMotionSafeProps()` - Framer Motion props that disable animation
- `reducedMotionVariants` - Pre-built animation variants for common patterns
- **AgentCard** 3D tilt disabled when reduced motion preferred
- **CSS fallbacks** in `src/index.css`:
  - Global animation/transition duration override to 0.01ms
  - Preserves essential spinners for loading states
  - Disables pulse, ping, and hover scale animations

### Security (Action 1 - 98% confidence)
- **sessionDataSchema** with Zod validation for localStorage (`src/types/schemas.ts`)
- **safeJsonParse** utility prevents XSS/corruption (`src/lib/utils.ts`)
- **useSessionPersistence** now validates session data before hydrating
- Toast notification when corrupted session is detected and cleared
- Input validation schemas: userInputSchema, chatMessageSchema, safeUrlSchema
- Tech logo domain whitelist for URL security

### Observability (Action 2 - 95% confidence)
- **Sentry.captureException** in ErrorBoundary.componentDidCatch
- React component stack context attached to all errors
- Error fingerprinting for intelligent deduplication
- Breadcrumbs for error recovery tracking
- eventId display and "Report Issue" button in error UI
- boundaryName prop for multi-boundary error identification

### Changed
- Updated @supabase/supabase-js: 2.75.1 → 2.89.0
- Updated @playwright/test: 1.56.1 → 1.57.0
- README.md now includes dependency decision matrix

### Fixed
- 10 UX bugs affecting user experience (commit 149c7d1):
  - TOAST_REMOVE_DELAY memory leak (1000000ms → 5000ms)
  - HistoryPanel rendering JSON as Markdown
  - SpecView infinite loading on missing ID
  - SpecView error state with no back navigation
  - Delete button missing loading state
  - Specs query missing user filter
  - ProcessViewer returning null when no tasks
  - Voice recording button disabled during recording
  - Resume button race condition
  - Download buttons silent failure

### Security
- RLS policies enabled on prompts tables (commit 6b15115)
- Comprehensive resilience and security improvements (commit 01d1223)

### Quality Metrics
- TypeScript: 0 errors
- ESLint: 0 errors
- Dependencies: All at secure versions
- Bundle: 430KB gzipped

---

## [1.1.1] - 2025-12-23

### Security
- Updated Vite 5.4.21 → 7.3.0 (fixes GHSA-67mh-4wv8-2f99)
- pnpm audit: 0 vulnerabilities

---

## [1.1.0] - 2025-12-23

### Added
- **47 vitest unit tests** covering:
  - Model routing and registry validation (19 tests)
  - Bug fix regression tests (20 tests)
  - Lazy loading pattern tests (8 tests)
- Lazy loading for PDF/DOCX export libraries
- Division-by-zero guards in 4 critical functions
- Null/undefined access guards in synthesis stage
- Rate limiting enabled via RLS on Supabase

### Changed
- **93.5% bundle size reduction** for SpecOutput component (356KB → 23KB)
- PDF vendor chunk now lazy-loaded on demand (585KB)
- DOCX library now lazy-loaded on demand
- Moved early return after hooks in SpecOutput (React rules compliance)

### Fixed
- Division by zero in approval rate calculation (use-spec-flow.ts)
- Division by zero in research depth weighting (spec.ts)
- Division by zero in average risk score calculation (challenge.ts)
- Null/undefined access in debate resolution (synthesis.ts)
- Type coercion bug in vote approval boolean check (VotingPanel.tsx)
- askedBy → requiredExpertise field mapping (Index.tsx)
- ESLint @typescript-eslint/no-explicit-any errors (42 → 0)
- React hooks rules of hooks violation in SpecOutput
- File naming convention (markdownComponents → MarkdownComponents)

### Quality Metrics
- TypeScript: 0 errors
- ESLint: 0 errors
- Tests: 47 passing
- Build: successful

---

## [1.0.0] - 2025-12-20

### Added
- Initial multi-agent specification generation system
- 8-stage AI pipeline (Question → Research → Challenge → Synthesis → Review → Vote → Spec → Share)
- 7 AI experts (Elon, Steve, Oprah, Zaha, Jony, Bartlett, Amal)
- Model registry with verified December 2025 models
- Supabase integration for persistence
- Centralized prompt management system
- Voice-to-text input support
- PDF/DOCX/Markdown export capabilities
- Interactive tech stack recommendations

### Architecture
- React 18 + TypeScript + Vite
- Supabase (Auth, Database, Edge Functions)
- OpenRouter for AI model routing
- Framer Motion for animations
- Radix UI components
