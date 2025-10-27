# Production Deployment Checklist

## Status: ⚠️ Ready for Manual Deployment

---

## 1. ✅ Pre-Deployment Requirements

### Environment Secrets Required

Set these in **Supabase Dashboard → Settings → Edge Functions → Secrets**:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx    # From https://console.groq.com
EXA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx      # From https://exa.ai
```

### Automatic Environment Variables

These are injected automatically by Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

---

## 2. 🚀 Deployment Options

### Option A: GitHub Actions (Automated) ✅ CONFIGURED

**Setup:**
1. Get Supabase Access Token: https://supabase.com/dashboard/account/tokens
2. Add to GitHub Secrets: `Settings → Secrets → Actions → New secret`
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: Your token
3. Push to main branch or trigger workflow manually

**Triggers:**
- Push to `main` branch with changes in `supabase/functions/`
- Manual trigger via GitHub Actions UI

**Files:**
- `.github/workflows/deploy-functions.yml`

---

### Option B: Manual CLI Deployment

**Prerequisites:**
```bash
# Login to Supabase (one-time)
supabase login

# Or set access token
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

**Deploy:**
```bash
cd /Users/mathieuwauters/Desktop/code/multi-agent-warp-spec

# Deploy all functions
supabase functions deploy multi-agent-spec --project-ref kxrdxiznaudatxyfrbxe --use-api
supabase functions deploy voice-to-text --project-ref kxrdxiznaudatxyfrbxe --use-api
```

**Or use the deploy script:**
```bash
/tmp/deploy-edge-functions.sh
```

---

### Option C: Supabase Dashboard (UI)

1. Go to: https://supabase.com/dashboard/project/kxrdxiznaudatxyfrbxe/functions
2. Click "Deploy a new function"
3. Upload function code manually
4. Configure environment variables

---

## 3. 🔍 Post-Deployment Verification

### Test Edge Functions

**multi-agent-spec:**
```bash
curl --request POST \
  'https://kxrdxiznaudatxyfrbxe.supabase.co/functions/v1/multi-agent-spec' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "stage": "discussion",
    "userInput": "AI-powered task manager",
    "discussionTurns": 8
  }'
```

Expected: JSON response with dialogue array

**voice-to-text:**
```bash
curl --request POST \
  'https://kxrdxiznaudatxyfrbxe.supabase.co/functions/v1/voice-to-text' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "audio": "base64_encoded_audio"
  }'
```

Expected: JSON response with transcribed text

---

### Verify Spec Output Quality

**Required Sections:**
- ✅ Executive Summary
- ✅ Core Requirements
- ✅ Technical Architecture
- ✅ Implementation Phases
- ✅ Dependencies & Stack
- ✅ Risk Analysis
- ✅ Success Metrics

**Quality Checks:**
1. **Length:** Spec should be > 1000 characters
2. **Structure:** All sections present with markdown formatting
3. **Consensus:** `consensusScore` > 0.6 indicates strong agreement
4. **Approval:** `approvedBy` array shows which agents voted yes

**Test with Frontend:**
```bash
# Start dev server
npm run dev

# Click "Test Workflow" button (bottom-right, dev mode only)
# Verify full spec generation completes
```

---

## 4. 📊 Monitoring & Logs

### View Function Logs

**Dashboard:**
https://supabase.com/dashboard/project/kxrdxiznaudatxyfrbxe/functions

**CLI:**
```bash
supabase functions logs multi-agent-spec --project-ref kxrdxiznaudatxyfrbxe
supabase functions logs voice-to-text --project-ref kxrdxiznaudatxyfrbxe
```

### Key Metrics to Monitor

- **Response time:** Target < 30s for full workflow
- **Error rate:** Should be < 1%
- **Rate limits:** 5 requests/hour per user
- **Token usage:** Track via GROQ dashboard

---

## 5. 🔐 Security Checklist

- [x] JWT verification enabled (`verify_jwt: true` in config.toml)
- [x] CORS headers configured
- [x] Input validation (Zod schemas)
- [x] Prompt injection detection
- [x] Rate limiting (database-backed)
- [x] Environment variable validation
- [x] Error handling (no sensitive data leaked)

---

## 6. 🚨 Rollback Plan

**If deployment fails:**

1. **Check logs:**
   ```bash
   supabase functions logs multi-agent-spec --project-ref kxrdxiznaudatxyfrbxe
   ```

2. **Redeploy previous version:**
   ```bash
   git checkout main~1  # Go back one commit
   supabase functions deploy multi-agent-spec --project-ref kxrdxiznaudatxyfrbxe --use-api
   ```

3. **Or disable function:**
   - Supabase Dashboard → Functions → multi-agent-spec → Disable

---

## 7. ✅ Production Readiness

### Code Quality
- ✅ TypeScript: 0 errors
- ✅ Build: Passing (11.11s)
- ✅ Bundle: 430KB gzipped
- ✅ Linter: 0 errors

### Edge Functions
- ✅ Input validation (Zod)
- ✅ Error boundaries
- ✅ Rate limiting
- ✅ CORS configured
- ✅ Environment validation

### Frontend
- ✅ Animations: Spring physics
- ✅ Glass-morphism: Applied
- ✅ Workflow test: Implemented
- ✅ Loading states: Complete

---

## 8. 📝 Next Steps

1. **Deploy Edge Functions:**
   - Set `GROQ_API_KEY` and `EXA_API_KEY` secrets in Supabase Dashboard
   - Run deployment (Option A, B, or C above)

2. **Test Production:**
   - Use test button in dev mode
   - Verify spec quality
   - Check logs for errors

3. **Monitor:**
   - Watch function logs
   - Track error rates
   - Monitor response times

4. **Document:**
   - Update README with production URL
   - Add API documentation
   - Create user guide

---

## Contact

- **Project:** https://github.com/mawazawa/specificity
- **Supabase Project:** kxrdxiznaudatxyfrbxe
- **Dashboard:** https://supabase.com/dashboard/project/kxrdxiznaudatxyfrbxe

---

**Last Updated:** 2025-10-27
**Status:** Ready for deployment (pending secrets configuration)

