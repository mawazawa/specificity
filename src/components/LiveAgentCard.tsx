import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";
import agentPlaceholder from "@/assets/agent-placeholder.png";

const agentInfo = {
  elon: { name: "Elon", color: "from-purple-500 to-pink-500" },
  steve: { name: "Steve", color: "from-blue-500 to-cyan-500" },
  oprah: { name: "Oprah", color: "from-amber-500 to-orange-500" },
  zaha: { name: "Zaha", color: "from-emerald-500 to-teal-500" },
  jony: { name: "Jony", color: "from-slate-500 to-zinc-500" },
  bartlett: { name: "Steven", color: "from-red-500 to-rose-500" },
  amal: { name: "Amal", color: "from-indigo-500 to-violet-500" },
};

interface LiveAgentCardProps {
  agent: string;
  output?: string;
  vote?: { approved: boolean; reasoning: string };
  question?: string;
  isActive?: boolean;
}

export const LiveAgentCard = ({ agent, output, vote, question, isActive }: LiveAgentCardProps) => {
  const agentData = agentInfo[agent as keyof typeof agentInfo];
  
  return (
    <Card className={`p-3 bg-card/30 backdrop-blur-sm border transition-all duration-300 ${
      isActive ? 'border-primary/50 shadow-lg' : 'border-border/30'
    }`}>
      <div className="space-y-2">
        {/* Agent Header */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${agentData.color} flex items-center justify-center overflow-hidden p-0.5 shrink-0`}>
            <img src={agentPlaceholder} alt={agentData.name} className="w-full h-full object-cover rounded-sm" />
          </div>
          <span className="text-xs font-medium text-foreground">{agentData.name}</span>
          {isActive && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Question */}
        {question && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-muted-foreground/70 line-clamp-2 flex items-start gap-1"
          >
            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{question}</span>
          </motion.div>
        )}

        {/* Output Preview */}
        {output && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-foreground/60 line-clamp-2"
          >
            {output.slice(0, 80)}...
          </motion.div>
        )}

        {/* Vote */}
        {vote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            {vote.approved ? (
              <ThumbsUp className="w-3 h-3 text-green-500" />
            ) : (
              <ThumbsDown className="w-3 h-3 text-red-500" />
            )}
            <Badge variant={vote.approved ? "default" : "destructive"} className="text-[9px] px-1.5 py-0">
              {vote.approved ? "Approved" : "Dissent"}
            </Badge>
          </motion.div>
        )}
      </div>
    </Card>
  );
};
