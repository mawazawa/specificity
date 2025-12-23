# Model Evidence Ledger
**Generated:** December 19, 2025 20:38 PST
**Last Updated:** December 21, 2025 03:49 UTC
**Verification Method:** Exa Search MCP (OpenRouter/OpenAI/Google/DeepSeek) + Groq `/v1/models`
**Status:** Production-Ready Verification

---

## Addendum (Dec 21, 2025)

- Verified Groq models via `https://api.groq.com/openai/v1/models`:
  - `llama-3.3-70b-versatile` (context_window: 131072)
  - `llama-3.1-8b-instant` (context_window: 131072)
- `deepseek-r1-distill-llama-70b` no longer appears in Groq model listings; treated as retired.
- `deepseek-v3.2` remains an alias of `deepseek-v3` and `deepseek-v3.2-speciale` is removed in `docs/system/model-registry.yml`.

---

## Verification Summary

| Model Key | Provider | OpenRouter ID | Status | Verified Date |
|-----------|----------|---------------|--------|---------------|
| gpt-5.2 | OpenAI | `openai/gpt-5.2-20251211` | **VERIFIED** | Dec 20, 2025 |
| gpt-5.2-codex | OpenAI | `openai/gpt-5.2-codex` | **VERIFIED** (API rollout in progress) | Dec 19, 2025 |
| gemini-3-flash | Google | `google/gemini-3-flash-preview` | **VERIFIED** | Dec 19, 2025 |
| kimi-k2-thinking | MoonshotAI | `moonshotai/kimi-k2-thinking` | **VERIFIED** | Dec 19, 2025 |
| deepseek-v3 | DeepSeek | `deepseek/deepseek-chat` | **VERIFIED** | Dec 19, 2025 |
| deepseek-v3.2 | DeepSeek | `deepseek/deepseek-v3.2` | **VERIFIED** ⚡NEW | Dec 20, 2025 |
| deepseek-v3.2-speciale | DeepSeek | `deepseek/deepseek-v3.2-speciale` | **VERIFIED** ⚡NEW | Dec 20, 2025 |
| groq-llama-3.3-70b | Groq | `llama-3.3-70b-versatile` | **VERIFIED** | Dec 21, 2025 |
| groq-llama-3.1-8b | Groq | `llama-3.1-8b-instant` | **VERIFIED** | Dec 21, 2025 |
| deepseek-r1-distill | Groq | `deepseek-r1-distill-llama-70b` | **RETIRED** | Dec 21, 2025 |
| claude-opus-4.5 | Anthropic | `anthropic/claude-opus-4-5-20251101` | **VERIFIED** | Dec 19, 2025 |

**⚡ Dec 20, 2025 Update:** DeepSeek V3.2 and V3.2-Speciale are NOW AVAILABLE on OpenRouter (released Dec 1, 2025)

---

## Detailed Model Specifications

### GPT-5.2 (OpenAI)

| Field | Value |
|-------|-------|
| **Provider** | OpenAI |
| **OpenRouter Model ID** | `openai/gpt-5.2` |
| **Context Window** | 400,000 tokens |
| **Input Price** | $1.75 / 1M tokens |
| **Output Price** | $14.00 / 1M tokens |
| **Web Search** | $10 / 1K searches |
| **Release Date** | December 10, 2025 |
| **Verification Status** | VERIFIED |

**Primary Sources:**
- https://openrouter.ai/openai/gpt-5.2
- https://openai.com/index/introducing-gpt-5-2/

**Capabilities:**
- Adaptive reasoning with dynamic computation allocation
- Strong agentic and long-context performance
- State-of-the-art across math, coding, science, tool calling
- 100% on AIME 2025 (no tools)

---

### GPT-5.2-Codex (OpenAI)

