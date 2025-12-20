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
| supabase-lime-tree | `tkkthpoottlqmdopmtuh` | OLD shared database (deprecated for this project) |
| supabase-justiceos0930 | `rgrgfcesahcgxpuobbqq` | Different project (JusticeOS) |

---

## Verification Protocols (Learned Dec 20, 2025)

### Exa Usage Discipline

**Exa works. The problem is when Claude doesn't use it properly.**

| Failure Mode | Reality |
|--------------|---------|
| "Exa returned no results" | You did a lazy single query and gave up |
| "NOT FOUND on any provider" | You didn't actually check the provider |
| "Indexing delay" | Excuse for not trying harder |

**Dec 19 2025 Incident:** Single lazy query for deepseek-v3.2-speciale, no results, declared "NOT FOUND". Dec 20: Used Exa properly, found it immediately. **This was Claude's failure, not Exa's.**

**Before ANY negative claim:**
```
1. Search: "[exact term]"
2. Search: "[broader term] [provider]"
3. Search: "[provider] latest [category] 2025"
4. ACTUALLY CHECK the provider's page directly
5. If still nothing: "I could not find this" NOT "This does not exist"
```

**The tool is not the problem. Lazy usage is the problem.**

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
