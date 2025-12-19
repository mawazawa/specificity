import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Vote, AgentType } from "@/types/spec";
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, TrendingUp, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import elonAvatar from "@/assets/optimized/elon-musk.webp";
import steveAvatar from "@/assets/optimized/steve-jobs.webp";
import oprahAvatar from "@/assets/optimized/oprah.webp";
import zahaAvatar from "@/assets/optimized/agent-placeholder.webp";
import jonyAvatar from "@/assets/optimized/jony-ive.webp";
import bartlettAvatar from "@/assets/optimized/steven-bartlett.webp";
import amalAvatar from "@/assets/optimized/amal-clooney.webp";

interface VotingPanelProps {
  votes: Vote[];
  roundNumber: number;
}

const agentNames: Record<AgentType, string> = {
  elon: "Elon Musk",
  steve: "Steve Jobs",
  oprah: "Oprah Winfrey",
  zaha: "Zaha Hadid",
  jony: "Jony Ive",
  bartlett: "Steven Bartlett",
  amal: "Amal Clooney",
};

const agentRoles: Record<AgentType, string> = {
  elon: "First Principles",
  steve: "Product Vision",
  oprah: "Human Impact",
  zaha: "Design Innovation",
  jony: "Simplicity & Craft",
  bartlett: "Growth Strategy",
  amal: "Ethics & Law",
};

const agentAvatars: Record<AgentType, string> = {
  elon: elonAvatar,
  steve: steveAvatar,
  oprah: oprahAvatar,
  zaha: zahaAvatar,
  jony: jonyAvatar,
  bartlett: bartlettAvatar,
  amal: amalAvatar,
};

export const VotingPanel = ({ votes, roundNumber }: VotingPanelProps) => {
  const [expandedVotes, setExpandedVotes] = useState<Set<string>>(new Set());
  const approved = votes.filter(v => v.approved);
  const dissented = votes.filter(v => !v.approved);
  const approvalRate = votes.length > 0 ? (approved.length / votes.length) * 100 : 0;

  const toggleVoteExpansion = (agent: string) => {
    setExpandedVotes(prev => {
      const next = new Set(prev);
      if (next.has(agent)) {
        next.delete(agent);
      } else {
        next.add(agent);
      }
      return next;
    });
  };

  const renderVoteCard = (vote: Vote, index: number, isApproved: boolean) => {
    const isExpanded = expandedVotes.has(vote.agent);

    return (
      <motion.div
        key={vote.agent}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: index * 0.1, 
          duration: 0.5,
          type: "spring",
          bounce: 0.35
        }}
      >
        <Card className={`overflow-hidden backdrop-blur-sm border transition-all duration-300 ${
          isApproved 
            ? 'bg-gradient-to-br from-primary/10 via-background/60 to-background/30 border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10' 
            : 'bg-gradient-to-br from-destructive/10 via-background/60 to-background/30 border-destructive/30 hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/10'
        } rounded-2xl`}>
          {/* Agent Header Card */}
          <div className="p-4 bg-gradient-to-r from-background/40 to-transparent border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0">
                <Avatar className="w-14 h-14 ring-2 ring-border/40 shadow-xl">
                  <AvatarImage src={agentAvatars[vote.agent]} alt={agentNames[vote.agent]} />
                  <AvatarFallback className="text-sm">{agentNames[vote.agent][0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 rounded-full pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {agentNames[vote.agent]}
                  </span>
                  <Badge 
                    variant={isApproved ? "default" : "destructive"} 
                    className="text-[9px] px-2 py-0"
                  >
                    {isApproved ? 'Approved' : 'Dissent'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">
                  {agentRoles[vote.agent]}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/50 shrink-0">
                {new Date(vote.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>

          {/* Nested Reasoning Card */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Card className="p-4 bg-background/50 border-border/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground/90">Detailed Reasoning</h4>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70 prose-p:leading-relaxed prose-ul:text-xs prose-li:text-foreground/70 prose-strong:text-foreground/90 prose-headings:text-sm prose-headings:text-foreground/80">
                      <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-foreground/60 leading-relaxed line-clamp-2"
                >
                  {vote.reasoning.split('\n')[0]}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleVoteExpansion(vote.agent)}
              className="relative w-full mt-3 h-9 text-[11px] rounded-full bg-gradient-to-b from-background/60 to-background/40 hover:from-background/80 hover:to-background/60 border border-border/30 hover:border-border/50 shadow-sm hover:shadow-md transition-all duration-300 active:scale-98"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent rounded-full pointer-events-none" />
              <span className="relative z-10">
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1.5 rotate-180 transition-transform inline-block" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1.5 transition-transform inline-block" />
                    Read detailed reasoning
                  </>
                )}
              </span>
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-2xl border border-border/30 rounded-2xl shadow-xl">
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Users className="w-5 h-5 text-primary" />
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground/90">
                Round {roundNumber} • Consensus Vote
              </h2>
            </div>
            <Badge variant="outline" className="text-xs px-3 py-1 gap-2">
              <TrendingUp className="w-3 h-3" />
              {approvalRate.toFixed(0)}% Approval
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-background/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${approvalRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                approvalRate >= 60 ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gradient-to-r from-destructive to-destructive/80'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-primary/80">
              <CheckCircle2 className="w-3 h-3" />
              {approved.length} Approved
            </span>
            <span className="flex items-center gap-2 text-destructive/80">
              <XCircle className="w-3 h-3" />
              {dissented.length} Dissented
            </span>
          </div>
        </div>

        {/* Voting Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-2 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Approved ({approved.length})
            </h3>
            <div className="space-y-3">
              {approved.length > 0 ? (
                approved.map((vote, index) => renderVoteCard(vote, index, true))
              ) : (
                <Card className="p-6 bg-background/20 border-border/10 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground/50">No approvals yet</p>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-2 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              Dissented ({dissented.length})
            </h3>
            <div className="space-y-3">
              {dissented.length > 0 ? (
                dissented.map((vote, index) => renderVoteCard(vote, index, false))
              ) : (
                <Card className="p-6 bg-background/20 border-border/10 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground/50">No dissents</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