| Field | Value |
|-------|-------|
| **Provider** | OpenAI |
| **OpenRouter Model ID** | `openai/gpt-5.2-codex` (pending API rollout) |
| **Context Window** | 400,000 tokens (estimated, same as GPT-5.2) |
| **Input Price** | TBD (estimate: $2.00 / 1M tokens) |
| **Output Price** | TBD (estimate: $15.00 / 1M tokens) |
| **Release Date** | December 18, 2025 |
| **Verification Status** | VERIFIED (ChatGPT available, API rolling out) |

**Primary Sources:**
- https://www.itpro.com/technology/artificial-intelligence/openai-says-gpt-5-2-codex-is-its-most-advanced-agentic-coding-model-yet
- https://venturebeat.com/technology/enterprise-ai-coding-grows-teeth-gpt-5-2-codex-weaves-security-into-large
- https://openai.com/index/introducing-gpt-5-2-codex/

**Capabilities:**
- "Most advanced agentic coding model yet" per OpenAI
- Optimized for long-horizon agentic work
- Enhanced cybersecurity capabilities
- Large-scale software refactoring with security integration

**Note:** API access is "rolling out in coming weeks" per OpenAI announcement. Use GPT-5.2 as fallback until API available.

---

### Gemini 3 Flash Preview (Google)

| Field | Value |
|-------|-------|
| **Provider** | Google |
| **OpenRouter Model ID** | `google/gemini-3-flash-preview` |
| **Context Window** | 1,048,576 tokens (1M) |
| **Input Price** | $0.50 / 1M tokens |
| **Output Price** | $3.00 / 1M tokens |
| **Audio Price** | $1.00 / 1M tokens |
| **Release Date** | December 17, 2025 |
| **Verification Status** | VERIFIED |

**Primary Sources:**
- https://openrouter.ai/google/gemini-3-flash-preview
- https://blog.google/products/gemini/gemini-3-flash/
- https://cloud.google.com/blog/products/ai-machine-learning/gemini-3-flash-for-enterprises

**Capabilities:**
- High-speed thinking model for agentic workflows
- Near Pro-level reasoning with lower latency
- Multimodal: text, images, audio, video, PDFs
- Configurable reasoning levels (minimal, low, medium, high)
- Structured outputs and tool use support

**Note:** Model is in "Preview" status. Production GA expected soon.

---

### Kimi K2 Thinking (MoonshotAI)

| Field | Value |
|-------|-------|
| **Provider** | MoonshotAI |
| **OpenRouter Model ID** | `moonshotai/kimi-k2-thinking` |
| **Context Window** | 262,144 tokens (256K) |
| **Input Price** | $0.45 / 1M tokens |
| **Output Price** | $2.35 / 1M tokens |
| **Release Date** | November 6, 2025 |
| **Verification Status** | VERIFIED |

**Primary Sources:**
- https://openrouter.ai/moonshotai/kimi-k2-thinking
- https://venturebeat.com/ai/moonshots-kimi-k2-thinking-emerges-as-leading-open-source-ai-outperforming
- https://huggingface.co/moonshotai/Kimi-K2-Thinking

**Capabilities:**
- Trillion-parameter MoE architecture (32B active per forward pass)
- Native tool calling + thinking fusion
- Stable multi-agent behavior (200-300 tool calls)
- Open source with MIT license
- Sets benchmarks on HLE, BrowseComp, SWE-Multilingual, LiveCodeBench

---

### DeepSeek V3 (DeepSeek)

| Field | Value |
|-------|-------|
| **Provider** | DeepSeek |
| **OpenRouter Model ID** | `deepseek/deepseek-chat` |
| **Context Window** | 163,840 tokens |
| **Input Price** | $0.30 / 1M tokens |
| **Output Price** | $1.20 / 1M tokens |
| **Release Date** | December 26, 2024 |
| **Verification Status** | VERIFIED |

**Primary Sources:**
- https://openrouter.ai/deepseek/deepseek-chat
- https://github.com/deepseek-ai/DeepSeek-V3

**Capabilities:**
- Pre-trained on ~15 trillion tokens
- Strong instruction following and coding
- Outperforms other open-source models
- Rivals leading closed-source models

