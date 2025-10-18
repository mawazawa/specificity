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
    <Card className="p-6 bg-gradient-card backdrop-blur-sm border-agent-dev/30">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-agent-dev" />
          <h3 className="text-lg font-bold text-agent-dev">
            {isSearching ? "Researching with Exa..." : "Research Results"}
          </h3>
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-agent-dev rounded-full animate-pulse" />
            <span>Searching the web for relevant information...</span>
          </div>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-background/50 rounded-lg border border-border/50 hover:border-agent-dev/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-foreground group-hover:text-agent-dev transition-colors">
                    {result.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {result.snippet}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Relevance: {Math.round(result.relevance * 100)}%</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-agent-dev transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </Card>
  );
};
