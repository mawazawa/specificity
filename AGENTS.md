# Multi-Agent Review Protocol

**Created**: December 20, 2025
**Trigger**: Critical failure incident where Claude Opus 4.5 missed contradictions caught by GPT-5.2 Codex

---

## The Problem: Single-Agent Blind Spots

On December 20, 2025, Claude Opus 4.5 (one of the best coding models available) was asked to review PLAN.md using temporal metacognition, Exa search, and CTO advisory skills.

**Result**: Multiple critical errors were missed:

| Error Type | What Was Missed |
|------------|-----------------|
| Internal contradiction | Phase 0.5 said "removed", Phase 12 said "re-add" |
| Evidence conflict | Line 158 said "NOT FOUND", Line 211 said "VERIFIED" |
| Config drift | supabase/config.toml pointed to deprecated project |
| Exa false negative | Claimed model "NOT FOUND" that was released 18 days prior |

**GPT-5.2 Codex (different architecture) caught all of these in a single review.**

---

## The Solution: Mandatory Multi-Agent Cross-Review

### Agent Strengths by Architecture

| Agent | Best For | Blind Spots |
|-------|----------|-------------|
| **Claude Opus 4.5** | Code generation, nuanced writing, complex reasoning | Can miss internal contradictions in long documents |
| **GPT-5.2 Codex** | Logical consistency, finding contradictions, code review | May over-engineer solutions |
| **Gemini 3 Flash** | Large context analysis (1M tokens), cross-referencing | Speed over depth trade-off |
| **DeepSeek R1** | Mathematical reasoning, cost-effective synthesis | Less strong on nuanced writing |

### When to Invoke Multi-Agent Review

| Trigger | Reviewer | Focus |
|---------|----------|-------|
| PLAN.md updated | GPT-5.2 Codex | Contradictions, false completion claims |
| Evidence Ledger updated | Gemini 3 Flash | Cross-reference against actual codebase |
| Exa returns "NOT FOUND" | Any different agent | Direct source verification |
| Phase marked COMPLETED | GPT-5.2 Codex | Artifact verification |
| Config migration claimed | Gemini 3 Flash | Read all config files, verify values |

---

## Review Prompt Templates

### Contradiction Scan (Post-Document Update)

```
TASK: Review this document for internal contradictions.

SPECIFIC CHECKS:
1. Find any statement X in section A that conflicts with statement Y in section B
2. Find any completion claim [x] without artifact evidence
3. Find any "NOT FOUND" claim that lacks multi-query verification
4. Find any config/migration claim without actual file verification

OUTPUT FORMAT:
| Line | Claim | Contradiction/Issue |
|------|-------|---------------------|
| ... | ... | ... |

DOCUMENT:
[paste content]
```

### Artifact Verification (Post-Completion Claim)

```
TASK: Verify all completion claims in this plan have corresponding artifacts.

FOR EACH "[x] COMPLETED" ITEM:
1. Identify the claimed artifact (file, code pattern, config value)
2. Search for it: glob, grep, or read
3. Report: VERIFIED or MISSING

PLAN:
[paste content]
```

### Exa False Negative Check

```
TASK: The previous agent claimed "[X] NOT FOUND on [provider]".

VERIFY THIS CLAIM:
1. Search for "[X]" with 3 different query formulations
2. Check the provider's official docs/API directly if possible
3. Note the search date and indexing limitations

REPORT:
- Confirmed NOT FOUND (with evidence)
- FALSE NEGATIVE: Actually exists at [URL]
- UNCERTAIN: Cannot verify, recommend manual check
```

---

## Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT UPDATE                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude Opus 4.5: Initial research + drafting               │
│  - Exa search for latest info                               │
│  - Draft updates with temporal markers                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GPT-5.2 Codex: Contradiction + Artifact Scan               │
│  - Find internal contradictions                             │
│  - Verify completion claims have artifacts                  │
│  - Check config drift                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Gemini 3 Flash: Full Context Cross-Reference               │
│  - Load entire codebase (1M context)                        │
│  - Verify all file references exist                         │
│  - Check version/date freshness                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COMMIT ONLY AFTER ALL AGENTS APPROVE                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Memory MCP Entities

The following entities have been created in the Memory MCP to persist these learnings:

- `Exa-Search-Reliability-Protocol`
- `Document-Amendment-Reconciliation-Protocol`
- `Completion-Claim-Artifact-Verification`
- `Multi-Agent-Cross-Review-Protocol`

Query with: `mcp__memory__search_nodes({ query: "verification protocol" })`

---

## Lessons Encoded

1. **Exa works - lazy usage doesn't** - The tool found the model when actually used properly
2. **Document amendments need reconciliation** - Grep for contradictions before adding corrections
3. **Completion claims need artifacts** - Never mark [x] without verification command
4. **Single-agent review is insufficient** - Different architectures catch different errors
5. **Cross-review is mandatory** - Not optional, not "nice to have"
6. **Never blame tools for agent laziness** - If Exa returns nothing, try harder, not give up

---

*This protocol exists because Claude failed - not the tools. Learn from the failure.*
