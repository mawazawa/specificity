import { useState } from "react";
import { SpecInput } from "@/components/SpecInput";
import { AgentConfigPanel } from "@/components/AgentConfigPanel";
import { VotingPanel } from "@/components/VotingPanel";
import { RoundTracker } from "@/components/RoundTracker";
import { PauseControls } from "@/components/PauseControls";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import { SpecOutput } from "@/components/SpecOutput";
import { AgentConfig, SessionState, Round, SpecQuestion, AgentAnswer } from "@/types/spec";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const defaultConfigs: AgentConfig[] = [
  { agent: 'elon', systemPrompt: 'You are analyzing for scalability. Focus on: 1) Can it scale to 100M+ users? 2) Simplest architecture? 3) Overengineering? Be visionary.', temperature: 0.8, enabled: true },
  { agent: 'cuban', systemPrompt: 'You are analyzing business viability. Focus on: 1) Business model 2) Revenue 3) Market opportunity 4) Competitive advantage.', temperature: 0.7, enabled: true },
  { agent: 'dev', systemPrompt: 'You are reviewing technical implementation. Focus on: 1) TypeScript 2) Error handling 3) Testing 4) Performance 5) Security.', temperature: 0.6, enabled: true },
  { agent: 'designer', systemPrompt: 'You are evaluating UX. Focus on: 1) Flow 2) Hierarchy 3) Accessibility 4) Responsiveness 5) Design system.', temperature: 0.7, enabled: true },
  { agent: 'entrepreneur', systemPrompt: 'You are defining strategy. Focus on: 1) MVP scope 2) Fast shipping 3) Critical path 4) What to defer.', temperature: 0.8, enabled: true },
  { agent: 'legal', systemPrompt: 'You are assessing compliance. Focus on: 1) Compliance 2) Privacy 3) Terms 4) Risk mitigation.', temperature: 0.5, enabled: true },
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
  const { toast } = useToast();

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
      setCurrentStage(`Round ${roundNumber}: Generating clarifying questions...`);
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'questions', agentConfigs, userComment } }
      );
      if (questionsError) throw questionsError;
      
      round.questions = questionsData.questions;
      addHistoryEntry('output', { stage: 'questions', questions: round.questions });

      // Stage 2: Research
      round.stage = 'research';
      setCurrentStage(`Round ${roundNumber}: Researching with Exa...`);
      const { data: researchData, error: researchError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'research', roundData: round } }
      );
      if (researchError) throw researchError;
      
      round.research = researchData.research.map((r: any) => ({
        title: r.title || 'Research',
        url: r.url || '',
        snippet: r.text || r.snippet || '',
        relevance: r.score || 0.8
      }));
      addHistoryEntry('output', { stage: 'research', count: round.research.length });

      // Stage 3: Answers
      round.stage = 'answers';
      setCurrentStage(`Round ${roundNumber}: Agents analyzing...`);
      const { data: answersData, error: answersError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'answers', agentConfigs, roundData: round, userComment } }
      );
      if (answersError) throw answersError;
      
      round.answers = answersData.answers;
      addHistoryEntry('output', { stage: 'answers', answers: round.answers });

      // Stage 4: Voting
      round.stage = 'voting';
      setCurrentStage(`Round ${roundNumber}: Voting...`);
      const { data: votesData, error: votesError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'voting', agentConfigs, roundData: round } }
      );
      if (votesError) throw votesError;
      
      round.votes = votesData.votes;
      round.votes.forEach(vote => addHistoryEntry('vote', vote));

      round.status = 'complete';
      setSessionState(prev => {
        const rounds = [...prev.rounds];
        rounds[rounds.length - 1] = round;
        return { ...prev, rounds };
      });

      const approvalRate = round.votes.filter(v => v.approved).length / round.votes.length;
      
      if (approvalRate >= 0.6 || roundNumber >= 3) {
        // Generate final spec
        setCurrentStage("Generating final specification...");
        round.stage = 'spec';
        const { data: specData, error: specError } = await supabase.functions.invoke(
          'multi-agent-spec',
          { body: { stage: 'spec', roundData: round } }
        );
        if (specError) throw specError;
        
        setSessionState(prev => ({
          ...prev,
          finalSpec: {
            title: 'Generated Specification',
            summary: specData.spec.slice(0, 200),
            sections: [],
            dependencies: [],
            risks: [],
            testStrategy: [],
            approvedBy: specData.approvedBy,
            dissentedBy: specData.dissentedBy
          }
        }));
        addHistoryEntry('spec', { spec: specData.spec });
        
        toast({ title: "Spec Complete", description: `Completed after ${roundNumber} rounds` });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (input: string) => {
    setIsProcessing(true);
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
    }
    setSessionState(prev => ({ ...prev, isPaused: false }));
    toast({ title: "Resuming", description: "Continuing with your guidance..." });
  };

  const currentRound = sessionState.rounds[sessionState.currentRound];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-12">
        <SpecInput onSubmit={handleSubmit} isLoading={isProcessing} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <AgentConfigPanel configs={agentConfigs} onChange={setAgentConfigs} />

            {currentStage && (
              <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/10 rounded-fluid">
                <div className="flex items-center justify-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                  <span className="text-sm font-light uppercase tracking-widest text-foreground/80">
                    {currentStage}
                  </span>
                </div>
              </Card>
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

            {sessionState.finalSpec && (
              <div className="animate-slide-up">
                <SpecOutput spec={sessionState.finalSpec.summary} />
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
      </div>
    </div>
  );
};

export default Index;
