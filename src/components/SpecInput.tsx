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
    <Card className="p-12 bg-gradient-card backdrop-blur-xl border-border/30 rounded-fluid overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-fluid opacity-50 animate-morph" />
      <div className="relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <h1 className="text-6xl font-extralight tracking-tight text-primary">
              Specificity AI
            </h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wider uppercase">
            Precision Intelligence
          </p>
        </div>

        <div className="space-y-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Articulate your vision..."
            className="min-h-[180px] bg-background/30 border-border/20 focus:border-primary/30 resize-none text-base rounded-fluid backdrop-blur-sm transition-all duration-300 focus:bg-background/40"
            disabled={isLoading}
          />

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 text-sm py-7 rounded-fluid font-light tracking-wide uppercase"
          >
            {isLoading ? (
              <>
                <Zap className="w-4 h-4 mr-3 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-3" />
                Generate
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {[
            { text: "Scale" },
            { text: "Business" },
            { text: "Technical" },
            { text: "Design" },
            { text: "Strategy" },
            { text: "Legal" },
          ].map((agent, i) => (
            <div key={i} className="p-4 bg-secondary/20 rounded-fluid border border-border/10 backdrop-blur-sm transition-all duration-300 hover:bg-secondary/30">
              <span className="text-muted-foreground uppercase tracking-widest">{agent.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
