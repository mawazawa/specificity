import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReflectionPanelProps {
  reflection: string;
}

export const ReflectionPanel = ({ reflection }: ReflectionPanelProps) => {
  if (!reflection) return null;

  // Parse the reflection to extract critiques and prompts
  const sections = reflection.split('\n\n');
  const critiques = sections.filter(s => s.toLowerCase().includes('critique') || s.includes('1.') || s.includes('2.') || s.includes('3.'));
  const prompts = sections.filter(s => s.toLowerCase().includes('prompt') || s.toLowerCase().includes('version'));

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-card backdrop-blur-sm border-accent/30">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold text-accent">
              Self-Reflection & Improvement
            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-agent-designer" />
              Critical Feedback (User Perspective)
            </h3>
            
            <div className="grid gap-4">
              {critiques.map((critique, i) => (
                <div key={i} className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{critique}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Improved Prompts (10-20x Better)
            </h3>
            
            <div className="grid gap-4">
              {prompts.map((prompt, i) => (
                <div key={i} className="p-6 bg-background/50 rounded-lg border border-primary/30 font-mono text-sm">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{prompt}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
