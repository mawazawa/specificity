import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Vote, AgentType } from "@/types/spec";
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, TrendingUp, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export const VotingPanel = ({ votes, roundNumber }: VotingPanelProps) => {
  const [expandedVotes, setExpandedVotes] = useState<Set<string>>(new Set());
  const approved = votes.filter(v => v.approved);
  const dissented = votes.filter(v => !v.approved);
  const approvalRate = (approved.length / votes.length) * 100;

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
    const snippet = vote.reasoning.split('\n')[0].slice(0, 80) + (vote.reasoning.length > 80 ? '...' : '');

    return (
      <motion.div
        key={vote.agent}
        initial={{ opacity: 0, x: isApproved ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ 
          delay: index * 0.08, 
          duration: 0.4,
          type: "spring",
          bounce: 0.3
        }}
      >
        <Card className={`p-5 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg ${
          isApproved 
            ? 'bg-gradient-to-br from-primary/5 via-background/40 to-background/20 border-primary/20 hover:border-primary/30' 
            : 'bg-gradient-to-br from-destructive/5 via-background/40 to-background/20 border-destructive/20 hover:border-destructive/30'
        } rounded-xl`}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-foreground/90 truncate">
                    {agentNames[vote.agent]}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                  {agentRoles[vote.agent]}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge 
                  variant={isApproved ? "default" : "destructive"} 
                  className="text-[10px] px-2 py-0.5"
                >
                  {isApproved ? 'Approved' : 'Dissent'}
                </Badge>
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(vote.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>

            <div className={`transition-all duration-300 ${isExpanded ? 'space-y-2' : ''}`}>
              {!isExpanded && (
                <p className="text-xs text-foreground/60 leading-relaxed">
                  {snippet}
                </p>
              )}
              
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70 prose-p:leading-relaxed prose-ul:text-xs prose-li:text-foreground/70"
                >
                  <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                </motion.div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleVoteExpansion(vote.agent)}
              className="w-full h-7 text-[10px] hover:bg-background/40 rounded-lg"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3 mr-1 rotate-180" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Read full reasoning
                </>
              )}
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
