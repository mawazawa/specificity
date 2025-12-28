import { api } from '@/lib/api';
import { AgentConfig, AgentType, Round } from '@/types/spec';
import { DialogueEntry } from './use-dialogue';

interface StageHandlerDeps {
  addDialogue: (entry: DialogueEntry) => void;
  addHistory: (type: string, data: any) => void;
  addTask: (task: any) => string;
  updateTask: (id: string, updates: any) => void;
  toast: (options: any) => void;
}

export async function executeQuestionsStage(
  input: string,
  round: Round,
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, toast } = deps;

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
}

export async function executeResearchStage(
  agentConfigs: AgentConfig[],
  round: Round,
  roundNumber: number,
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, toast } = deps;

  toast({
    title: '🔬 Deep Research Phase',
    description: 'Experts conducting parallel research with multiple tools...'
  });

  const researchStartTime = Date.now();
  const researchData = await api.conductResearch(agentConfigs, round.questions, roundNumber);
  const researchDuration = Date.now() - researchStartTime;

  round.research = researchData.researchResults || [];
  const metadata = researchData.metadata || { totalToolsUsed: 0, totalCost: 0 };

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
}

export async function executeChallengeStage(
  agentConfigs: AgentConfig[],
  round: Round,
  roundNumber: number,
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, toast } = deps;

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
}

export async function executeSynthesisStage(
  agentConfigs: AgentConfig[],
  round: Round,
  roundNumber: number,
  userComment: string | undefined,
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, toast } = deps;

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

  return synthesisData;
}

export async function executeReviewStage(
  round: Round,
  syntheses: any[],
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, toast } = deps;

  toast({
    title: '🔍 Quality Review',
    description: 'Heavy-model verification of synthesis outputs...'
  });

  const reviewStartTime = Date.now();
  const reviewData = await api.runReview(syntheses, round.research);
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
}

export async function executeVotingStage(
  agentConfigs: AgentConfig[],
  round: Round,
  syntheses: any[],
  deps: StageHandlerDeps
) {
  const { addDialogue, addHistory, addTask, updateTask, toast } = deps;

  toast({
    title: '🗳️ Consensus Vote',
    description: 'Panel voting on proceeding to specification...'
  });

  const activeAgents = agentConfigs.filter(c => c.enabled);
  const voteTaskIds = activeAgents.map(agent =>
    addTask({ type: 'vote', agent: agent.agent, description: 'Casting vote', status: 'running' })
  );

  const votingStartTime = Date.now();
  const votesData = await api.collectVotes(agentConfigs, syntheses);
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

  return votesData;
}

export async function executeSpecStage(
  round: Round,
  syntheses: any[],
  setGeneratedSpec: (spec: string) => void,
  setTechStack: (stack: any[]) => void,
  setMockupUrl: (url: string) => void,
  deps: StageHandlerDeps
) {
  const { addHistory, addTask, updateTask, toast } = deps;

  toast({
    title: '📄 Specification Phase',
    description: 'Generating comprehensive production-ready specification...'
  });

  const specTaskId = addTask({ type: 'answer', description: 'Synthesizing specification', status: 'running' });

  const specStartTime = Date.now();
  const specData = await api.generateSpec(
    syntheses,
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
    description: `${specDuration}ms • Total cost: $${totalCost.toFixed(4)}`
  });

  return specData;
}
