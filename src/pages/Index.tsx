import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { LandingHero } from "@/components/LandingHero";
import { SampleSpecGallery } from "@/components/SampleSpecGallery";
import { AgentConfig, SessionState, Round } from "@/types/spec";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, LayoutGrid, LogOut, CheckCircle2 } from "lucide-react";
import type { User, Session } from '@supabase/supabase-js';
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
  result?: unknown;
}

// API Response interfaces
interface DialogueTurn {
  agent: AgentType;
  message: string;
  timestamp: string;
}

interface ResearchItem {
  title?: string;
  url?: string;
  snippet?: string;
  relevance?: number;
}

interface SynthesisItem {
  agent: AgentType;
  analysis: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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
  const [inputValue, setInputValue] = useState<string>("");  // NEW: State for input value
  const navigate = useNavigate();
  const { toast } = useToast();

  // Authentication check
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Periodic session verification
  useEffect(() => {
    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        navigate('/auth');
      }
    };

    const interval = setInterval(verifySession, 60000); // Every minute
    return () => clearInterval(interval);
  }, [navigate]);

  // Auto-save session to localStorage
  useEffect(() => {
    if (user && (generatedSpec || dialogueEntries.length > 0 || sessionState.rounds.length > 0)) {
      const sessionData = {
        generatedSpec,
        dialogueEntries,
        sessionState,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`specificity-session-${user.id}`, JSON.stringify(sessionData));
    }
  }, [user, generatedSpec, dialogueEntries, sessionState]);

  // Restore session on mount (after auth)
  useEffect(() => {
    if (user) {
      const savedSession = localStorage.getItem(`specificity-session-${user.id}`);
      if (savedSession) {
        try {
          const { generatedSpec: savedSpec, dialogueEntries: savedDialogue, sessionState: savedState, timestamp } = JSON.parse(savedSession);

          // Only restore if session is less than 24 hours old
          const sessionAge = Date.now() - new Date(timestamp).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (sessionAge < maxAge) {
            if (savedSpec) setGeneratedSpec(savedSpec);
            if (savedDialogue && savedDialogue.length > 0) setDialogueEntries(savedDialogue);
            if (savedState && savedState.rounds.length > 0) setSessionState(savedState);
            toast({
              title: "Session Restored",
              description: "Your previous work has been recovered",
            });
          } else {
            // Clear old session
            localStorage.removeItem(`specificity-session-${user.id}`);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
        }
      }
    }
  }, [user, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({ title: "Signed out", description: "You have been signed out successfully." });
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const id = `${task.type}-${Date.now()}-${Math.random()}`;
    setTasks(prev => [...prev, { ...task, id }]);
    return id;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addHistoryEntry = (type: 'vote' | 'output' | 'spec' | 'user-comment', data: Vote | AgentPerspective | string) => {
    setSessionState(prev => ({
      ...prev,
      history: [...prev.history, { timestamp: new Date().toISOString(), type, data }]
    }));
  };

  const runRound = async (input: string, roundNumber: number, userComment?: string, discussionTurns = 12) => {
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
      const activeAgents = agentConfigs.filter(c => c.enabled);

      // Stage 1: Orchestrated Roundtable Discussion
      round.stage = 'questions';
      setCurrentStage(`Round ${roundNumber}: Roundtable Discussion`);
      toast({ 
        title: "🎙️ Roundtable Started", 
        description: `Orchestrating ${discussionTurns}-turn panel discussion...`
      });

      const discussionStartTime = Date.now();
      const { data: discussionData, error: discussionError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'discussion', agentConfigs, userComment, discussionTurns } }
      );
      
      if (discussionError) {
        console.error('Discussion error:', discussionError);
        throw new Error(discussionError.message || 'Failed to run discussion');
      }
      
      const discussionDuration = Date.now() - discussionStartTime;
      
      // Add dialogue entries with scores
      if (discussionData.dialogue) {
        discussionData.dialogue.forEach((turn: DialogueTurn) => {
          setDialogueEntries(prev => [...prev, {
            agent: turn.agent,
            message: turn.message,
            timestamp: turn.timestamp,
            type: 'discussion'
          }]);
        });
      }
      
      round.questions = discussionData.dialogue || [];
      addHistoryEntry('output', { 
        stage: 'discussion', 
        dialogue: discussionData.dialogue,
        scores: discussionData.agentScores,
        summary: discussionData.summary
      });
      
      toast({ 
        title: "Discussion Complete", 
        description: `${discussionData.totalTurns} turns in ${(discussionDuration/1000).toFixed(1)}s`
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
      
      round.research = researchData.research.map((r: ResearchItem) => ({
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

      // Stage 3: Synthesis
      round.stage = 'answers';
      setCurrentStage(`Round ${roundNumber}: Expert Synthesis`);
      toast({ 
        title: "Synthesis Phase", 
        description: "Experts synthesizing key insights..."
      });

      const synthesisStartTime = Date.now();
      const roundData = {
        ...round,
        dialogue: discussionData.dialogue,
        agentScores: discussionData.agentScores
      };
      
      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'synthesis', agentConfigs, roundData, userComment } }
      );
      if (synthesisError) throw synthesisError;
      
      const synthesisDuration = Date.now() - synthesisStartTime;
      
      round.answers = synthesisData.syntheses;
      addHistoryEntry('output', { stage: 'synthesis', syntheses: round.answers });
      
      // Add syntheses to dialogue
      synthesisData.syntheses?.forEach((s: SynthesisItem) => {
        setDialogueEntries(prev => [...prev, {
          agent: s.agent,
          message: s.synthesis,
          timestamp: s.timestamp,
          type: 'answer'
        }]);
      });
      
      toast({ 
        title: "Synthesis Complete", 
        description: `${synthesisData.syntheses?.length || 0} expert syntheses in ${(synthesisDuration/1000).toFixed(1)}s`
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
      const votingRoundData = {
        ...round,
        syntheses: synthesisData.syntheses,
        agentScores: discussionData.agentScores
      };
      
      const { data: votesData, error: votesError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { stage: 'voting', agentConfigs, roundData: votingRoundData } }
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
        const specRoundData = {
          ...round,
          syntheses: synthesisData.syntheses,
          dialogue: discussionData.dialogue,
          agentScores: discussionData.agentScores
        };
        
        const { data: specData, error: specError } = await supabase.functions.invoke(
          'multi-agent-spec',
          { body: { stage: 'spec', roundData: specRoundData } }
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
    } catch (error: unknown) {
      console.error('Round error:', error);

      let errorMsg = "An error occurred during processing";
      let errorTitle = "Error";

      const errMessage = error instanceof Error ? error.message : '';

      if (errMessage.includes('RATE_LIMIT') || errMessage.includes('429') || errMessage.includes('rate limit')) {
        errorTitle = "⚠️ Groq Rate Limit";
        errorMsg = errMessage.includes('daily')
          ? "Daily token limit reached. Resets at midnight UTC. Consider upgrading your Groq account for higher limits."
          : "Too many requests. Groq limits: 30 req/min, 14,400 req/day. Wait 1-2 minutes and retry.";
      } else {
        errorMsg = errMessage || errorMsg;
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

  // Check if we should show landing page
  const showLanding = !isProcessing && dialogueEntries.length === 0 && !generatedSpec && sessionState.rounds.length === 0;

  const scrollToInput = () => {
    const inputElement = document.querySelector('[data-spec-input]');
    inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Show loading while checking auth
  if (!user && !session) {
    return null;
  }

  const testWorkflow = async () => {
    if (import.meta.env.MODE !== 'development') return;
    
    try {
      toast({ title: "Workflow Test", description: "Testing full spec generation workflow..." });
      
      const testInput = 'AI-powered collaborative project management tool for remote teams';
      let roundData: any = {};
      const stages: Array<'discussion' | 'research' | 'synthesis' | 'voting' | 'spec'> = 
        ['discussion', 'research', 'synthesis', 'voting', 'spec'];
      
      for (const stage of stages) {
        let attempts = 0;
        let success = false;
        
        while (attempts < 2 && !success) {
          try {
            const { data, error } = await supabase.functions.invoke('multi-agent-spec', {
              body: { 
                userInput: testInput,
                stage,
                roundData,
                agentConfigs: agentConfigs,
                discussionTurns: 8
              }
            });
            
            if (error) throw error;
            
            roundData = { ...roundData, ...data };
            success = true;
            
            console.log(`✅ Stage ${stage} completed:`, data);
            
            if (stage === 'spec') {
              const spec = data.spec || '';
              const requiredSections = [
                'Executive Summary',
                'Technical Architecture', 
                'Implementation Phases',
                'Core Requirements'
              ];
              const hasSections = requiredSections.every(section => 
                new RegExp(section, 'i').test(spec)
              );
              
              if (!hasSections || spec.length < 1000) {
                console.warn('⚠️ Incomplete spec generated:', {
                  length: spec.length,
                  hasSections,
                  spec: spec.slice(0, 200)
                });
                toast({ 
                  title: "Workflow Test Warning", 
                  description: "Spec may be incomplete",
                  variant: "destructive"
                });
              } else {
                console.log('✅ Full workflow complete with valid spec!');
                toast({ 
                  title: "Workflow Test Success", 
                  description: `Generated ${spec.length} char spec with all sections`
                });
              }
            }
          } catch (err) {
            attempts++;
            console.warn(`❌ Stage ${stage} failed (attempt ${attempts}):`, err);
            if (attempts >= 2) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
        
        if (!success) throw new Error(`Stage ${stage} failed after ${attempts} retries`);
      }
    } catch (error) {
      console.error('❌ Workflow test failed:', error);
      toast({ 
        title: "Workflow Test Failed", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background grid-background">
      {/* Sign Out Button */}
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Mobile Header - only show in chat mode on mobile */}
      {viewMode === 'chat' && !showLanding && (
        <div className="md:hidden">
          <MobileHeader 
            agentConfigs={agentConfigs}
            onAgentClick={(agent) => console.log('Agent clicked:', agent)}
            onMenuClick={() => setViewMode('panels')}
          />
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-8">
        {/* Landing Page - Show when nothing is active */}
        {showLanding ? (
          <div className="space-y-12">
            <LandingHero onGetStarted={handleGetStarted} />
            
            {/* Optimized Conversion Flow */}
            <div className="max-w-5xl mx-auto space-y-16">

              {/* Step 1: Clear Value Proposition */}
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  Get Your Production-Ready Spec in 30 Minutes
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  8 AI expert advisors analyze your idea, research the latest tech, debate architecture decisions,
                  and deliver a <span className="font-semibold text-foreground">15-section specification</span> with anti-drift controls.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground pt-4">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-foreground">$20 flat fee</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-foreground">30-min delivery</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-foreground">Money-back guarantee</span>
                  </span>
                </div>
              </div>

              {/* Step 2: Sample Gallery FIRST (Inspiration) */}
              <div>
                <SampleSpecGallery
                  onSelectSample={(sampleInput) => {
                    setInputValue(sampleInput);
                  }}
                />
              </div>

              {/* Step 3: Simple, Clear Input */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">Describe Your Product Idea</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Use one of the examples above or write your own. The more details you provide, the better your spec will be.
                  </p>
                </div>

                <SimpleSpecInput
                  onSubmit={handleSubmit}
                  isLoading={isProcessing}
                  defaultValue={inputValue}
                  key={inputValue}
                />
              </div>

              {/* Step 4: Social Proof - Who Reviews Your Spec */}
              <div className="space-y-6 border-t border-border/30 pt-12">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Your 8-Person AI Advisory Board</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Each advisor brings authentic expertise trained on their complete corpus of public work
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                  {agentConfigs.slice(0, 8).map((config) => (
                    <AgentCard
                      key={config.agent}
                      config={config}
                      onChange={(updatedConfig) => {
                        const newConfigs = [...agentConfigs];
                        const index = agentConfigs.findIndex(c => c.agent === config.agent);
                        newConfigs[index] = updatedConfig;
                        setAgentConfigs(newConfigs);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Step 5: What Happens Next Preview */}
              <div className="bg-card/30 border border-border/30 rounded-2xl p-8 space-y-6">
                <h3 className="text-xl font-semibold text-center">What Happens Next</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-medium">AI Panel Debates</h4>
                    <p className="text-xs text-muted-foreground">
                      8 expert AIs analyze your idea from different angles - design, tech, legal, business
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <h4 className="font-medium">Real-Time Research</h4>
                    <p className="text-xs text-muted-foreground">
                      Every decision validated against latest frameworks, security practices, and tech trends
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <h4 className="font-medium">15-Section Spec</h4>
                    <p className="text-xs text-muted-foreground">
                      Production-ready specification with architecture, security, testing, and deployment plans
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Floating Dialogue Panel - only in panels mode when not on landing */}
      {viewMode === 'panels' && !showLanding && (
        <DialoguePanel 
          entries={dialogueEntries}
          isOpen={isDialogueOpen}
          onToggle={() => setIsDialogueOpen(!isDialogueOpen)}
        />
      )}
      {process.env.NODE_ENV === 'development' && (
        <button onClick={testWorkflow} className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded">Test Workflow</button>
      )}
    </div>
  );
};

export default Index;
