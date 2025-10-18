import { Card } from "@/components/ui/card";
import { Vote, AgentType } from "@/types/spec";
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface VotingPanelProps {
  votes: Vote[];
  roundNumber: number;
}

const agentNames: Record<AgentType, string> = {
  elon: "Scale",
  cuban: "Business",
  dev: "Technical",
  designer: "Design",
  entrepreneur: "Strategy",
  legal: "Legal",
};

export const VotingPanel = ({ votes, roundNumber }: VotingPanelProps) => {
  const approved = votes.filter(v => v.approved);
  const dissented = votes.filter(v => !v.approved);

  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
            Round {roundNumber} Voting Results
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-primary/60">{approved.length} Approved</span>
            <span className="text-destructive/60">{dissented.length} Dissented</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xs font-light text-foreground/60 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary/40" />
              Approved
            </h3>
            {approved.map((vote) => (
              <Card key={vote.agent} className="p-5 bg-background/20 border-border/10 rounded-fluid">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light text-foreground/80">
                      {agentNames[vote.agent]}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(vote.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70">
                    <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-light text-foreground/60 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive/40" />
              Dissented
            </h3>
            {dissented.map((vote) => (
              <Card key={vote.agent} className="p-5 bg-destructive/5 border-destructive/20 rounded-fluid">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light text-foreground/80">
                      {agentNames[vote.agent]}
                    </span>
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(vote.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-destructive/70">
                    <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
