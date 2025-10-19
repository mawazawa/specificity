import { useState, useEffect } from "react";
import { SpecInput } from "@/components/SpecInput";
import { AgentCard } from "@/components/AgentCard";
import { VotingPanel } from "@/components/VotingPanel";
import { RoundTracker } from "@/components/RoundTracker";
import { PauseControls } from "@/components/PauseControls";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import { SpecOutput } from "@/components/SpecOutput";
import { StageIndicator } from "@/components/StageIndicator";
import { AgentOutputCard } from "@/components/AgentOutputCard";
import { ExpandableAgentCard } from "@/components/ExpandableAgentCard";
import { LiveAgentCard } from "@/components/LiveAgentCard";
import { ProcessViewer } from "@/components/ProcessViewer";
import { VoteTally } from "@/components/VoteTally";
import { DialoguePanel, DialogueEntry } from "@/components/DialoguePanel";
import { AgentConfig, SessionState, Round } from "@/types/spec";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatView, ChatEntry } from "@/components/chat/ChatView";
import { MobileHeader } from "@/components/mobile/MobileHeader";

interface Task {
  id: string;
  type: 'question' | 'research' | 'answer' | 'vote';
  agent?: string;
  description: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
  result?: any;
}

// DialogueEntry is now imported from DialoguePanel

const defaultConfigs: AgentConfig[] = [
  { agent: 'elon', systemPrompt: 'You are Elon Musk. Challenge everything with first-principles thinking. Ask: Can this scale to 100M+ users? What\'s the 10x solution? Is this bold enough? Prioritize massive impact, revolutionary technology, and exponential growth. Question conventional wisdom relentlessly.', temperature: 0.8, enabled: true },
  { agent: 'steve', systemPrompt: 'You are Steve Jobs. Obsess over every detail of the user experience. Ask: Is this absolutely essential? Does it spark joy and delight? Is the design pure and iconic? Remove anything that doesn\'t serve the core vision. Make every interaction magical and intuitive.', temperature: 0.7, enabled: true },
  { agent: 'oprah', systemPrompt: 'You are Oprah Winfrey. Center human stories and emotional truth. Ask: How does this empower people? What\'s the deeper impact on lives? Is this authentic and inclusive? Focus on transformation, connection, and uplifting communities. Lead with empathy and purpose.', temperature: 0.75, enabled: true },
  { agent: 'zaha', systemPrompt: 'You are Zaha Hadid. Push boundaries of form and space. Ask: How can we break conventional design rules? What fluid, organic shapes can we explore? Is this architecturally bold and sculptural? Create experiences that are visually striking and spatially innovative.', temperature: 0.85, enabled: true },
  { agent: 'jony', systemPrompt: 'You are Jony Ive. Pursue absolute simplicity and refined craftsmanship. Ask: Can we remove this? What materials honor the design? Is every detail intentional? Focus on purity, restraint, and the essential nature of things. Make the complex beautifully simple.', temperature: 0.6, enabled: true },
  { agent: 'bartlett', systemPrompt: 'You are Steven Bartlett. Drive aggressive growth and market disruption. Ask: How do we acquire 1M users in 6 months? What\'s the viral loop? Is this disruptive enough? Focus on modern business models, data-driven decisions, and rapid scaling strategies.', temperature: 0.75, enabled: true },
  { agent: 'amal', systemPrompt: 'You are Amal Clooney. Protect rights and ensure ethical compliance. Ask: What are the legal risks? How do we safeguard user privacy and data? Is this ethical and fair? Focus on regulatory compliance, human rights, and building trust through responsible practices.', temperature: 0.5, enabled: true },
];

