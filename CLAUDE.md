# Specificity Project Configuration

## Supabase Database

| Field | Value |
|-------|-------|
| **Project Name** | `specificity` |
| **Project Ref** | `tkkthpoottlqmdopmtuh` |
| **Region** | `us-east-1` |
| **Organization** | `vercel_icfg_9FDuWsXNcDTafFbuyOkfLzHZ` (mawazawa's projects) |
| **Database Host** | `db.tkkthpoottlqmdopmtuh.supabase.co` |
| **API URL** | `https://tkkthpoottlqmdopmtuh.supabase.co` |
| **PostgreSQL Version** | 17.6.1.063 |
| **Created** | December 20, 2025 |

### Environment Variable Mapping

```bash
VITE_SUPABASE_URL=https://tkkthpoottlqmdopmtuh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRra3RocG9vdHRscW1kb3BtdHVoIi...
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `prompts` | Centralized prompt management with versioning |
| `prompt_versions` | Version history for rollback |
| `prompt_usage` | Usage tracking for analytics |
| `rate_limit` | API rate limiting |
| `specifications` | User-generated specifications |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `multi-agent-spec` | Multi-agent AI pipeline for spec generation |
| `voice-to-text` | Voice transcription service |

### How to Identify This Project

1. **Project ref in JWT**: The anon key contains `"ref":"tkkthpoottlqmdopmtuh"` in its payload
2. **Codebase location**: `/Users/mathieuwauters/Desktop/code/specificity`
3. **Git remote**: Check for `specificity` in repository name
4. **Unique tables**: `prompts`, `prompt_usage`, `prompt_versions`, `rate_limit`, `specifications`

### Related Projects (Do NOT Confuse)

| Project | Ref | Purpose |
|---------|-----|---------|
| supabase-lime-tree | `sbwgkocarqvonkdlitdx` | OLD shared database (deprecated for this project) |
| supabase-justiceos0930 | `rgrgfcesahcgxpuobbqq` | Different project (JusticeOS) |

---

## Verification Protocols (Learned Dec 20, 2025)

### Exa Search Reliability

**Exa MCP is NOT authoritative.** It is a search engine with indexing latency.

| Risk | Mitigation |
|------|------------|
| False negatives for recent content (< 30 days) | Do 3+ query variations before claiming "NOT FOUND" |
| Query too narrow | Try broader terms, exact IDs, provider names separately |
| Indexing delay | Cross-verify with direct source (API docs, official pages) |

**Before marking anything NOT FOUND:**
```
1. Search: "[model] OpenRouter"
2. Search: "[model] site:openrouter.ai"
3. Search: "[provider] latest models December 2025"
4. Direct verify: Check actual OpenRouter/provider page
5. If still not found: "Not found as of [date] - may exist but not indexed"
```

### Document Amendment Protocol

When adding corrections to documents:
1. **Grep first**: Search document for related terms that might contradict new content
2. **Reconcile**: Update or remove old contradictory statements
3. **SUPERSEDES pattern**: Mark old sections with "CORRECTED: See [section]"
4. **Single source of truth**: One authoritative section, not multiple claims

### Completion Claim Verification

**Never mark [x] COMPLETED without artifact verification.**

| Claim Type | Verification Command |
|------------|---------------------|
| File exists | `glob "**/[filename]"` |
| Code contains | `grep "[pattern]" path/to/file` |
| Config value | `read` the actual config file |
| Migration done | Check BOTH source and destination |

### Multi-Agent Cross-Review

After significant document/code updates:
1. Request review from different model architecture (Claude → GPT → Gemini)
2. Prompt: "Find contradictions, false claims, config drift, completion claims without artifacts"
3. Different models have different blind spots - cross-review catches more

**Incident (Dec 20, 2025):** Claude Opus 4.5 missed contradictions that GPT-5.2 Codex caught in PLAN.md review.

---

*Created: December 20, 2025*
*Updated: December 20, 2025 - Added Verification Protocols*
