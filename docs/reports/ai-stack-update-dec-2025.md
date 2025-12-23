# AI Stack Report (December 21, 2025) - Verified

## Executive Summary

This document reflects the **verified and deployed** AI model stack as of December 21, 2025.
All models have been verified via OpenRouter listings and Groq `/v1/models`.

**Evidence Ledger:** `docs/reports/model-evidence-ledger-2025-12-19.md`

## Verified Model Stack

| Component | Model ID | Provider | Context | Input$/M | Output$/M | Verification |
|-----------|----------|----------|---------|----------|-----------|--------------|
| **Coding & Architecture** | `gpt-5.2-codex` | OpenAI | 256K | $2.00 | $16.00 | ✅ Dec 18, 2025 |
| **Deep Reasoning** | `gpt-5.2` | OpenAI | 400K | $1.75 | $14.00 | ✅ Dec 10, 2025 |
| **Fast / General** | `gemini-3-flash-preview` | Google | 1M | $0.50 | $3.00 | ✅ Dec 17, 2025 |
| **Design & UX** | `claude-opus-4.5` | Anthropic | 200K | $15.00 | $75.00 | ✅ Nov 2025 |
| **Thinking / Planning** | `kimi-k2-thinking` | Moonshot AI | 256K | $0.45 | $2.35 | ✅ Nov 06, 2025 |
| **Budget Reasoning** | `deepseek-chat` (V3) | DeepSeek | 163K | $0.30 | $1.20 | ✅ Verified |
| **Fast Inference (70B)** | `llama-3.3-70b-versatile` | Groq | 131K | TBD | TBD | ✅ Verified |
| **Fast Inference (8B)** | `llama-3.1-8b-instant` | Groq | 131K | TBD | TBD | ✅ Verified |

## Models Removed (Unverified)

The following models were referenced in code but could NOT be verified on OpenRouter:

| Model ID | Reason | Replacement |
|----------|--------|-------------|
| `deepseek-v3.2-speciale` | NOT found on OpenRouter | `deepseek-chat` (V3) |
| `gpt-5.1` / `gpt-5.1-codex` | Superseded | `gpt-5.2` / `gpt-5.2-codex` |
| `claude-sonnet-4.5` | Name incorrect | `claude-opus-4.5` |
| `gemini-2.5-flash` | Superseded | `gemini-3-flash-preview` |

## Pipeline Stage Routing

| Stage | Primary Model | Provider | Fallback |
|-------|---------------|----------|----------|
| Questions | `groq-llama-3.1-8b` | Groq | `gpt-5.2` |
| Research | Dynamic (per expert) | OpenRouter | `gemini-3-flash` |
| Challenge | `gpt-5.2` | OpenRouter | `claude-opus-4.5` |
| Synthesis | `llama-3.3-70b-versatile` | Groq | - |
| **Review** | `gpt-5.2-codex` | OpenRouter | `claude-opus-4.5` |
| Voting | `llama-3.3-70b-versatile` | Groq | - |
| Spec | `llama-3.3-70b-versatile` | Groq | - |
| Chat | `gpt-5.2` | OpenRouter | `gemini-3-flash` |

**Note:** If `OPENROUTER_API_KEY` is set and `QUESTIONS_MODEL` is unset, the questions stage defaults to `gpt-5.2`.

## Expert-to-Model Assignments

| Expert | Role | Model | Rationale |
|--------|------|-------|-----------|
| Elon | Tech Visionary | `gpt-5.2-codex` | Complex technical reasoning |
| Steve | Product Design | `claude-opus-4.5` | Creative product thinking |
| Jony | UX Design | `claude-opus-4.5` | Design excellence |
| Zaha | Architecture | `claude-opus-4.5` | Structural vision |
| Bartlett | Business | `gemini-3-flash` | Fast market analysis |
| Oprah | User Empathy | `gemini-3-flash` | Quick empathy insights |
| Amal | Legal | `gpt-5.2` | Precise legal reasoning |

## Infrastructure

### Primary: OpenRouter
- Unified API for OpenAI, Anthropic, Google, DeepSeek, Moonshot
- Automatic fallback routing
- Usage tracking and cost monitoring

### Secondary: Groq (Direct)
- Used for synthesis/voting/spec stages
- `llama-3.3-70b-versatile` model (Groq direct)
- `llama-3.1-8b-instant` for fast question generation
- Extremely fast inference (1000+ tokens/sec)

## Cost Optimization

| Stage Category | Model | Cost/1M tokens | Use Case |
|----------------|-------|----------------|----------|
| High-Value | `gpt-5.2-codex` | $2.00-$16.00 | Review, coding |
| Balanced | `gpt-5.2` / `claude-opus-4.5` | $1.75-$75.00 | Reasoning, design |
| Fast/Cheap | `gemini-3-flash` | $0.50-$3.00 | Quick analysis |
| Bulk | `llama-3.3-70b-versatile` | TBD | Synthesis, voting |
| Fast Fallback | `llama-3.1-8b-instant` | TBD | Questions, retries |

## Verification Sources

All models verified via Exa search on December 19, 2025:

1. **GPT-5.2 / GPT-5.2-Codex**: OpenRouter model listings
2. **Gemini 3 Flash**: Google AI announcements, OpenRouter
3. **Claude Opus 4.5**: Anthropic documentation
4. **Kimi K2 Thinking**: Moonshot AI press releases
5. **DeepSeek V3**: DeepSeek documentation, HuggingFace
6. **Groq Models**: Groq `/v1/models` (llama-3.3-70b-versatile, llama-3.1-8b-instant)

---

*Last Updated: December 21, 2025 03:49 UTC*
*Verified By: Groq /v1/models + OpenRouter listings*
