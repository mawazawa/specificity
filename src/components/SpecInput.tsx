import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Zap, Sparkles } from "lucide-react";

interface SpecInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

export const SpecInput = ({ onSubmit, isLoading }: SpecInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Multi-Agent Spec Generator
            </h1>
            <Sparkles className="w-8 h-8 text-accent animate-pulse-glow" />
          </div>
          <p className="text-muted-foreground text-lg">
            Groq-speed collaborative reasoning with Exa research integration
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your project, feature, or idea... Be as detailed or as brief as you want. The agents will ask clarifying questions and research to fill in the gaps."
            className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-lg"
            disabled={isLoading}
          />

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg py-6"
          >
            {isLoading ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-spin" />
                Agents Collaborating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Spec
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
          {[
            { icon: "🚀", text: "Elon: Scale & Architecture" },
            { icon: "💰", text: "Cuban: Business Model" },
            { icon: "⚡", text: "Dev: Technical Excellence" },
            { icon: "🎨", text: "Designer: UX & Visual" },
            { icon: "🔥", text: "Entrepreneur: Ship Fast" },
            { icon: "⚖️", text: "Legal: Evidence-Based" },
          ].map((agent, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/30">
              <span className="text-xl">{agent.icon}</span>
              <span className="text-xs">{agent.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
