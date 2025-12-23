# Frontend Integration Patch for Enhanced Backend

## Changes Required in src/pages/Index.tsx

### 1. Update Stage Names

**OLD:**
```typescript
{ body: { userInput: input, stage: 'discussion', agentConfigs, userComment, discussionTurns } }
```

**NEW:**
```typescript
{ body: { userInput: input, stage: 'questions', agentConfigs, userComment } }
```

### 2. Update Stage 1 (Questions → Research)

**Replace lines 219-263 with:**

```typescript
// Stage 1: Dynamic Question Generation
round.stage = 'questions';
setCurrentStage(`Round ${roundNumber}: Generating Research Questions`);
toast({
  title: "🧠 AI Question Generation",
  description: "Analyzing your idea to generate targeted research questions..."
});

const questionsStartTime = Date.now();
const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
  'multi-agent-spec',
  { body: { userInput: input, stage: 'questions' } }
);

if (questionsError) {
  console.error('Questions error:', questionsError);
  throw new Error(questionsError.message || 'Failed to generate questions');
}

const questionsDuration = Date.now() - questionsStartTime;

// Store questions in round
round.questions = questionsData.questions || [];

// Add to dialogue
setDialogueEntries(prev => [...prev, {
  agent: 'system',
  message: `Generated ${round.questions.length} research questions:\n\n${round.questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join('\n')}`,
  timestamp: new Date().toISOString(),
  type: 'discussion'
}]);

toast({
  title: "✓ Questions Generated",
  description: `${round.questions.length} research questions in ${(questionsDuration/1000).toFixed(1)}s`
});
```

### 3. Update Stage 2 (Parallel Research with Tools)

**Replace lines 265-297 with:**

```typescript
// Stage 2: Parallel Research with Tools
round.stage = 'research';
setCurrentStage(`Round ${roundNumber}: Parallel Expert Research`);
toast({
  title: "🔬 Deep Research Phase",
  description: "Experts conducting parallel research with multiple tools..."
});

const researchStartTime = Date.now();
const { data: researchData, error: researchError } = await supabase.functions.invoke(
  'multi-agent-spec',
  {
    body: {
      stage: 'research',
      agentConfigs,
      roundData: {
        questions: round.questions,
        roundNumber
      }
    }
  }
);

if (researchError) throw researchError;

const researchDuration = Date.now() - researchStartTime;

// Store research results
round.research = researchData.researchResults || [];
const metadata = researchData.metadata || {};

// Add research summary to dialogue
setDialogueEntries(prev => [...prev, {
  agent: 'system',
  message: `Research complete:\n• ${round.research.length} experts\n• ${metadata.totalToolsUsed || 0} tool calls\n• $${(metadata.totalCost || 0).toFixed(4)} cost\n• ${(researchDuration/1000).toFixed(1)}s duration`,
  timestamp: new Date().toISOString(),
  type: 'discussion'
}]);

// Add individual research findings to dialogue
round.research.forEach((result: any) => {
  setDialogueEntries(prev => [...prev, {
    agent: result.expertId,
    message: `Research findings:\n${result.findings}\n\nTools used: ${result.toolsUsed.map((t: any) => t.tool).join(', ') || 'none'}`,
    timestamp: new Date().toISOString(),
    type: 'discussion'
  }]);
});

addHistoryEntry('output', {
  stage: 'research',
  expertsCount: round.research.length,
  toolsUsed: metadata.totalToolsUsed,
  cost: metadata.totalCost
});

toast({
  title: "✓ Research Complete",
  description: `${round.research.length} experts, ${metadata.totalToolsUsed} tools, $${(metadata.totalCost || 0).toFixed(4)}`
});
```

### 4. Update Stage 3 (Synthesis)

**Replace line 315-316 with:**

```typescript
const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke(
  'multi-agent-spec',
  {
    body: {
      stage: 'synthesis',
      agentConfigs,
      roundData: {
        researchResults: round.research,
        roundNumber
      },
      userComment
    }
  }
);
```

### 5. Update Stage 4 (Voting)

**No changes needed** - voting stage remains compatible

### 6. Update Stage 5 (Spec Generation)

**Replace line 415-417 with:**

```typescript
const { data: specData, error: specError } = await supabase.functions.invoke(
  'multi-agent-spec',
  {
    body: {
      stage: 'spec',
      roundData: {
        syntheses: synthesisData.syntheses,
        votes: round.votes,
        researchResults: round.research
      }
    }
  }
);
```

## Summary of Changes

1. **Stage name change:** 'discussion' → 'questions'
2. **New question generation flow:** AI generates 7 tailored questions
3. **Enhanced research:** Parallel execution with tool usage metrics
4. **Response format changes:**
   - Questions stage returns: `{ questions: [...] }`
   - Research stage returns: `{ researchResults: [...], metadata: {...} }`
   - Each research result includes: `{ expertId, expertName, findings, toolsUsed, cost, duration }`

## Testing Checklist

- [ ] Question generation works and displays properly
- [ ] Research shows parallel execution and tool usage
- [ ] Dialogue entries show all stages correctly
- [ ] Cost metrics displayed in toast notifications
- [ ] Synthesis incorporates research findings
- [ ] Spec generation includes all enhanced data
- [ ] Error handling works at each stage
- [ ] Session persistence works with new format

## Expected User Experience

1. User submits idea
2. "Generating Research Questions..." (2-5s)
3. Shows 7 specific questions generated
4. "Parallel Expert Research..." (10-20s)
5. Shows each expert's findings + tools used + costs
6. "Expert Synthesis..." (5-10s)
7. "Consensus Vote..." (3-5s)
8. "Generating Specification..." (5-10s)
9. Final spec displayed

**Total time:** 25-50s (vs previous 60-120s)
**Research depth:** 20+ tool calls (vs previous 5 Exa queries)
**Cost per spec:** $0.30-0.80 (vs previous $0.10)
