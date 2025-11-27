# Environment Setup Guide for Specificity AI

This guide explains how to properly configure your environment variables for both local development and production deployment.

## Required Environment Variables

### Frontend (Vite)

Create a `.env` file in the project root with:

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/settings/api

VITE_SUPABASE_PROJECT_ID="sbwgkocarqvonkdlitdx"
VITE_SUPABASE_URL="https://sbwgkocarqvonkdlitdx.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

### Edge Function (Supabase)

These are set in your Supabase project dashboard:
**Settings → Edge Functions → Secrets**

```bash
# Required
GROQ_API_KEY="gsk_..."           # From https://console.groq.com/keys
EXA_API_KEY="..."                # From https://exa.ai/
SUPABASE_URL="https://sbwgkocarqvonkdlitdx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."  # From Supabase dashboard

# Optional (falls back to Groq if not set)
OPENROUTER_API_KEY="sk-or-v1-..." # From https://openrouter.ai/keys
```

## Getting API Keys

### 1. Groq API Key (Required)
- Visit: https://console.groq.com
- Sign up/login
- Go to API Keys section
- Create a new API key
- Copy the key starting with `gsk_`

### 2. Exa API Key (Required)
- Visit: https://exa.ai/
- Sign up for an account
- Go to your dashboard
- Generate an API key for web search functionality

### 3. OpenRouter API Key (Optional but Recommended)
- Visit: https://openrouter.ai
- Sign up/login
- Go to Keys section
- Create a new API key starting with `sk-or-v1-`
- This enables access to GPT-5.1, Claude Sonnet 4.5, and Gemini 2.5 Flash
- If not set, the system falls back to Groq's Llama 3.3 70B

### 4. Supabase Configuration
- Visit: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/settings/api
- Copy the **Project URL** → `VITE_SUPABASE_URL`
- Copy the **anon public** key → `VITE_SUPABASE_ANON_KEY`
- Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (for edge functions only)

## November 2025 AI Models Used

The system uses the latest models available as of November 2025:

### Via OpenRouter (when OPENROUTER_API_KEY is set):
- **GPT-5.1** (`openai/gpt-5.1`) - Advanced reasoning and meta-cognition
- **GPT-5.1-Codex** (`openai/gpt-5.1-codex`) - Specialized for code and architecture
- **Claude Sonnet 4.5** (`anthropic/claude-sonnet-4-5-20250929`) - Best for coding and nuanced reasoning
- **Gemini 2.5 Flash** (`google/gemini-2.5-flash`) - Fast, multimodal, 1M context window
- **Llama 3.3 70B** (`meta-llama/llama-3.3-70b-versatile`) - Cost-effective fallback

### Fallback (via Groq when OpenRouter unavailable):
- **Llama 3.3 70B Versatile** - Fast, reliable, cost-effective

## Setting Edge Function Secrets

### Using Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx
2. Navigate to **Settings → Edge Functions**
3. Click **Add Secret**
4. Enter each secret name and value
5. Click **Save**

### Using Supabase CLI (if installed):
```bash
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set EXA_API_KEY=...
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
```

## Verification

After setting up environment variables:

1. **Frontend**: Run `npm run dev` - should not throw environment variable errors
2. **Edge Function**: Check logs at https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/logs/edge-functions
3. **Test the workflow**:
   - Sign in to the app
   - Submit a product idea
   - Verify each stage completes successfully:
     - Questions generation
     - Research phase
     - Challenge phase
     - Synthesis
     - Voting
     - Spec generation

## Troubleshooting

### "Missing VITE_SUPABASE_URL environment variable"
- Ensure `.env` file exists in project root
- Check that variable name is exactly `VITE_SUPABASE_URL` (case-sensitive)
- Restart dev server after creating `.env`

### "Service configuration error"
- Check Edge Function secrets in Supabase dashboard
- Verify all required secrets are set: `GROQ_API_KEY`, `EXA_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### "Edge Function returned a non-2xx status code"
- Check edge function logs for detailed error messages
- Verify API keys are valid and not expired
- Ensure sufficient quota/credits on API services

### Rate Limiting
- The system implements rate limiting: 5 requests per hour per user
- If exceeded, wait 1 hour or adjust limits in Supabase database

## Security Best Practices

1. **Never commit `.env` file** - already in `.gitignore`
2. **Never commit API keys** to version control
3. **Use different keys** for development and production
4. **Rotate keys regularly** - especially if exposed
5. **Monitor API usage** to detect unauthorized access
6. **Use service_role key only in edge functions** - never expose to frontend

## Cost Management

### Approximate costs per specification generated:
- **GPT-5.1**: ~$0.20-0.50 per spec
- **Claude Sonnet 4.5**: ~$0.10-0.30 per spec
- **Gemini 2.5 Flash**: ~$0.02-0.05 per spec
- **Llama 3.3 70B (via Groq)**: ~$0.01-0.03 per spec
- **Exa search**: ~$0.05-0.10 per spec

Total typical cost: **$0.50-1.00 per complete specification** (with all features enabled)

## Production Deployment

For production on Vercel or similar:

1. Set environment variables in deployment platform
2. Ensure all Supabase edge function secrets are configured
3. Test authentication flow
4. Monitor edge function logs for errors
5. Set up error tracking (Sentry, etc.)

## Support

If you encounter issues:
1. Check edge function logs: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/logs
2. Verify all environment variables are set correctly
3. Check API service status pages
4. Review this documentation

---

Last updated: November 2025
Project: Specificity AI
Supabase Project ID: sbwgkocarqvonkdlitdx
