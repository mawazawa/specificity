import { Card } from "@/components/ui/card";
import { ResearchResult } from "@/types/spec";
import { Search, Wrench } from "lucide-react";

interface ResearchPanelProps {
  results: ResearchResult[];
  isSearching: boolean;
}

export const ResearchPanel = ({ results, isSearching }: ResearchPanelProps) => {
  if (!isSearching && results.length === 0) {
    return null;
  }

  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-foreground/60" />
          <h3 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
            {isSearching ? "Research" : "Intelligence"}
          </h3>
        </div>

        {isSearching && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse-glow" />
            <span className="font-light">Gathering data...</span>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-5 bg-background/20 rounded-fluid border border-border/10 transition-all duration-500 backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-light text-foreground/90 text-sm mb-1">
                      {result.expertName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <span>{result.model}</span>
                      <span>•</span>
                      <span>{(result.duration / 1000).toFixed(1)}s</span>
                      <span>•</span>
                      <span>${result.cost.toFixed(4)}</span>
                    </div>
                  </div>
                  {result.toolsUsed && result.toolsUsed.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Wrench className="w-3 h-3" />
                      <span>{result.toolsUsed.length} tools</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-4">
                  {result.findings}
                </p>

                {result.toolsUsed && result.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.toolsUsed.map((tool, toolIndex) => (
                      <span
                        key={toolIndex}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                          tool.success
                            ? 'bg-primary/10 text-primary/90'
                            : 'bg-destructive/10 text-destructive/90'
                        }`}
                      >
                        {tool.tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
