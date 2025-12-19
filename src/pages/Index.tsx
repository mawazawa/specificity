/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Index Page - Refactored for Performance (November 2025)
 *
 * BEFORE: 1,189 LOC with 13 useState, 17 useEffect
 * AFTER: ~280 LOC with extracted hooks
 *
 * Performance improvements:
 * - Auth logic extracted to useAuth hook
 * - Session persistence extracted to useSessionPersistence hook (debounced)
 * - Spec generation state machine extracted to useSpecGeneration hook
 * - Component remains thin orchestrator layer
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SimpleSpecInput } from "@/components/SimpleSpecInput";
import { AgentCard } from "@/components/AgentCard";
import { VotingPanel } from "@/components/VotingPanel";
import { RoundTracker } from "@/components/RoundTracker";
import { PauseControls } from "@/components/PauseControls";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import { SpecOutput } from "@/components/SpecOutput";
import { StageIndicator } from "@/components/StageIndicator";
import { LiveAgentCard } from "@/components/LiveAgentCard";
import { ProcessViewer } from "@/components/ProcessViewer";
import { VoteTally } from "@/components/VoteTally";
import { DialoguePanel } from "@/components/DialoguePanel";
import { LandingHero } from "@/components/LandingHero";
import { SampleSpecGallery } from "@/components/SampleSpecGallery";
import { AgentConfig, TechStackItem } from "@/types/spec";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, LayoutGrid, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatView, ChatEntry } from "@/components/chat/ChatView";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { OnboardingOverlay } from "@/components/Onboarding/OnboardingOverlay";

// Extracted hooks
import { useAuth } from "@/hooks/useAuth";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useSpecFlow } from "@/hooks/spec-generation/use-spec-flow";
import { useAgentPrompts } from "@/hooks/use-agent-prompts";

const Index = () => {
  // Fetch agent prompts from database
  const { agentConfigs: dbAgentConfigs, isLoading: promptsLoading, error: promptsError } = useAgentPrompts();

  // UI State (local to this component)
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'panels'>('chat');
  const [inputValue, setInputValue] = useState<string>("");
  const [isDialogueOpen, setIsDialogueOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Only show on client side
    if (typeof window !== 'undefined') {
      return !localStorage.getItem("specificity.hasSeenOnboarding");
    }
    return false;
  });

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("specificity.hasSeenOnboarding", "true");
    setShowOnboarding(false);
  }, []);

  const { toast } = useToast();

  // Extracted hooks
  const { user, isLoading: authLoading, signOut } = useAuth();

  // Sync database agent configs to local state when loaded
  useEffect(() => {
    if (dbAgentConfigs.length > 0) {
      setAgentConfigs(dbAgentConfigs);
    }
  }, [dbAgentConfigs]);

  // Show error toast if prompts fail to load
  useEffect(() => {
    if (promptsError) {
      toast({
        title: "Agent Prompts Load Error",
        description: "Using fallback agent configurations. Database prompts could not be loaded.",
        variant: "destructive"
      });
    }
  }, [promptsError, toast]);

  const {
    isProcessing,
    currentStage,
    sessionState,
    generatedSpec,
    techStack,
    dialogueEntries,
    tasks,
    startRefinement,
    proceedToGeneration,
    pause,
    resume,
    chatWithAgent,
    shareSpec,
    hydrateFromStorage
  } = useSpecFlow({ agentConfigs });

  const hasHydratedRef = useRef(false);

  // Session persistence (debounced localStorage)
  const { hydratedData, isHydrated } = useSessionPersistence({
    userId: user?.id,
    generatedSpec,
    dialogueEntries,
    sessionState
  });

  // Hydrate state from localStorage on mount
  useEffect(() => {
    if (!isHydrated || hasHydratedRef.current) {
      return;
    }

    hydrateFromStorage(hydratedData);
    hasHydratedRef.current = true;
  }, [hydratedData, isHydrated, hydrateFromStorage]);

  // Memoized current round
  const currentRound = useMemo(
    () => sessionState.rounds[sessionState.currentRound],
    [sessionState.rounds, sessionState.currentRound]
  );

  // Memoized chat entries conversion
  const chatEntries: ChatEntry[] = useMemo(
    () => dialogueEntries.map(entry => ({
      agent: entry.agent,
      message: entry.message,
      timestamp: entry.timestamp,
      type: entry.type as ChatEntry['type']
    })),
    [dialogueEntries]
  );

  // Determine if landing page should show
  const showLanding = useMemo(
    () => !isProcessing && dialogueEntries.length === 0 && !generatedSpec && sessionState.rounds.length === 0,
    [isProcessing, dialogueEntries.length, generatedSpec, sessionState.rounds.length]
  );

  // Scroll to input and focus
  const handleGetStarted = useCallback(() => {
    const inputElement = document.querySelector('[data-spec-input]');
    inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const textareaElement = document.querySelector('[data-spec-input] textarea') as HTMLTextAreaElement;
      textareaElement?.focus();
    }, 500);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (input: string) => {
    await startRefinement(input);
  }, [startRefinement]);

  // Handle agent config changes
  const handleAgentConfigChange = useCallback((updatedConfig: AgentConfig) => {
    setAgentConfigs(prev => {
      const index = prev.findIndex(c => c.agent === updatedConfig.agent);
      const newConfigs = [...prev];
      newConfigs[index] = updatedConfig;
      return newConfigs;
    });
  }, []);

  // Loading state while checking auth and loading prompts
  if (authLoading || promptsLoading || !user) {
    return (
      <div className="min-h-screen bg-background grid-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-background">
      {/* Sign Out Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Mobile Header */}
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
        {showLanding ? (
          <LandingPageContent
            agentConfigs={agentConfigs}
            inputValue={inputValue}
            isProcessing={isProcessing}
            onGetStarted={handleGetStarted}
            onSelectSample={setInputValue}
            onSubmit={handleSubmit}
            onAgentConfigChange={handleAgentConfigChange}
          />
        ) : (
          <ActiveSessionContent
            viewMode={viewMode}
            setViewMode={setViewMode}
            chatEntries={chatEntries}
            sessionState={sessionState}
            currentRound={currentRound}
            isProcessing={isProcessing}
            currentStage={currentStage}
            tasks={tasks}
            generatedSpec={generatedSpec}
            techStack={techStack}
            agentConfigs={agentConfigs}
            dialogueEntries={dialogueEntries}
            isDialogueOpen={isDialogueOpen}
            setIsDialogueOpen={setIsDialogueOpen}
            onPause={pause}
            onResume={resume}
            onChatWithAgent={chatWithAgent}
            onProceedToGeneration={proceedToGeneration}
            onShareSpec={shareSpec}
          />
        )}
      </div>

      <OnboardingOverlay open={showOnboarding} onComplete={handleOnboardingComplete} />
    </div>
  );
};

