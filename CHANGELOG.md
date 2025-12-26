# Changelog

All notable changes to Specificity will be documented in this file.

## [1.2.0] - 2025-12-26 22:45 UTC

### Added
- **Turn-End Requirements** in CLAUDE.md for mandatory TODO.md updates at every turn
- **Temporal Metacognition Protocol** - Claude validates documentation recency dynamically
- **TODO.md** with 10 high-leverage actions (129 atomic subtasks)
- **docs/HIGH_LEVERAGE_ACTIONS.md** - Comprehensive roadmap with confidence scores
- Complete file tree documentation in README.md (350+ files)
- Dependency analysis with confidence scores (82-100%)
- Multi-viewpoint analysis (user, developer, business, security, performance)

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
