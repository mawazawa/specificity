import { Card } from "@/components/ui/card";
import { ResearchResult } from "@/types/spec";
import { ExternalLink, Search } from "lucide-react";

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
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 bg-background/20 rounded-fluid border border-border/10 hover:border-border/30 transition-all duration-500 group backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-light text-foreground/90 text-sm group-hover:text-primary transition-colors">
                    {result.title}
                  </h4>
                  <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                    {result.snippet}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </Card>
  );
};