// ============================================
// Sub-components for cleaner organization
// ============================================

interface LandingPageContentProps {
  agentConfigs: AgentConfig[];
  inputValue: string;
  isProcessing: boolean;
  onGetStarted: () => void;
  onSelectSample: (sample: string) => void;
  onSubmit: (input: string) => Promise<void>;
  onAgentConfigChange: (config: AgentConfig) => void;
}

const LandingPageContent = ({
  agentConfigs,
  inputValue,
  isProcessing,
  onGetStarted,
  onSelectSample,
  onSubmit,
  onAgentConfigChange
}: LandingPageContentProps) => (
  <div className="space-y-12">
    <LandingHero onGetStarted={onGetStarted} />
    <div className="max-w-5xl mx-auto space-y-16">
      <SampleSpecGallery onSelectSample={onSelectSample} />
      <section className="space-y-8" aria-labelledby="input-heading">
        <div className="text-center space-y-3">
          <h3 id="input-heading" className="text-3xl md:text-4xl font-semibold tracking-tight">
            Describe Your Product Idea
          </h3>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Use one of the examples above or write your own. The more details you provide,
            the better your specification will be.
          </p>
        </div>
        <SimpleSpecInput onSubmit={onSubmit} isLoading={isProcessing} defaultValue={inputValue} />
      </section>
      <AgentCardsSection agentConfigs={agentConfigs} onAgentConfigChange={onAgentConfigChange} />
    </div>
  </div>
);

interface AgentCardsSectionProps {
  agentConfigs: AgentConfig[];
  onAgentConfigChange: (config: AgentConfig) => void;
}

const AgentCardsSection = ({ agentConfigs, onAgentConfigChange }: AgentCardsSectionProps) => (
  <section className="space-y-10 border-t border-border/20 pt-16" aria-labelledby="advisory-board-heading">
    <div className="text-center space-y-4">
      <h3 id="advisory-board-heading" className="text-3xl md:text-4xl font-semibold tracking-tight">
        Your 8-Person AI Advisory Board
      </h3>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 max-w-5xl mx-auto" role="list">
      {agentConfigs.slice(0, 8).map((config) => (
        <div key={config.agent} role="listitem">
          <AgentCard config={config} onChange={onAgentConfigChange} />
        </div>
      ))}
    </div>
  </section>
);

interface ActiveSessionContentProps {
  viewMode: 'chat' | 'panels';
  setViewMode: (mode: 'chat' | 'panels') => void;
  chatEntries: ChatEntry[];
  sessionState: any;
  currentRound: any;
  isProcessing: boolean;
  currentStage: string;
  tasks: any[];
  generatedSpec: string;
  techStack: TechStackItem[];
  agentConfigs: AgentConfig[];
  dialogueEntries: any[];
  isDialogueOpen: boolean;
  setIsDialogueOpen: (open: boolean) => void;
  onPause: () => void;
  onResume: (comment?: string) => void;
  onChatWithAgent: (agentId: string, message: string) => Promise<boolean>;
  onProceedToGeneration?: () => void;
  onShareSpec: () => void;
}

