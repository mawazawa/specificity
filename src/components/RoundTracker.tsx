import { Card } from "@/components/ui/card";
import { Round } from "@/types/spec";
import { CheckCircle2, Loader2, XCircle, MessageSquare, Search, Users, Vote, FileText, ShieldAlert, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

interface RoundTrackerProps {
  rounds: Round[];
  currentRound: number;
}

const stageIcons = {
  questions: MessageSquare,
  research: Search,
  challenge: ShieldAlert,
  answers: Users,
  review: ClipboardCheck,
  voting: Vote,
  spec: FileText
};

const stageNames = {
  questions: "Questions",
  research: "Research",
  challenge: "Challenge",
  answers: "Analysis",
  review: "Review",
  voting: "Voting",
  spec: "Spec"
};

export const RoundTracker = ({ rounds, currentRound }: RoundTrackerProps) => {
  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80 flex items-center gap-2">
          <div className="w-1 h-4 bg-accent rounded-full" />
          Timeline
        </h2>

        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent" />

          {rounds.map((round, index) => {
            const isCurrent = index === currentRound;
            const isComplete = round.status === 'complete';
            const _isPaused = round.status === 'paused';
            const StageIcon = stageIcons[round.stage];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-start gap-4">
                  {/* Timeline node */}
                  <div className="relative z-10">
                    {isComplete ? (
                      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 className="w-6 h-6 text-primary/70" />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/20 blur-lg animate-pulse-glow rounded-full" />
                        <div className="relative w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 text-accent animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-background/50 border-2 border-border/30 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-base font-light uppercase tracking-wider ${
                        isCurrent ? 'text-accent' : isComplete ? 'text-foreground/70' : 'text-foreground/40'
                      }`}>
                        Round {round.roundNumber}
                      </h3>
                      {isCurrent && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                          <StageIcon className="w-3 h-3 text-accent" />
                          <span className="text-xs text-accent uppercase tracking-widest">
                            {stageNames[round.stage]}
                          </span>
                        </div>
                      )}
                    </div>

                    {round.userComment && (
                      <Card className="p-4 mb-3 bg-accent/5 border-accent/20 rounded-fluid">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-accent/60 mt-0.5" />
                          <div>
                            <div className="text-xs text-accent/60 uppercase tracking-wider mb-1">User Input</div>
                            <p className="text-sm text-foreground/70">{round.userComment}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {isComplete && round.votes.length > 0 && (
                      <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary/50" />
                          <span className="text-primary/70 uppercase tracking-wider">
                            {round.votes.filter(v => v.approved).length} Approved
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-destructive/50" />
                          <span className="text-destructive/70 uppercase tracking-wider">
                            {round.votes.filter(v => !v.approved).length} Dissented
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
