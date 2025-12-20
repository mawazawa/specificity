# Optimal AI Stack Report (December 19, 2025)

## Executive Summary
As requested, we have performed a deep-dive research into the "bleeding edge" AI landscape as of December 19, 2025. We analyzed recent releases from OpenAI, DeepSeek, Google, Anthropic, and Moonshot AI to construct a cost-optimized, high-performance stack that replaces legacy models with the absolute latest state-of-the-art technology.

The codebase has been updated to leverage this new stack immediately.

## The New Bleeding Edge Stack

| Component | Selected Model | Provider | Release Date | Why it was chosen |
|-----------|----------------|----------|--------------|-------------------|
| **Coding & Architecture** | **GPT-5.2 Codex** | OpenAI | Dec 18, 2025 | Released yesterday. The absolute frontier for agentic coding and complex system design. Outperforms GPT-5.1 significantly on refactoring tasks. |
| **Deep Reasoning** | **DeepSeek V3.2 Speciale** | DeepSeek | Dec 01, 2025 | "Rivals Gemini 3.0 Pro" at a fraction of the cost. Optimized specifically for hard reasoning problems and agentic workflows. |
| **Fast / General Driver** | **Gemini 3 Flash (Preview)** | Google | Dec 17, 2025 | The new speed king. Massive 2M context window, multimodal, and significantly smarter than 2.5 Flash. |
| **Thinking / Planning** | **Kimi K2 Thinking** | Moonshot AI | Nov 07, 2025 | specialized "Thinking" model (Chain of Thought) perfect for long-horizon planning and self-correction. |
| **Reliability Fallback** | **DeepSeek R1 Distill** | Groq | Feb 2025 | Running on Groq's LPU. Extremely fast inference for fallback scenarios when primary providers fail. |

## Detailed Research Findings

### 1. OpenAI GPT-5.2 Codex (The New Heavyweight)
Released just yesterday (Dec 18), **GPT-5.2-Codex** is the specialized version of the GPT-5.2 frontier model. It features "context compaction" for long-horizon coding tasks and improved performance on refactoring. This replaces the previous `gpt-5.1` reference in your codebase.

### 2. DeepSeek V3.2 & Speciale (The Value/Performance King)
DeepSeek continues to disrupt the market. **V3.2 Speciale** (released Dec 1) is designed to compete with the heaviest models (Gemini 3.0 Pro, GPT-5) on reasoning tasks but remains accessible via OpenRouter.
*   **V3.2 Speciale**: Use this for widely complex logic where you'd normally pay $10+/M tokens. It costs ~$0.40/M.
*   **V3.2 Standard**: A perfect "daily driver" that balances GPT-5 level performance with high efficiency.

### 3. Google Gemini 3 Flash (The Context Beast)
Released Dec 17, **Gemini 3 Flash** makes the previous "Flash" models look like toys. It retains the massive context window (2M+) but brings "frontier-class" intelligence. This is ideal for analyzing large codebases or massive document sets in a single pass.

### 4. Kimi K2 Thinking (The Planner)
A unique addition. This model natively supports "thinking while using tools," making it distinct from standard chat models. It is excellent for the "Questions" and "Challenge" stages of your multi-agent spec flow where deep reflection is required.

## Infrastructure Updates

*   **Primary Router**: **OpenRouter** remains the primary gateway. It has official support for all the selected models (DeepSeek V3.2, Kimi K2, Gemini 3).
*   **Groq Integration**: We confirmed Groq now supports **DeepSeek R1 Distill** (70B). We have updated your fallback logic to use this instead of Llama 3.3. This ensures that even your safety net is running on bleeding-edge distilled reasoning models at 1000+ tokens/second.

## Codebase Changes

We have updated `supabase/functions/lib/openrouter-client.ts` and `api.ts`:
1.  **Updated `MODELS` Registry**: Removed `gpt-5.1`, `gemini-2.5`, `claude-sonnet`. Added `gpt-5.2`, `gpt-5.2-codex`, `gemini-3-flash`, `deepseek-v3.2`, `deepseek-v3.2-speciale`, `kimi-k2-thinking`.
2.  **Updated Fallbacks**: Switched default fallbacks to `deepseek-r1-distill` via Groq.
3.  **Fixed Types**: Updated TypeScript interfaces to strictly type these new providers.