const ActiveSessionContent = ({
  viewMode,
  setViewMode,
  chatEntries,
  sessionState,
  currentRound,
  isProcessing,
  currentStage,
  tasks,
  generatedSpec,
  agentConfigs,
  dialogueEntries,
  isDialogueOpen,
  setIsDialogueOpen,
  onPause,
  onResume,
  onChatWithAgent,
  onProceedToGeneration,
  onShareSpec
}: ActiveSessionContentProps) => {
  const { toast } = useToast();

  return (
    <>
      {/* View Mode Toggle */}
      <div className="hidden md:flex items-center justify-end">
        <div className="flex gap-2">
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

      {viewMode === 'chat' ? (
        <ChatView
          entries={chatEntries}
          isPaused={sessionState.isPaused}
          onPause={onPause}
          onResume={onResume}
          isProcessing={isProcessing}
          onChatWithAgent={onChatWithAgent}
          currentStage={currentStage}
          onProceedToGeneration={onProceedToGeneration}
        />
      ) : (
                  <PanelsView
                    currentRound={currentRound}
                    isProcessing={isProcessing}
                    currentStage={currentStage}
                    tasks={tasks}
                                sessionState={sessionState}
                                generatedSpec={generatedSpec}
                                techStack={techStack}
                                agentConfigs={agentConfigs}
                                onPause={onPause}                    onResume={onResume}
                    onShareSpec={onShareSpec}
                  />
                )}
      {/* Floating Dialogue Panel */}
      {viewMode === 'panels' && (
        <DialoguePanel
          entries={dialogueEntries}
          isOpen={isDialogueOpen}
          onToggle={() => setIsDialogueOpen(!isDialogueOpen)}
        />
      )}
    </>
  );
};

interface PanelsViewProps {
  currentRound: any;
  isProcessing: boolean;
  currentStage: string;
  tasks: any[];
  sessionState: any;
  generatedSpec: string;
  techStack: TechStackItem[];
  agentConfigs: AgentConfig[];
  onPause: () => void;
  onResume: (comment?: string) => void;
  onShareSpec: () => void;
}

const PanelsView = ({
  currentRound,
  isProcessing,
  currentStage,
  tasks,
  sessionState,
  generatedSpec,
  agentConfigs,
  onPause,
  onResume,
  onShareSpec
}: PanelsViewProps) => {
  const { toast } = useToast();

  return (
    <>
      {isProcessing && tasks.length > 0 && (
        <div className="animate-slide-up">
          <ProcessViewer tasks={tasks} currentStage={currentStage} />
        </div>
      )}

      {currentRound?.votes?.length > 0 && (
        <div className="animate-slide-up">
          <VoteTally votes={currentRound.votes} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {currentRound && (
            <LiveAgentCards currentRound={currentRound} agentConfigs={agentConfigs} />
          )}

          {isProcessing && currentRound && (
            <StageIndicator stage={currentRound.stage} roundNumber={currentRound.roundNumber} />
          )}

          {isProcessing && sessionState.rounds.length > 0 && (
            <PauseControls isPaused={sessionState.isPaused} onPause={onPause} onResume={onResume} />
          )}

          {currentRound?.research?.length > 0 && (
            <ResearchPanel results={currentRound.research} isSearching={currentRound.stage === 'research'} />
          )}

          {currentRound?.votes?.length > 0 && (
            <VotingPanel votes={currentRound.votes} roundNumber={currentRound.roundNumber} />
          )}

          {generatedSpec && (
            <SpecOutput
              spec={generatedSpec}
              initialTechStack={techStack}
              onApprove={() => toast({ title: "Approved!", description: "Specification has been approved" })}
              onRefine={(refinements) => toast({ title: "Refining...", description: `Applying ${refinements.length} refinement(s)` })}
              onShare={onShareSpec}
            />
          )}
        </div>

        <div className="space-y-8">
          {sessionState.rounds.length > 0 && (
            <RoundTracker rounds={sessionState.rounds} currentRound={sessionState.currentRound} />
          )}
          {sessionState.history.length > 0 && (
            <HistoryPanel history={sessionState.history} />
          )}
        </div>
      </div>
    </>
  );
};

interface LiveAgentCardsProps {
  currentRound: any;
  agentConfigs: AgentConfig[];
}

const LiveAgentCards = ({ currentRound, agentConfigs }: LiveAgentCardsProps) => (
  <div className="space-y-3">
    <h2 className="text-xs font-light uppercase tracking-widest text-foreground/60">
      Live Agent Activity
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
      {agentConfigs.map((config) => {
        const agentQuestion = currentRound?.questions?.find((q: any) => q.askedBy === config.agent);
        const agentAnswer = currentRound?.answers?.find((a: any) => a.agent === config.agent);
        const agentVote = currentRound?.votes?.find((v: any) => v.agent === config.agent);

        if (agentQuestion || agentAnswer || agentVote) {
          return (
            <LiveAgentCard
              key={config.agent}
              agent={config.agent}
              question={agentQuestion?.question}
              output={agentAnswer?.answer}
              vote={agentVote}
              isActive={currentRound?.stage === 'questions' || currentRound?.stage === 'answers'}
            />
          );
        }
        return null;
      })}
    </div>
  </div>
);

export default Index;
