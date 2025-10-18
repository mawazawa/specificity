import { useState } from "react";
import { SpecInput } from "@/components/SpecInput";
import { AgentCard } from "@/components/AgentCard";
import { ResearchPanel } from "@/components/ResearchPanel";
import { SpecOutput } from "@/components/SpecOutput";
import { ReflectionPanel } from "@/components/ReflectionPanel";
import { AgentPerspective, ResearchResult } from "@/types/spec";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [perspectives, setPerspectives] = useState<AgentPerspective[]>([]);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [spec, setSpec] = useState("");
  const [reflection, setReflection] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (input: string) => {
    setIsProcessing(true);
    setPerspectives([]);
    setResearchResults([]);
    setSpec("");
    setReflection("");

    try {
      // Stage 1: Research with Exa
      setCurrentStage("Researching with Exa...");
      setIsResearching(true);
      
      const { data: researchData, error: researchError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'research' } }
      );

      if (researchError) throw researchError;

      const research = researchData.researchResults.map((r: any) => ({
        title: r.title || 'Research Result',
        url: r.url || '',
        snippet: r.text || r.snippet || 'No description available',
        relevance: r.score || 0.8,
      }));
      
      setResearchResults(research);
      setIsResearching(false);

      // Stage 2: Multi-agent analysis
      setCurrentStage("Agents collaborating at Groq speed...");
      
      // Initialize agent cards with thinking state
      const initialAgents: AgentPerspective[] = [
        { agent: 'elon', thinking: 'Analyzing scalability...', response: '', status: 'thinking' },
        { agent: 'cuban', thinking: 'Evaluating business model...', response: '', status: 'thinking' },
        { agent: 'dev', thinking: 'Reviewing technical approach...', response: '', status: 'thinking' },
        { agent: 'designer', thinking: 'Assessing UX...', response: '', status: 'thinking' },
        { agent: 'entrepreneur', thinking: 'Identifying MVP...', response: '', status: 'thinking' },
        { agent: 'legal', thinking: 'Checking compliance...', response: '', status: 'thinking' },
      ];
      setPerspectives(initialAgents);

      const { data: agentData, error: agentError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'agents' } }
      );

      if (agentError) throw agentError;
      setPerspectives(agentData.perspectives);

      // Stage 3: Generate comprehensive spec
      setCurrentStage("Synthesizing comprehensive spec...");
      
      const { data: specData, error: specError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: input, stage: 'spec' } }
      );

      if (specError) throw specError;
      setSpec(specData.spec);

      // Stage 4: Self-reflection and improvement
      setCurrentStage("Self-reflecting and generating improvements...");
      
      const { data: reflectionData, error: reflectionError } = await supabase.functions.invoke(
        'multi-agent-spec',
        { body: { userInput: specData.spec, stage: 'reflection' } }
      );

      if (reflectionError) throw reflectionError;
      setReflection(reflectionData.reflection);

      setCurrentStage("");
      
      toast({
        title: "Spec Generation Complete! 🚀",
        description: "Multi-agent analysis finished with Exa research integration",
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate spec",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-12">
        <SpecInput onSubmit={handleSubmit} isLoading={isProcessing} />

        {currentStage && (
          <div className="flex items-center justify-center gap-4 p-8 bg-gradient-card rounded-fluid border border-border/10 backdrop-blur-xl">
            <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
            <span className="text-xs font-light uppercase tracking-widest text-foreground/70">{currentStage}</span>
          </div>
        )}

        {researchResults.length > 0 && (
          <div className="animate-slide-up">
            <ResearchPanel results={researchResults} isSearching={isResearching} />
          </div>
        )}

        {perspectives.length > 0 && (
          <div className="space-y-10 animate-slide-up">
            <h2 className="text-sm font-extralight text-center uppercase tracking-[0.3em] text-foreground/60">
              Perspectives
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {perspectives.map((perspective, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <AgentCard perspective={perspective} />
                </div>
              ))}
            </div>
          </div>
        )}

        {spec && (
          <div className="animate-slide-up">
            <SpecOutput spec={spec} />
          </div>
        )}

        {reflection && (
          <div className="animate-slide-up">
            <ReflectionPanel reflection={reflection} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