const Index = () => {
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(defaultConfigs);
  const [sessionState, setSessionState] = useState<SessionState>({
    rounds: [],
    currentRound: 0,
    isPaused: false,
    history: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generatedSpec, setGeneratedSpec] = useState<string>("");
  const [dialogueEntries, setDialogueEntries] = useState<DialogueEntry[]>([]);
  const [isDialogueOpen, setIsDialogueOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'chat' | 'panels'>('chat');
  const { toast } = useToast();

  const addTask = (task: Omit<Task, 'id'>) => {
    const id = `${task.type}-${Date.now()}-${Math.random()}`;
    setTasks(prev => [...prev, { ...task, id }]);
    return id;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addHistoryEntry = (type: 'vote' | 'output' | 'spec' | 'user-comment', data: any) => {
    setSessionState(prev => ({
      ...prev,
      history: [...prev.history, { timestamp: new Date().toISOString(), type, data }]
    }));
  };

  const runRound = async (input: string, roundNumber: number, userComment?: string) => {
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

    setSessionState(prev => ({
      ...prev,
      rounds: [...prev.rounds, round],
      currentRound: prev.rounds.length
    }));

    try {
      // Stage 1: Questions
      round.stage = 'questions';
      setCurrentStage(`Round ${roundNumber}: Generating Questions`);
      toast({ 
        title: "Questions Phase", 
        description: "Panel members generating clarifying questions..."
      });
      
      const activeAgents = agentConfigs.filter(c => c.enabled);
      const questionTaskIds = activeAgents.map(agent => 
        addTask({ type: 'question', agent: agent.agent, description: `Generating questions`, status: 'running' })
      );

      const questionsStartTime = Date.now();
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'questions', agentConfigs, userComment } }
      );
      
      if (questionsError) {
        console.error('Questions error:', questionsError);
        throw new Error(questionsError.message || 'Failed to generate questions');
      }
      
      const questionsDuration = Date.now() - questionsStartTime;
      questionTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: questionsDuration }));
      
      round.questions = questionsData.questions;
      addHistoryEntry('output', { stage: 'questions', questions: round.questions });
      
      // Add questions to dialogue
      round.questions.forEach(q => {
        setDialogueEntries(prev => [...prev, {
          agent: q.askedBy,
          message: q.question,
          timestamp: new Date().toISOString(),
          type: 'question'
        }]);
      });
      
      toast({ 
        title: "Questions Complete", 
        description: `${round.questions.length} questions generated in ${questionsDuration}ms`
      });

      // Stage 2: Research
      round.stage = 'research';
      setCurrentStage(`Round ${roundNumber}: Research with Exa`);
      toast({ 
        title: "Research Phase", 
        description: "Conducting deep research on key topics..."
      });

      const researchTaskIds = round.questions.slice(0, 5).map((q, i) => 
        addTask({ type: 'research', description: `Searching: ${q.question.slice(0, 50)}...`, status: 'running' })
      );

      const researchStartTime = Date.now();
      const { data: researchData, error: researchError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'research', roundData: round } }
      );
      if (researchError) throw researchError;
      
      const researchDuration = Date.now() - researchStartTime;
      researchTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: researchDuration / researchTaskIds.length }));
      
      round.research = researchData.research.map((r: any) => ({
        title: r.title || 'Research',
        url: r.url || '',
        snippet: r.text || r.snippet || '',
        relevance: r.score || 0.8
      }));
      addHistoryEntry('output', { stage: 'research', count: round.research.length });
      toast({ 
        title: "Research Complete", 
        description: `${round.research.length} sources analyzed in ${researchDuration}ms`
      });

      // Stage 3: Answers
      round.stage = 'answers';
      setCurrentStage(`Round ${roundNumber}: Agent Analysis`);
      toast({ 
        title: "Analysis Phase", 
        description: "Panel members providing expert perspectives..."
      });

      const answerTaskIds = activeAgents.map(agent => 
        addTask({ type: 'answer', agent: agent.agent, description: `Analyzing perspectives`, status: 'running' })
      );

      const answersStartTime = Date.now();
      const { data: answersData, error: answersError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'answers', agentConfigs, roundData: round, userComment } }
      );
      if (answersError) throw answersError;
      
      const answersDuration = Date.now() - answersStartTime;
      answerTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: answersDuration / answerTaskIds.length }));
      
      round.answers = answersData.answers;
      addHistoryEntry('output', { stage: 'answers', answers: round.answers });
      
      // Add answers to dialogue
      round.answers.forEach(a => {
        setDialogueEntries(prev => [...prev, {
          agent: a.agent,
          message: a.answer,
          timestamp: new Date().toISOString(),
          type: 'answer'
        }]);
      });
      
      toast({ 
        title: "Analysis Complete", 
        description: `${round.answers.length} expert analyses in ${answersDuration}ms`
      });

      // Stage 4: Voting
      round.stage = 'voting';
      setCurrentStage(`Round ${roundNumber}: Consensus Vote`);
      toast({ 
        title: "Consensus Vote", 
        description: "Panel voting on proceeding to specification..."
      });

      const voteTaskIds = activeAgents.map(agent => 
        addTask({ type: 'vote', agent: agent.agent, description: `Casting vote`, status: 'running' })
      );

      const votingStartTime = Date.now();
      const { data: votesData, error: votesError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'voting', agentConfigs, roundData: round } }
      );
      if (votesError) throw votesError;
      
      const votingDuration = Date.now() - votingStartTime;
      voteTaskIds.forEach(id => updateTask(id, { status: 'complete', duration: votingDuration / voteTaskIds.length }));
      
      round.votes = votesData.votes;
      round.votes.forEach(vote => addHistoryEntry('vote', vote));
      
      // Add votes to dialogue
      round.votes.forEach(v => {
        setDialogueEntries(prev => [...prev, {
          agent: v.agent,
          message: v.reasoning,
          timestamp: v.timestamp,
          type: 'vote'
        }]);
      });
      
      const approvedCount = round.votes.filter(v => v.approved).length;
      toast({ 
        title: "Vote Complete", 
        description: `${approvedCount}/${round.votes.length} approved in ${votingDuration}ms`
      });

      round.status = 'complete';
      setSessionState(prev => {
        const rounds = [...prev.rounds];
        rounds[rounds.length - 1] = round;
        return { ...prev, rounds };
      });

      const approvalRate = round.votes.filter(v => v.approved).length / round.votes.length;
      
      if (approvalRate >= 0.6 || roundNumber >= 3) {
        // Generate final spec
        round.stage = 'spec';
        setCurrentStage("Generating Final Specification");
        toast({ 
          title: "Specification Phase", 
          description: "Generating comprehensive specification..."
        });

        const specTaskId = addTask({ type: 'answer', description: 'Synthesizing specification', status: 'running' });

        const specStartTime = Date.now();
        const { data: specData, error: specError } = await supabase.functions.invoke(
          'multi-agent-spec',
          { body: { stage: 'spec', roundData: round } }
        );
        if (specError) throw specError;
        
        const specDuration = Date.now() - specStartTime;
        updateTask(specTaskId, { status: 'complete', duration: specDuration });
        
        setGeneratedSpec(specData.spec);
        setSessionState(prev => ({
          ...prev,
          finalSpec: {
            title: 'Generated Specification',
            summary: specData.spec.slice(0, 200),
            sections: [],
            techStack: [],
            dependencies: [],
            risks: [],
            testStrategy: [],
            approvedBy: specData.approvedBy,
            dissentedBy: specData.dissentedBy
          }
        }));
        addHistoryEntry('spec', { spec: specData.spec });
        
        toast({ title: "Spec Complete", description: `Completed after ${roundNumber} rounds in ${specDuration}ms` });
      } else {
        toast({ 
          title: `Round ${roundNumber} Complete`, 
          description: `${Math.round(approvalRate * 100)}% approval. Starting next round...`
        });
        if (!sessionState.isPaused) {
          await runRound(input, roundNumber + 1);
        }
      }
    } catch (error: any) {
      console.error('Round error:', error);
      
      let errorMsg = "An error occurred during processing";
      let errorTitle = "Error";
      
      if (error.message?.includes('RATE_LIMIT') || error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorTitle = "⚠️ Groq Rate Limit";
        errorMsg = error.message?.includes('daily') 
          ? "Daily token limit reached. Resets at midnight UTC. Consider upgrading your Groq account for higher limits."
          : "Too many requests. Groq limits: 30 req/min, 14,400 req/day. Wait 1-2 minutes and retry.";
      } else {
        errorMsg = error.message || errorMsg;
      }
      
      toast({ title: errorTitle, description: errorMsg, variant: "destructive", duration: 8000 });
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (input: string) => {
    setIsProcessing(true);
    setTasks([]);
    setGeneratedSpec("");
    setDialogueEntries([]);
    setSessionState({
      rounds: [],
      currentRound: 0,
      isPaused: false,
      history: []
    });

    try {
      await runRound(input, 1);
    } finally {
      setIsProcessing(false);
      setCurrentStage("");
    }
  };

  const handlePause = () => {
    setSessionState(prev => ({ ...prev, isPaused: true }));
    toast({ title: "Paused", description: "Session paused. Add your comments." });
  };

  const handleResume = async (comment?: string) => {
    if (comment) {
      addHistoryEntry('user-comment', { comment });
      setDialogueEntries(prev => [...prev, {
        agent: 'user' as any,
        message: comment,
        timestamp: new Date().toISOString(),
        type: 'user' as any
      }]);
    }
    setSessionState(prev => ({ ...prev, isPaused: false }));
    toast({ title: "Resuming", description: "Continuing with your guidance..." });
  };

  const currentRound = sessionState.rounds[sessionState.currentRound];

  // Convert dialogue entries to chat entries
  const chatEntries: ChatEntry[] = dialogueEntries.map(entry => ({
    agent: entry.agent,
    message: entry.message,
    timestamp: entry.timestamp,
    type: entry.type as ChatEntry['type']
  }));

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Mobile Header - only show in chat mode on mobile */}
      {viewMode === 'chat' && (
        <div className="md:hidden">
          <MobileHeader 
            agentConfigs={agentConfigs}
            onAgentClick={(agent) => console.log('Agent clicked:', agent)}
            onMenuClick={() => setViewMode('panels')}
          />
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-8">
        {/* View Mode Toggle - Desktop */}
        <div className="hidden md:flex items-center justify-between">
          <SpecInput onSubmit={handleSubmit} isLoading={isProcessing} />
          <div className="flex gap-2 ml-4">
            <Button
              variant={viewMode === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chat')}
              className="gap-2 rounded-full"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={viewMode === 'panels' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('panels')}
              className="gap-2 rounded-full"
            >
              <LayoutGrid className="w-4 h-4" />
              Panels
            </Button>
          </div>
        </div>

        {/* Mobile - Just Input */}
        <div className="md:hidden">
          {viewMode === 'panels' && (
            <SpecInput onSubmit={handleSubmit} isLoading={isProcessing} />
          )}
        </div>

        {/* Main Content */}
        {viewMode === 'chat' ? (
          <div className="space-y-6">
            <ChatView
              entries={chatEntries}
              isPaused={sessionState.isPaused}
              onPause={handlePause}
              onResume={handleResume}
              isProcessing={isProcessing}
            />
          </div>
        ) : (
          <>
            {/* Activity Section - Right under input */}
            {isProcessing && tasks.length > 0 && (
              <div className="animate-slide-up">
                <ProcessViewer tasks={tasks} currentStage={currentStage} />
              </div>
            )}

        {currentRound?.votes.length > 0 && (
          <div className="animate-slide-up">
            <VoteTally votes={currentRound.votes} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Advisory Panel with Live Outputs */}
            <div className="space-y-3">
              <h2 className="text-xs font-light uppercase tracking-widest text-foreground/60">
                Advisory Panel
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
                {agentConfigs.map((config, index) => {
                  const agentQuestion = currentRound?.questions?.find(q => q.askedBy === config.agent);
                  const agentAnswer = currentRound?.answers?.find(a => a.agent === config.agent);
                  const agentVote = currentRound?.votes?.find(v => v.agent === config.agent);
                  
                  return (
                    <div key={config.agent} className="space-y-2">
                      <AgentCard
                        config={config}
                        onChange={(updatedConfig) => {
                          const newConfigs = [...agentConfigs];
                          newConfigs[index] = updatedConfig;
                          setAgentConfigs(newConfigs);
                        }}
                      />
                      {(agentQuestion || agentAnswer || agentVote) && (
                        <LiveAgentCard
                          agent={config.agent}
                          question={agentQuestion?.question}
                          output={agentAnswer?.answer}
                          vote={agentVote}
                          isActive={currentRound?.stage === 'questions' || currentRound?.stage === 'answers'}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {isProcessing && currentRound && (
              <div className="animate-slide-up">
                <StageIndicator 
                  stage={currentRound.stage} 
                  roundNumber={currentRound.roundNumber} 
                />
              </div>
            )}

            {isProcessing && sessionState.rounds.length > 0 && (
              <PauseControls 
                isPaused={sessionState.isPaused}
                onPause={handlePause}
                onResume={handleResume}
              />
            )}

            {currentRound?.research.length > 0 && (
              <div className="animate-slide-up">
                <ResearchPanel 
                  results={currentRound.research} 
                  isSearching={currentRound.stage === 'research'} 
                />
              </div>
            )}

            {currentRound?.votes.length > 0 && (
              <div className="animate-slide-up">
                <VotingPanel 
                  votes={currentRound.votes} 
                  roundNumber={currentRound.roundNumber} 
                />
              </div>
            )}

            {generatedSpec && (
              <div className="animate-slide-up">
                <SpecOutput 
                  spec={generatedSpec}
                  onApprove={() => {
                    toast({ title: "Approved!", description: "Specification has been approved" });
                  }}
                  onRefine={(refinements) => {
                    toast({ 
                      title: "Refining...", 
                      description: `Applying ${refinements.length} refinement(s)` 
                    });
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-8">
            {sessionState.rounds.length > 0 && (
              <div className="animate-slide-up">
                <RoundTracker 
                  rounds={sessionState.rounds} 
                  currentRound={sessionState.currentRound} 
                />
              </div>
            )}

            {sessionState.history.length > 0 && (
              <div className="animate-slide-up">
                <HistoryPanel history={sessionState.history} />
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Floating Dialogue Panel - only in panels mode */}
      {viewMode === 'panels' && (
        <DialoguePanel 
          entries={dialogueEntries}
          isOpen={isDialogueOpen}
          onToggle={() => setIsDialogueOpen(!isDialogueOpen)}
        />
      )}
    </div>
  );
};

export default Index;
