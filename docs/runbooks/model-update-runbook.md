# Model Update Runbook

## Purpose

This runbook documents the steps to safely add, replace, or remove AI models from the Specificity pipeline.
Following this process ensures models are verified, tested, and deployed consistently.

## Pre-Flight Checklist

Before making any model changes:

- [ ] Verify model availability on provider (OpenRouter, Groq, direct API)
- [ ] Confirm pricing and context window from official sources
- [ ] Check for any breaking changes in API format
- [ ] Ensure fallback models are still available

## Step 1: Verify Model Availability

### Required Information

Collect the following for each new model:

| Field | Example | Source |
|-------|---------|--------|
| Provider | `openai` | API documentation |
| Model ID | `gpt-5.2` | OpenRouter model page |
| Context Window | `400000` | Model specs |
| Input Cost ($/1M) | `1.75` | Pricing page |
| Output Cost ($/1M) | `14.00` | Pricing page |
| Release Date | `Dec 10, 2025` | Announcement |

### Verification Methods

1. **OpenRouter**: Check https://openrouter.ai/models for model availability
2. **Groq**: Check https://console.groq.com/docs/models
3. **Direct APIs**: Check provider documentation

### Document Verification

Update `docs/reports/model-evidence-ledger-2025-12-19.md` with:
- Source URLs
- Verification date
- Any limitations or notes

## Step 2: Update Model Registry

### File: `supabase/functions/lib/openrouter-client.ts`

Add/update the model in the `MODELS` constant:

```typescript
export const MODELS: Record<string, ModelConfig> = {
  // ... existing models
  'new-model-id': {
    provider: 'provider-name',
    model: 'actual-api-model-id',
    costPer1MTokensInput: 1.75,
    costPer1MTokensOutput: 14.00,
    contextWindow: 400000,
    speed: 'medium', // 'fast' | 'medium' | 'slow'
  },
};
```

### Checklist

- [ ] Model ID follows naming convention (`provider-model-variant`)
- [ ] Pricing is in dollars per 1M tokens
- [ ] Context window is in tokens
- [ ] Speed rating is accurate

## Step 3: Update Expert Routing (if applicable)

### File: `supabase/functions/lib/expert-matcher.ts`

If the model should be assigned to specific experts:

```typescript
const EXPERT_MODEL_MAP: Record<string, string> = {
  'elon': 'gpt-5.2-codex',    // Technical experts
  'steve': 'claude-opus-4.5', // Design experts
  // ... add/update as needed
};
```

### Considerations

- Technical experts → Reasoning-heavy models (GPT-5.2, Claude)
- Design experts → Creative models (Claude)
- Business experts → Fast models (Gemini Flash)

## Step 4: Update Stage Routing (if applicable)

### Files to Update

| Stage | File | Function |
|-------|------|----------|
| Questions | `stages/questions.ts` | `handleQuestionsStage` |
| Research | `stages/research.ts` | Uses expert routing |
| Challenge | `stages/challenge.ts` | `handleChallengeStage` |
| Synthesis | `stages/synthesis.ts` | Uses Groq |
| Review | `stages/review.ts` | `handleReviewStage` |
| Voting | `stages/voting.ts` | Uses Groq |
| Spec | `stages/spec.ts` | Uses Groq |
| Chat | `stages/chat.ts` | `handleChatStage` |

### For Groq Models

Update `supabase/functions/multi-agent-spec/lib/utils/api.ts`:

```typescript
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
```

## Step 5: Update Prompt Metadata (if applicable)

### File: `supabase/migrations/YYYYMMDD_update_model_references.sql`

Create a migration to update prompt metadata:

```sql
UPDATE prompts
SET metadata = jsonb_set(
    metadata,
    '{recommended_model}',
    '"new-model-id"'
)
WHERE name IN ('prompt_name_1', 'prompt_name_2');
```

### Apply Migration

```bash
supabase db push
# or via MCP
mcp__supabase__apply_migration(...)
```

## Step 6: Update Tests

### File: `tests/model-routing.spec.ts`

1. Add new model to `VERIFIED_MODELS`
2. Update `EXPERT_MODEL_MAP` if changed
3. Update `STAGE_MODEL_MAP` if changed
4. Run tests: `npm test tests/model-routing.spec.ts`

### Expected Test Coverage

- [ ] Model exists in registry
- [ ] Provider mapping is correct
- [ ] Pricing is valid
- [ ] Context window is valid
- [ ] Fallback chains are complete

## Step 7: Update Documentation

### Files to Update

1. `docs/reports/model-evidence-ledger-2025-12-19.md` - Add verification
2. `docs/reports/ai-stack-update-dec-2025.md` - Update stack table
3. `PLAN.md` - Note the change if significant

### Checklist

- [ ] Evidence ledger has source URLs
- [ ] AI stack doc reflects new routing
- [ ] Cost tables are updated

## Step 8: Deploy and Verify

### Local Testing

```bash
# Run smoke test
npx tsx scripts/smoke-test-pipeline.ts --stage questions

# Run model routing tests
npm test tests/model-routing.spec.ts
```

### Staging Deployment

```bash
# Deploy edge functions
supabase functions deploy multi-agent-spec

# Verify with live test
npx tsx scripts/smoke-test-pipeline.ts
```

### Production Deployment

1. Deploy via Vercel/Supabase dashboard
2. Monitor logs for errors
3. Check cost tracking for unexpected spikes

## Rollback Procedure

If issues are detected after deployment:

1. **Immediate**: Revert `openrouter-client.ts` to previous commit
2. **Deploy**: `supabase functions deploy multi-agent-spec`
3. **Document**: Add note to evidence ledger about failure

### Quick Rollback Command

```bash
git revert HEAD --no-edit
supabase functions deploy multi-agent-spec
```

## Common Issues

### Model Not Found on OpenRouter

- Check exact model ID (case-sensitive)
- Verify model is enabled for your account
- Check if model requires special access

### Pricing Mismatch

- Pricing can change; verify before each update
- Use official pricing page, not third-party sources

### Context Window Limits

- Some models have different limits per tier
- Verify with actual API call if unsure

### Rate Limits

- New models may have different rate limits
- Update retry logic if needed

## Appendix: Model Naming Convention

```
{provider}-{model-family}-{variant}

Examples:
- gpt-5.2-codex
- claude-opus-4.5
- gemini-3-flash
- groq-llama-3.3-70b
```

---

*Last Updated: December 21, 2025*
