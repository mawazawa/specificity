import { useState, useCallback, useRef } from 'react';
import { useTasks } from './use-tasks';
import { useDialogue, DialogueEntry } from './use-dialogue';
import { useSession } from './use-session';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AgentConfig, ResumeContext, Round, SessionState } from '@/types/spec';

export type GenerationStage =
  | 'idle'
  | 'refinement'
  | 'questions'
  | 'research'
  | 'challenge'
  | 'synthesis'
  | 'review'
  | 'voting'
  | 'spec'
  | 'complete'
  | 'error';

interface UseSpecFlowProps {
  agentConfigs: AgentConfig[];
}

export function useSpecFlow({ agentConfigs }: UseSpecFlowProps) {
  const { tasks, addTask, updateTask, resetTasks } = useTasks();
  const { entries: dialogueEntries, addEntry: addDialogue, resetDialogue, setDialogue } = useDialogue();
  const {
    sessionState,
    generatedSpec,
    techStack,
    mockupUrl,
    startSession,
    addRound,
    updateCurrentRound,
    addHistory,
    setPaused,
    setGeneratedSpec,
    setTechStack,
    setMockupUrl,
    resetSession,
    setSessionState
  } = useSession();

  const [currentStage, setCurrentStage] = useState<GenerationStage>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingResumeRef = useRef<ResumeContext | null>(null);

  const { toast } = useToast();

  const parseError = useCallback((error: unknown): { title: string; message: string } => {
    const errMessage = error instanceof Error ? error.message : '';

    if (errMessage.includes('RATE_LIMIT') || errMessage.includes('429') || errMessage.includes('rate limit')) {
      return {
        title: '⚠️ Rate Limit Exceeded',
        message: "You've reached the rate limit. Please wait a few minutes and try again."
      };
    }
    if (errMessage.includes('OPENROUTER') || errMessage.includes('OpenRouter')) {
      return {
        title: '⚠️ OpenRouter API Issue',
        message: 'Falling back to Groq. ' + errMessage
      };
    }

    return {
      title: 'Error',
      message: errMessage || 'An error occurred during processing'
    };
  }, []);

  const setPendingResume = useCallback((context: ResumeContext | null) => {
    pendingResumeRef.current = context;
    setSessionState({ pendingResume: context });
  }, [setSessionState]);

  const runRound = useCallback(async (
    input: string,
    roundNumber: number,
    userComment?: string
  ) => {
    // Create new round object
    const round: Round = {
      roundNumber,
      stage: 'questions',
      questions: [],
      research: [],
      answers: [],
      votes: [],
      status: 'in-progress',
      userComment
    };

    addRound(round);

    try {
      const activeAgents = agentConfigs.filter(c => c.enabled);

      // ========================================
      // STAGE 1: DYNAMIC QUESTION GENERATION
      // ========================================
      round.stage = 'questions';
      setCurrentStage('questions');
      toast({
        title: '🧠 Generating Research Questions',
        description: 'AI analyzing your idea to create targeted questions...'
      });

      const questionsStartTime = Date.now();
      const questionsData = await api.generateQuestions(input);
      const questionsDuration = Date.now() - questionsStartTime;

      round.questions = questionsData.questions || [];

      const questionsText = round.questions
        .map((q, i) => `${i + 1}. [${q.domain}] ${q.question}`)
        .join('\n');

      addDialogue({
        agent: 'system',
        message: `🎯 **Generated ${round.questions.length} Research Questions:**\n\n${questionsText}`,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      addHistory('output', {
        stage: 'questions',
        questions: round.questions,
        count: round.questions.length
      });

      toast({
        title: '✓ Questions Generated',
        description: `${round.questions.length} targeted questions in ${(questionsDuration / 1000).toFixed(1)}s`
      });

      // ========================================
      // STAGE 2: PARALLEL RESEARCH WITH TOOLS
      // ========================================
      round.stage = 'research';
      setCurrentStage('research');
      toast({
        title: '🔬 Deep Research Phase',
        description: 'Experts conducting parallel research with multiple tools...'
      });

      const researchStartTime = Date.now();
      const researchData = await api.conductResearch(agentConfigs, round.questions, roundNumber);
      const researchDuration = Date.now() - researchStartTime;

      round.research = researchData.researchResults || [];
      const metadata = researchData.metadata || { totalToolsUsed: 0, totalCost: 0 };

      // Extract unique models from research results
const modelsUsed = [...new Set(round.research.map(r => r.model))].join(', ') || 'Multi-model';
const researchSummary = `📊 **Research Complete:**\n• ${round.research.length} experts analyzed\n• ${metadata.totalToolsUsed || 0} tool calls executed\n• Cost: $${(metadata.totalCost || 0).toFixed(4)}\n• Duration: ${(researchDuration / 1000).toFixed(1)}s\n\n**Models Used:** ${modelsUsed}`;

      addDialogue({
        agent: 'system',
        message: researchSummary,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      round.research.forEach((result) => {
        const toolsList = result.toolsUsed?.map((t) => t.tool).join(', ') || 'none';
        const findingsPreview = result.findings.slice(0, 500);

        addDialogue({
          agent: result.expertId as AgentType,
          message: `🔍 **Research Findings** (${result.model})\n\n${findingsPreview}...\n\n_Tools: ${toolsList} • Cost: $${result.cost.toFixed(4)}_`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      addHistory('output', {
        stage: 'research',
        expertsCount: round.research.length,
        toolsUsed: metadata.totalToolsUsed,
        cost: metadata.totalCost,
        duration: researchDuration
      });

      toast({
        title: '✓ Research Complete',
        description: `${round.research.length} experts • ${metadata.totalToolsUsed} tools • $${(metadata.totalCost || 0).toFixed(4)}`
      });

      // ========================================
      // STAGE 2.5: CHALLENGE/DEBATE
      // ========================================
      round.stage = 'challenge';
      setCurrentStage('challenge');
      toast({
        title: '⚔️ Challenge Phase',
        description: 'Stress-testing ideas with contrarian viewpoints...'
      });

      const challengeStartTime = Date.now();
      const challengeData = await api.runChallenge(agentConfigs, round.research, roundNumber);
      const challengeDuration = Date.now() - challengeStartTime;

      round.challenges = challengeData.challenges || [];
      round.challengeResponses = challengeData.challengeResponses || [];
      round.debateResolutions = challengeData.debateResolutions || [];
      const challengeMetadata = challengeData.metadata || { totalChallenges: 0, totalResponses: 0, debatesResolved: 0, avgRiskScore: 0, challengeCost: 0 };

      const challengeSummary = `⚔️ **Productive Conflict Complete (Ray Dalio Style):**\n• ${challengeMetadata.totalChallenges || 0} contrarian challenges generated\n• ${challengeMetadata.totalResponses || 0} expert debates\n• ${challengeMetadata.debatesResolved || 0} positions battle-tested\n• Avg Risk Score: ${challengeMetadata.avgRiskScore || 0}/10\n• Cost: $${(challengeMetadata.challengeCost || 0).toFixed(4)}\n• Duration: ${(challengeDuration / 1000).toFixed(1)}s\n\n**Result:** Ideas stress-tested through thoughtful disagreement`;

      addDialogue({
        agent: 'system',
        message: challengeSummary,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      round.challengeResponses?.forEach((response) => {
        const challenge = round.challenges?.find((c) => c.id === response.challengeId);
        addDialogue({
          agent: response.challenger as AgentType,
          message: `🎯 **Contrarian Challenge:**\n\n**Question:** ${challenge?.question || 'Challenge'}\n\n**Devil's Advocate Position:**\n${response.challenge}\n\n**Evidence Against:** ${response.evidenceAgainst.join('; ')}\n\n${response.alternativeApproach ? `**Alternative Approach:** ${response.alternativeApproach}\n\n` : ''}_Risk Score: ${response.riskScore}/10 • Cost: $${response.cost.toFixed(4)}_`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      round.debateResolutions?.forEach((resolution) => {
        addDialogue({
          agent: 'system',
          message: `🤝 **Debate Resolution:**\n\n${resolution.resolution}\n\n**Confidence Change:** ${resolution.confidenceChange > 0 ? '+' : ''}${resolution.confidenceChange}%\n**Adopted Alternatives:** ${resolution.adoptedAlternatives.join(', ') || 'None'}`,
          timestamp: new Date().toISOString(),
          type: 'discussion'
        });
      });

      addHistory('output', {
        stage: 'challenge',
        challenges: round.challenges.length,
        responses: round.challengeResponses.length,
        resolutions: round.debateResolutions.length,
        cost: challengeMetadata.challengeCost,
        duration: challengeDuration
      });

      toast({
        title: '✓ Productive Conflict Complete',
        description: `${challengeMetadata.debatesResolved} positions battle-tested • $${(challengeMetadata.challengeCost || 0).toFixed(4)}`
      });

      // ========================================
      // STAGE 3: EXPERT SYNTHESIS
      // ========================================
      round.stage = 'answers';
      setCurrentStage('synthesis');
      toast({
        title: '💡 Synthesis Phase',
        description: 'Experts synthesizing battle-tested research...'
      });

      const synthesisStartTime = Date.now();
      const synthesisData = await api.synthesizeFindings(
        agentConfigs,
        round.research,
        round.debateResolutions || [],
        roundNumber,
        userComment
      );
      const synthesisDuration = Date.now() - synthesisStartTime;

      if (!synthesisData.syntheses) {
        throw new Error('Failed to synthesize research');
      }

      round.answers = synthesisData.syntheses;
      addHistory('output', { stage: 'synthesis', syntheses: round.answers });

      synthesisData.syntheses?.forEach((s) => {
        const quality = s.researchQuality || {};
        addDialogue({
          agent: s.expertId as AgentType,
          message: `📝 **Final Synthesis:**\n\n${s.synthesis}\n\n_Research depth: ${quality.toolsUsed || 0} tools • $${(quality.cost || 0).toFixed(4)}_`,
          timestamp: s.timestamp,
          type: 'answer'
        });
      });

      toast({
        title: '✓ Synthesis Complete',
        description: `${synthesisData.syntheses?.length || 0} expert syntheses in ${(synthesisDuration / 1000).toFixed(1)}s`
      });

      // ========================================
      // STAGE 3.5: QUALITY REVIEW
      // ========================================
      round.stage = 'review';
      setCurrentStage('review');
      toast({
        title: '🔍 Quality Review',
        description: 'Heavy-model verification of synthesis outputs...'
      });

      const reviewStartTime = Date.now();
      const reviewData = await api.runReview(synthesisData.syntheses, round.research);
      const reviewDuration = Date.now() - reviewStartTime;

      round.review = reviewData.review;
      const reviewMetadata = reviewData.metadata;

      const criticalIssues = round.review?.issues?.filter(i => i.severity === 'critical').length || 0;
      const majorIssues = round.review?.issues?.filter(i => i.severity === 'major').length || 0;
      const reviewPassed = round.review?.passed || false;

      const reviewSummary = `🔍 **Quality Review Complete (${reviewMetadata.reviewModel}):**\n• Score: ${round.review?.overallScore || 0}/100\n• Status: ${reviewPassed ? '✅ PASSED' : '⚠️ NEEDS ATTENTION'}\n• Issues: ${criticalIssues} critical, ${majorIssues} major\n• Citations: ${round.review?.citationAnalysis?.totalCitations || 0} total, ${round.review?.citationAnalysis?.missingCitations || 0} missing\n• Review time: ${(reviewDuration / 1000).toFixed(1)}s`;

      addDialogue({
        agent: 'system',
        message: reviewSummary,
        timestamp: new Date().toISOString(),
        type: 'discussion'
      });

      if (round.review?.issues && round.review.issues.length > 0) {
        round.review.issues.forEach((issue) => {
          const severityEmoji = issue.severity === 'critical' ? '🚨' : issue.severity === 'major' ? '⚠️' : 'ℹ️';
          addDialogue({
            agent: 'system',
            message: `${severityEmoji} **[${issue.severity.toUpperCase()}] ${issue.category}**\n\n${issue.description}\n\n**Remediation:** ${issue.remediation}${issue.affectedExpert ? `\n\n_Affected: ${issue.affectedExpert}_` : ''}`,
            timestamp: new Date().toISOString(),
            type: 'discussion'
          });
        });
      }

      addHistory('output', {
        stage: 'review',
        score: round.review?.overallScore || 0,
        passed: reviewPassed,
        issues: round.review?.issues?.length || 0,
        duration: reviewDuration
      });

      toast({
        title: reviewPassed ? '✓ Review Passed' : '⚠️ Review Issues Found',
        description: `Score: ${round.review?.overallScore || 0}/100 • ${criticalIssues + majorIssues} issues • ${(reviewDuration / 1000).toFixed(1)}s`
      });

      // ========================================
      // STAGE 4: CONSENSUS VOTING
      // ========================================
      round.stage = 'voting';
      setCurrentStage('voting');
      toast({
        title: '🗳️ Consensus Vote',
        description: 'Panel voting on proceeding to specification...'
      });

      const voteTaskIds = activeAgents.map(agent =>
        addTask({ type: 'vote', agent: agent.agent, description: 'Casting vote', status: 'running' })
      );

      const votingStartTime = Date.now();
      const votesData = await api.collectVotes(agentConfigs, synthesisData.syntheses);
      const votingDuration = Date.now() - votingStartTime;

      voteTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: votingDuration / voteTaskIds.length }));

      round.votes = votesData.votes;
      round.votes.forEach((vote) => addHistory('vote', vote));

      round.votes.forEach((v) => {
        const emoji = v.approved ? '✅' : '❌';
        addDialogue({
          agent: v.agent as AgentType,
          message: `${emoji} **Vote:** ${v.approved ? 'APPROVED' : 'NEEDS ANOTHER ROUND'}\n\n${v.reasoning}\n\n_Confidence: ${v.confidence}%_`,
          timestamp: v.timestamp,
          type: 'vote'
        });
      });

      const approvedCount = round.votes.filter((v) => v.approved).length;
      toast({
        title: '✓ Vote Complete',
        description: `${approvedCount}/${round.votes.length} approved • ${votingDuration}ms`
      });

      round.status = 'complete';
      updateCurrentRound(round); // Update the round in state

      // Guard against division by zero when votes array is empty
      const approvalRate = round.votes.length > 0
        ? round.votes.filter((v) => v.approved).length / round.votes.length
        : 0;

      if (approvalRate >= 0.6 || roundNumber >= 3) {
        // ========================================
        // STAGE 5: FINAL SPECIFICATION GENERATION
        // ========================================
        round.stage = 'spec';
        setCurrentStage('spec');
        toast({
          title: '📄 Specification Phase',
          description: 'Generating comprehensive production-ready specification...'
        });

        const specTaskId = addTask({ type: 'answer', description: 'Synthesizing specification', status: 'running' });

        const specStartTime = Date.now();
        const specData = await api.generateSpec(
          synthesisData.syntheses,
          round.votes,
          round.research,
          round.debateResolutions || []
        );
        const specDuration = Date.now() - specStartTime;

        updateTask(specTaskId, { status: 'complete', duration: specDuration });

        setGeneratedSpec(specData.spec);
        setTechStack(specData.techStack || []);
        if ((specData as any).mockupUrl) {
          setMockupUrl((specData as any).mockupUrl);
        }
        addHistory('spec', { spec: specData.spec });

        const totalCost = round.research.reduce((sum, r) => sum + (r.cost || 0), 0);

        toast({
          title: '✅ Specification Complete!',
          description: `Round ${roundNumber} • ${specDuration}ms • Total cost: $${totalCost.toFixed(4)}`
        });

        setIsProcessing(false);
        setCurrentStage('complete');
      } else {
        toast({
          title: `Round ${roundNumber} Complete`,
          description: `${Math.round(approvalRate * 100)}% approval. Starting next round...`
        });

        if (!sessionState.isPaused) {
          // Recursive call for next round
          await runRound(input, roundNumber + 1, userComment);
        } else {
          // If paused, just stop here
          setPendingResume({ input, nextRound: roundNumber + 1, userComment });
          setIsProcessing(false);
        }
      }

    } catch (error) {
      console.error('Round error:', error);
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive', duration: 8000 });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [
    agentConfigs,
    addTask,
    updateTask,
    addDialogue,
    addHistory,
    setGeneratedSpec,
    setMockupUrl,
    setPendingResume,
    addRound,
    updateCurrentRound,
    sessionState.isPaused,
    toast,
    parseError
  ]);

  const startGeneration = useCallback(async (input: string) => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('questions');
    startSession(); // Dispatch start session

    try {
      await runRound(input, 1);
    } catch (error) {
      console.error('Spec generation failed:', error);
      const { title, message } = parseError(error);
      toast({
        title,
        description: message,
        variant: 'destructive'
      });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [runRound, toast, parseError, resetSession, resetDialogue, resetTasks, startSession, setPendingResume]);

  const pause = useCallback(() => {
    setPaused(true);
    toast({ title: 'Paused', description: 'Session paused. Add your comments.' });
  }, [setPaused, toast]);

  const resume = useCallback(async (comment?: string) => {
    if (comment) {
      addHistory('user-comment', { comment });
      addDialogue({
        agent: 'user',
        message: comment,
        timestamp: new Date().toISOString(),
        type: 'user'
      });
    }
    setPaused(false);
    toast({ title: 'Resuming', description: 'Continuing with your guidance...' });

    const pendingResume = pendingResumeRef.current ?? sessionState.pendingResume;
    if (!pendingResume || isProcessing) {
      return;
    }

    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('questions');

    try {
      await runRound(
        pendingResume.input,
        pendingResume.nextRound,
        comment ?? pendingResume.userComment
      );
    } catch (error) {
      console.error('Resume failed:', error);
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [setPaused, toast, addHistory, addDialogue, sessionState.pendingResume, isProcessing, setPendingResume, runRound, parseError]);

  const reset = useCallback(() => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(false);
    setCurrentStage('idle');
    setError(null);
  }, [resetSession, resetDialogue, resetTasks, setPendingResume]);

  const hydrateFromStorage = useCallback((data: {
    generatedSpec?: string;
    dialogueEntries?: DialogueEntry[];
    sessionState?: SessionState;
  } | null) => {
    if (!data) return;

    if (data.sessionState) {
      setSessionState(data.sessionState);
      pendingResumeRef.current = data.sessionState.pendingResume ?? null;
    }

    if (data.dialogueEntries) {
      setDialogue(data.dialogueEntries);
    }

    if (typeof data.generatedSpec === 'string') {
      setGeneratedSpec(data.generatedSpec);
      setCurrentStage('complete');
    } else {
      setCurrentStage('idle');
    }

    setIsProcessing(false);
  }, [setSessionState, setDialogue, setGeneratedSpec]);

  const startRefinement = useCallback(async (input: string) => {
    resetSession();
    resetDialogue();
    resetTasks();
    setPendingResume(null);
    setIsProcessing(true);
    setCurrentStage('refinement');
    startSession();

    addDialogue({
      agent: 'user',
      message: input,
      timestamp: new Date().toISOString(),
      type: 'user'
    });

    try {
      // Find a suitable agent for PM role (Steve or first enabled)
      const pmAgent = agentConfigs.find(c => c.enabled && c.agent === 'steve') || 
                      agentConfigs.find(c => c.enabled) || 
                      agentConfigs[0];

      if (!pmAgent) throw new Error("No agents available");

      const prompt = `I have a product idea: "${input}". 
      
      Act as a Senior Product Manager. Your goal is to refine this idea into a solid spec.
      I want you to ask me the **single most important** clarifying question to define the scope right now.
      
      Format your response exactly like this:
      **Question:** [The question]
      **Context:** [Why this matters]
      
      **Options:**
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D - "Something else" / Custom]
      
      **Recommendation:** I recommend [Option] because [Reason].
      
      Do not ask multiple questions. Ask only one.`;
      
      const response = await api.chatWithAgent(agentConfigs, pmAgent.agent, prompt);
      
      addDialogue({
        agent: pmAgent.agent as AgentType,
        message: response.response,
        timestamp: response.timestamp,
        type: 'question'
      });
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Refinement failed:', error);
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
    }
  }, [agentConfigs, resetSession, resetDialogue, resetTasks, startSession, addDialogue, parseError, toast, setPendingResume]);

  const proceedToGeneration = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStage('questions');
    setPendingResume(null);
    
    // Aggregate context from the dialogue
    const fullContext = dialogueEntries
      .map(e => `${e.agent.toUpperCase()}: ${e.message}`)
      .join('\n\n');
      
    try {
      await runRound(fullContext, 1);
    } catch (error) {
      console.error('Spec generation failed:', error);
      const { title, message } = parseError(error);
      toast({ title, description: message, variant: 'destructive' });
      setError(message);
      setIsProcessing(false);
      setCurrentStage('error');
    }
  }, [dialogueEntries, runRound, parseError, toast, setPendingResume]);

  const chatWithAgent = useCallback(async (agentId: string, message: string) => {
    // Add user message to dialogue
    addDialogue({
      agent: 'user',
      message: message,
      timestamp: new Date().toISOString(),
      type: 'user'
    });

    try {
      const response = await api.chatWithAgent(agentConfigs, agentId, message);
      
      // Add agent response to dialogue
      addDialogue({
        agent: response.agent as AgentType,
        message: response.response,
        timestamp: response.timestamp,
        type: 'discussion' // or a new 'chat' type if we defined it
      });
      
      return true;
    } catch (error) {
      console.error('Chat error:', error);
      const { title, message: errorMsg } = parseError(error);
      toast({ title, description: errorMsg, variant: 'destructive' });
      return false;
    }
  }, [agentConfigs, addDialogue, parseError, toast]);

  const shareSpec = useCallback(async () => {
    if (!generatedSpec) return;
    
    try {
      const title = generatedSpec.split('\n')[0].replace('# ', '').trim() || "Product Specification";
      
      const { id } = await api.saveSpec(title, generatedSpec, {
        rounds: sessionState.rounds.length,
        agents: agentConfigs.filter(c => c.enabled).map(c => c.agent)
      });
      
      const url = `${window.location.origin}/spec/${id}`;
      navigator.clipboard.writeText(url);
      
      toast({
        title: "Link Copied!",
        description: "Share this URL with your team."
      });
      
    } catch (error) {
      console.error('Share failed:', error);
      toast({ title: "Share Failed", description: "Could not save specification.", variant: "destructive" });
    }
  }, [generatedSpec, sessionState.rounds.length, agentConfigs, toast]);

  return {
    isProcessing,
    currentStage,
    sessionState,
    tasks,
    generatedSpec,
    techStack,
    mockupUrl,
    dialogueEntries,
    error,
    startGeneration,
    startRefinement,
    proceedToGeneration,
    pause,
    resume,
    reset,
    hydrateFromStorage,
    chatWithAgent,
    shareSpec
  };
}
