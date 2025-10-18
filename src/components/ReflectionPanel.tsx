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
      <Card className="p-10 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Lightbulb className="w-5 h-5 text-foreground/60" />
            <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
              Refinement
            </h2>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-light text-foreground/70 flex items-center gap-3 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-primary/40" />
              Analysis
            </h3>
            
            <div className="grid gap-5">
              {critiques.map((critique, i) => (
                <div key={i} className="p-6 bg-secondary/10 rounded-fluid border border-border/10 backdrop-blur-sm">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-foreground/70 prose-p:text-xs prose-p:leading-relaxed prose-headings:font-light prose-headings:text-sm">
                    <ReactMarkdown>{critique}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 mt-10">
            <h3 className="text-xs font-light text-foreground/70 flex items-center gap-3 uppercase tracking-wider">
              <Code className="w-4 h-4 text-primary/40" />
              Enhanced Prompts
            </h3>
            
            <div className="grid gap-5">
              {prompts.map((prompt, i) => (
                <div key={i} className="p-7 bg-background/30 rounded-fluid border border-primary/10 font-mono text-xs backdrop-blur-sm">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:text-foreground/80 prose-p:text-xs prose-p:leading-loose prose-headings:font-light">
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
