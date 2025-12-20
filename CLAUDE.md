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

*Created: December 20, 2025*