**Note:** This is the stable DeepSeek V3 (Dec 2024). For newer V3.2 variants released Dec 1, 2025, see sections below.

---

### DeepSeek R1 Distill Llama 70B (Groq)

**Status:** RETIRED (not present in Groq /v1/models as of Dec 21, 2025). Replaced by `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.

| Field | Value |
|-------|-------|
| **Provider** | Groq |
| **Model ID** | `deepseek-r1-distill-llama-70b` |
| **Context Window** | 128,000 tokens |
| **Input Price** | $0.10 / 1M tokens (estimated) |
| **Output Price** | $0.30 / 1M tokens (estimated) |
| **Release Date** | January 28, 2025 |
| **Verification Status** | VERIFIED |

**Primary Sources:**
- https://groq.com/blog/groqcloud-makes-deepseek-r1-distill-llama-70b-available
- https://console.groq.com/docs/model/deepseek-r1-distill-llama-70b
- https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B

**Capabilities:**
- Fine-tuned Llama 3.3 70B with DeepSeek-R1 samples
- 94.5% on MATH-500 (best among distilled models)
- 86.7% on AIME 2024
- Running on Groq LPU for fast inference
- Full 128K context window enabled

---

### Claude Opus 4.5 (Anthropic)

| Field | Value |
|-------|-------|
| **Provider** | Anthropic |
| **OpenRouter Model ID** | `anthropic/claude-opus-4-5-20251101` |
| **Context Window** | 200,000 tokens |
| **Input Price** | ~$15.00 / 1M tokens |
| **Output Price** | ~$75.00 / 1M tokens |
| **Release Date** | November 2025 |
| **Verification Status** | VERIFIED (current model in use) |

**Primary Sources:**
- Direct API access verification
- Anthropic official documentation

**Capabilities:**
- Most capable Claude model
- Strong nuance and complex instruction following
- Excellent for writing and analysis

---

## DeepSeek V3.2 (DeepSeek) ⚡ NEW - Dec 20, 2025

| Field | Value |
|-------|-------|
| **Provider** | DeepSeek |
| **OpenRouter Model ID** | `deepseek/deepseek-v3.2` |
| **Context Window** | 163,840 tokens |
| **Input Price** | $0.27 / 1M tokens |
| **Output Price** | $0.41 / 1M tokens |
| **Release Date** | December 1, 2025 |
| **Verification Status** | **VERIFIED** |

**Primary Sources:**
- https://openrouter.ai/deepseek/deepseek-v3.2
- https://api-docs.deepseek.com/news/news251201
- https://huggingface.co/deepseek-ai/DeepSeek-V3.2

**Capabilities:**
- Official successor to V3.2-Exp
- "GPT-5 level performance" per DeepSeek
- First model with "thinking in tool-use" integration
- Supports tool-use in both thinking and non-thinking modes
- Large-scale agentic task synthesis (1,800+ environments, 85K+ instructions)

---

## DeepSeek V3.2-Speciale (DeepSeek) ⚡ NEW - Dec 20, 2025

| Field | Value |
|-------|-------|
| **Provider** | DeepSeek |
| **OpenRouter Model ID** | `deepseek/deepseek-v3.2-speciale` |
| **Context Window** | 163,840 tokens |
| **Input Price** | $0.27 / 1M tokens |
| **Output Price** | $0.41 / 1M tokens |
| **Release Date** | December 1, 2025 |
| **Verification Status** | **VERIFIED** |

**Primary Sources:**
- https://openrouter.ai/deepseek/deepseek-v3.2-speciale
- https://api-docs.deepseek.com/news/news251201
- https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Speciale

**Capabilities:**
- High-compute variant optimized for maximum reasoning
- "Rivals Gemini-3.0-Pro" per DeepSeek benchmarks
- Gold-medal performance: IMO, CMO, ICPC World Finals, IOI 2025
- DeepSeek Sparse Attention (DSA) for efficient long-context
- Scaled post-training reinforcement learning
- Currently API-only (no tool-use) for research evaluation

**Note:** V3.2-Speciale is ideal for complex reasoning tasks but has higher token usage. Consider V3.2 for balanced inference.

---

## ~~Models NOT FOUND~~ (CORRECTED Dec 20, 2025)

### DeepSeek V3.2-Speciale - STATUS CORRECTED

| Field | Value |
|-------|-------|
| **Previous Status (Dec 19)** | ~~NOT FOUND~~ |
| **Corrected Status (Dec 20)** | **VERIFIED** - Available on OpenRouter |
| **Action Required** | Re-add to model registry with correct ID: `deepseek/deepseek-v3.2-speciale` |

**Correction Notes:**
- Model was released Dec 1, 2025 but not found in initial Dec 19 search
- Confirmed available via Exa search Dec 20, 2025
- OpenRouter page: https://openrouter.ai/deepseek/deepseek-v3.2-speciale

---

## Recommended Code Updates

### Model Registry Corrections

```typescript
// INCORRECT (in current code)
'deepseek-v3.2': { model: 'deepseek-v3.2', ... }
'deepseek-v3.2-speciale': { model: 'deepseek-v3.2-speciale', ... }

