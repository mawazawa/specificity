import { Card } from "@/components/ui/card";
import { Round } from "@/types/spec";
import { Circle, CheckCircle2, Loader2, PauseCircle } from "lucide-react";

interface RoundTrackerProps {
  rounds: Round[];
  currentRound: number;
}

const stageNames = {
  questions: "Clarifying Questions",
  research: "Exa Research",
  answers: "Agent Analysis",
  voting: "Consensus Vote",
  spec: "Spec Generation"
};

export const RoundTracker = ({ rounds, currentRound }: RoundTrackerProps) => {
  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
          Round Progress
        </h2>

        <div className="space-y-4">
          {rounds.map((round, index) => {
            const isCurrent = index === currentRound;
            const isComplete = round.status === 'complete';
            const isPaused = round.status === 'paused';

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-primary/60" />
                    ) : isPaused ? (
                      <PauseCircle className="w-5 h-5 text-accent/60" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/30" />
                    )}
                    <span className={`text-sm font-light uppercase tracking-wider ${
                      isCurrent ? 'text-foreground/90' : 'text-foreground/50'
                    }`}>
                      Round {round.roundNumber}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border/20" />
                </div>

                {isCurrent && (
                  <div className="ml-8 space-y-2">
                    <div className="text-xs text-foreground/60 uppercase tracking-wider">
                      {stageNames[round.stage]}
                    </div>
                    {round.userComment && (
                      <Card className="p-4 bg-accent/10 border-accent/20 rounded-fluid">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-accent/60">User Comment:</span>
                          <span className="text-xs text-foreground/70">{round.userComment}</span>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {isComplete && round.votes.length > 0 && (
                  <div className="ml-8 flex items-center gap-4 text-xs">
                    <span className="text-primary/50">
                      {round.votes.filter(v => v.approved).length} approved
                    </span>
                    <span className="text-destructive/50">
                      {round.votes.filter(v => !v.approved).length} dissented
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
