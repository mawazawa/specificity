import { Card } from "@/components/ui/card";
import { HistoryEntry } from "@/types/spec";
import { FileText, MessageSquare, Vote as VoteIcon, GitBranch } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryPanelProps {
  history: HistoryEntry[];
}

const iconMap = {
  vote: VoteIcon,
  output: FileText,
  spec: GitBranch,
  'user-comment': MessageSquare,
};

export const HistoryPanel = ({ history }: HistoryPanelProps) => {
  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
          Session History
        </h2>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {history.map((entry, index) => {
              const Icon = iconMap[entry.type];
              return (
                <Card key={index} className="p-5 bg-background/20 border-border/10 rounded-fluid">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-foreground/40" />
                        <span className="text-xs font-light uppercase tracking-wider text-foreground/60">
                          {entry.type.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/50">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70">
                      <ReactMarkdown>{JSON.stringify(entry.data, null, 2)}</ReactMarkdown>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