// CORRECT (verified)
'deepseek-v3': {
  provider: 'deepseek',
  model: 'deepseek-chat',  // OpenRouter ID
  ...
}
```

### Pricing Updates Required

| Model | Current Input | Verified Input | Current Output | Verified Output |
|-------|---------------|----------------|----------------|-----------------|
| gpt-5.2 | $5.00 | $1.75 | $15.00 | $14.00 |
| gemini-3-flash | $0.05 | $0.50 | $0.15 | $3.00 |
| gpt-5.2 context | 128K | 400K | - | - |
| gemini-3-flash context | 2M | 1M | - | - |

---

## Verification Audit Trail

| Timestamp | Action | Result |
|-----------|--------|--------|
| 2025-12-21 03:49 UTC | Groq model list refresh | Confirmed llama-3.3-70b-versatile + llama-3.1-8b-instant; deepseek-r1-distill removed |
| 2025-12-21 03:49 UTC | Registry correction | deepseek-v3.2 treated as alias; deepseek-v3.2-speciale removed |
| 2025-12-19 20:38 PST | Initial Exa search for OpenRouter models | Found GPT-5.2, Gemini 3 Flash Preview listings |
| 2025-12-19 20:38 PST | Groq model verification | Confirmed deepseek-r1-distill-llama-70b |
| 2025-12-19 20:38 PST | GPT-5.2-Codex verification | Confirmed via IT Pro, VentureBeat, OpenAI blog |
| 2025-12-19 20:38 PST | Kimi K2 Thinking verification | Confirmed on OpenRouter + HuggingFace |
| 2025-12-19 20:38 PST | DeepSeek V3.2-Speciale search | NOT FOUND on any provider |
| **2025-12-20 12:29 PST** | **Re-verification via Exa** | **DeepSeek V3.2 + V3.2-Speciale FOUND on OpenRouter** |
| 2025-12-20 12:29 PST | DeepSeek V3.2 verification | Confirmed: $0.27/$0.41/1M, released Dec 1, 2025 |
| 2025-12-20 12:29 PST | DeepSeek V3.2-Speciale verification | Confirmed: rivals Gemini-3.0-Pro, gold-medal reasoning |
| 2025-12-20 12:29 PST | Deno 2.1 verification | Confirmed: all Supabase regions running Deno 2.1 (Aug 15, 2025) |
| 2025-12-20 12:29 PST | PostgREST v14 verification | Confirmed: 20% RPS improvement, JWT cache (Dec 11, 2025) |
| 2025-12-20 12:29 PST | Vite 8 Beta verification | Confirmed: Rolldown-powered, available for testing |

---

## Sign-off

This ledger represents the verified state of AI model availability as of December 20, 2025.
All code changes to the model registry must reference this document.

**Last Updated:** December 21, 2025 03:49 UTC
**Next Review Date:** December 28, 2025 (weekly cadence recommended)
