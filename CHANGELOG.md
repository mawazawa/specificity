# Changelog

All notable changes to the Specificity AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phases 7-11 atomic implementation plan with 100+ sub-tasks mapped to success criteria
- Comprehensive bug tracking for 10 verified issues
- Governance updates: deterministic eval rubrics and dataset-driven expectations
- Root hygiene: archived legacy docs into `docs/archive/`

### Changed
- Clarified DeepSeek v3.2 as an alias of `deepseek-v3` (no separate OpenRouter model)
- Synced eval datasets with production section headings

### Fixed
- Corrected inaccurate model availability claims in CHANGELOG
- Fixed spec persistence by explicitly setting `user_id` on inserts

### Documentation
- Evidence Ledger updated with Dec 20, 2025 re-verification results
- Added verification audit trail entries for all new findings
- Documented package manager distinction (pnpm for frontend, npm: for Deno)

---

## [0.2.0] - 2025-12-20

### Changed - BREAKING
- **Database Migration**: Migrated from shared database to dedicated Supabase project
  - **Old**: `supabase-lime-tree` / `tkkthpoottlqmdopmtuh` (DEPRECATED)
  - **New**: `specificity` / `tkkthpoottlqmdopmtuh` (DEDICATED)
  - Reason: Old database contained 85+ tables from multiple unrelated projects (JusticeOS, Tabboo, Email/CRM systems)

### Added
- New dedicated Supabase project `specificity` with clean schema
- Applied all migrations to new database:
  - `create_updated_at_function` - Timestamp automation
  - `create_prompts_table` - AI prompt management with versioning
  - `add_rate_limiting` - Rate limit RPC function and tracking table
  - `create_specifications_table` - User specifications with RLS policies
  - `seed_prompts` - 14 prompts with verified Dec 2025 model references
- Updated environment variables in `.env` for new database
- Updated Vercel production environment with new credentials
- Deployed all edge functions to new Supabase project
- Added project configuration documentation in `CLAUDE.md`
- Created Memory MCP entity `Specificity-Supabase-Project` for AI context

### Fixed
- Eliminated database namespace collisions with other projects
- Clean slate for RLS policies without legacy permission conflicts

### Security
- Fresh database with no inherited access patterns from other projects
- RLS policies applied from scratch with correct `WITH CHECK` clauses

---

## [0.1.0] - 2025-12-19

### Added
- **Phase 0-6 Complete**: Model verification and integration plan executed
- Model Evidence Ledger with Exa-verified sources (Dec 19, 2025)
- Centralized model registry in `openrouter-client.ts`
- Review stage with GPT-5.2 Codex for quality gate
- Citation analysis in review stage
- Model disagreement escalation protocol using Claude-Opus-4.5
- Pipeline smoke test script (`scripts/smoke-test-pipeline.ts`)
- Structured logging with request IDs, model IDs, and latency
- Model routing regression tests (17 test cases)
- Model update runbook (`docs/runbooks/model-update-runbook.md`)

### Changed
- Standardized on verified Dec 2025 models:
  - `gpt-5.2` (OpenRouter) - General tasks
  - `gpt-5.2-codex` (OpenRouter) - Code review
  - `claude-opus-4.5` (OpenRouter/Anthropic) - Synthesis and escalation
  - `gemini-3-flash` (OpenRouter/Google) - Fast inference
  - `llama-3.3-70b-versatile` (Groq) - Synthesis/voting/spec
  - `llama-3.1-8b-instant` (Groq) - Fast fallback/questions
  - `kimi-k2-thinking` (OpenRouter) - Reasoning tasks
- Updated all hardcoded model IDs to use registry constants
- Normalized Groq vs OpenRouter usage patterns
- UI model labels now driven by backend metadata

### Removed
- `deepseek-v3.2-speciale` - Not found on any provider
- Legacy model references: `gpt-5.1`, `claude-sonnet-4.5`, `gemini-2.5-flash`

### Fixed
- Deno config added for edge function imports
- JSON parsing hardened with `safeJsonParse` utility
- Rate limiting RPC signature validated

### Documentation
- AI stack docs updated with verified model information
- Evidence ledger created with source URLs and verification dates

---

## Model Reference (Verified Dec 19-20, 2025)

| Model ID | Provider | Context | Cost (in/out per 1M) |
|----------|----------|---------|---------------------|
| `gpt-5.2` | OpenRouter | 400K | $1.75 / $14.00 |
| `gpt-5.2-codex` | OpenRouter | 400K | $2.00 / $16.00 |
| `claude-opus-4.5` | OpenRouter | 200K | $15.00 / $75.00 |
| `gemini-3-flash` | OpenRouter | 1M | $0.50 / $3.00 |
| `llama-3.3-70b-versatile` | Groq | 131K | TBD |
| `llama-3.1-8b-instant` | Groq | 131K | TBD |
| `kimi-k2-thinking` | OpenRouter | 256K | $0.45 / $2.35 |
| `deepseek-chat` (V3) | OpenRouter | 163K | $0.30 / $1.20 |

---

## Database Reference

| Environment | Project Name | Project Ref | Status |
|-------------|--------------|-------------|--------|
| Production | `specificity` | `tkkthpoottlqmdopmtuh` | ACTIVE |
| Legacy | `supabase-lime-tree` | `tkkthpoottlqmdopmtuh` | DEPRECATED |

---

[Unreleased]: https://github.com/user/specificity/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/user/specificity/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/user/specificity/releases/tag/v0.1.0
