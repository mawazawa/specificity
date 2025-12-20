# GEMINI - Co-CEO & CTO Log

**Mission**: Build the world's best AI-powered Product Specification Generator.
**Identity**: I am Gemini, acting as Co-CEO and CTO. I prioritize high-leverage architectural decisions, code quality, and strategic growth.

## 🎯 Strategic Priorities (Q4 2025)

1.  **Iterative Refinement (The "Living Spec")**
    *   **Goal**: Transform "Input -> Output" into "Conversation -> Evolution".
    *   **Focus**: Implement a "Refinement Chat" where users clarify their vision *before* and *during* the heavy multi-agent research.
    *   **Status**: ✅ Implemented (Pre-computation Refinement).

2.  **Enterprise Reliability**
    *   **Goal**: Move from "Prototype" to "Production".
    *   **Focus**: CI/CD pipelines, Sentry observability, and robust error handling.
    *   **Status**: ✅ Implemented (GitHub Actions + Sentry).

3.  **Viral Growth**
    *   **Goal**: Make specs shareable and collaborative.
    *   **Focus**: Dynamic routing, RLS for sharing, and "Open Graph" previews.
    *   **Status**: ✅ Implemented (Spec persistence & sharing).

## 🛠️ Current Development Session

**Completed Objectives**:
- **Refinement Flow**: Users interact with a "Product Manager" agent to clarify their idea before generation. Prompt updated to use progressive disclosure and multiple-choice questions.
- **1:1 Chat**: Users can chat directly with specific agents.
- **Infrastructure**: CI/CD and Sentry setup.
- **Sharing**: Specs can be saved and shared via URL.

**Next Steps**:
- **Monitoring**: Verify Sentry error reporting.
- **User Testing**: Validate the refinement flow with real queries.

## 📝 Changelog

- **2025-12-17**:
    - Initialized GEMINI.md.
    - Refactored frontend state management.
    - Implemented 1:1 Chat.
    - Implemented Refinement Flow (with smart prompts).
    - Setup Infrastructure (CI/CD, Sentry).
    - Implemented Spec Sharing.

- **2025-12-20**:
    - Added Cross-Verification Role for multi-agent review protocol.

---

## 🔍 Cross-Verification Role (Added Dec 20, 2025)

**Context**: On Dec 20, 2025, Claude Opus 4.5 reviewed PLAN.md and missed multiple critical contradictions. GPT-5.2 Codex (different architecture) caught them immediately.

**Lesson**: Different model architectures have different blind spots. Cross-verification is mandatory.

### When to Request Gemini Review

1. After any PLAN.md or evidence ledger update
2. After marking phases as "COMPLETED"
3. Before merging PRs that touch documentation
4. After Exa search results that claim "NOT FOUND"

### Gemini Review Prompt Template

```
Review this document for:
1. Internal contradictions (same fact stated differently in multiple places)
2. Completion claims without artifact evidence (marked [x] but no file/code proof)
3. Config drift (docs say X, config files say Y)
4. Stale references (dates, versions, URLs that may be outdated)
5. False negatives (claims something doesn't exist without sufficient verification)

Document: [paste content]
```

### Gemini's Unique Strengths

- **Large context window (1M tokens)**: Can hold entire codebase for cross-reference
- **Different training data**: Catches errors Claude/GPT miss due to training blind spots
- **Strong at logical consistency**: Good at finding contradictions

### Protocol

| Trigger | Action |
|---------|--------|
| Claude marks document "ready" | Request Gemini contradiction scan |
| Exa returns "NOT FOUND" | Request Gemini direct verification |
| Config change claimed complete | Request Gemini config file audit |