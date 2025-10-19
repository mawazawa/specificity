import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Sparkles, Brain, Target } from "lucide-react";
import { motion } from "framer-motion";
import steveJobsAvatar from "@/assets/steve-jobs.png";
import oprahAvatar from "@/assets/oprah.png";
import stevenBartlettAvatar from "@/assets/steven-bartlett.png";
import agentPlaceholder from "@/assets/agent-placeholder.png";

const agentInfo = {
  elon: { name: "Elon", color: "from-purple-500 to-pink-500", avatar: agentPlaceholder },
  steve: { name: "Steve", color: "from-blue-500 to-cyan-500", avatar: steveJobsAvatar },
  oprah: { name: "Oprah", color: "from-amber-500 to-orange-500", avatar: oprahAvatar },
  zaha: { name: "Zaha", color: "from-emerald-500 to-teal-500", avatar: agentPlaceholder },
  jony: { name: "Jony", color: "from-slate-500 to-zinc-500", avatar: agentPlaceholder },
  bartlett: { name: "Steven", color: "from-red-500 to-rose-500", avatar: stevenBartlettAvatar },
  amal: { name: "Amal", color: "from-indigo-500 to-violet-500", avatar: agentPlaceholder },
};

const extractInsights = (text: string) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim());
};

const getTagsFromText = (text: string) => {
  const tags = [];
  if (text.toLowerCase().includes('scale') || text.toLowerCase().includes('growth')) {
    tags.push({ label: 'Scale', icon: Target });
  }
  if (text.toLowerCase().includes('innovation') || text.toLowerCase().includes('ai')) {
    tags.push({ label: 'Innovation', icon: Sparkles });
  }
  if (text.toLowerCase().includes('ux') || text.toLowerCase().includes('design') || text.toLowerCase().includes('user')) {
    tags.push({ label: 'UX', icon: Brain });
  }
  return tags.slice(0, 2);
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
  const insights = output ? extractInsights(output) : [];
  const tags = output ? getTagsFromText(output) : [];
  
  return (
    <Card className={`p-3 bg-card/30 backdrop-blur-sm border transition-all duration-300 ${
      isActive ? 'border-primary/50 shadow-lg' : 'border-border/30'
    }`}>
      <div className="space-y-2">
        {/* Agent Header */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${agentData.color} flex items-center justify-center overflow-hidden p-0.5 shrink-0`}>
            <img src={agentData.avatar} alt={agentData.name} className="w-full h-full object-cover rounded-sm" />
          </div>
          <span className="text-xs font-medium text-foreground">{agentData.name}</span>
          {isActive && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Question with Tag */}
        {question && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1">
              <MessageSquare className="w-2.5 h-2.5" />
              Question
            </Badge>
            <p className="text-[10px] text-muted-foreground/70 line-clamp-2 pl-2">
              {question}
            </p>
          </motion.div>
        )}

        {/* Output with Tags - Cascading */}
        {output && insights.length > 0 && (
          <div className="space-y-1.5">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.map((tag, idx) => {
                  const Icon = tag.icon;
                  return (
                    <motion.div
                      key={tag.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-1">
                        <Icon className="w-2.5 h-2.5" />
                        {tag.label}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {/* Cascading Insights */}
            <div className="space-y-1">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.15 }}
                  className={`text-[9px] text-foreground/60 line-clamp-1 pl-${idx * 2 + 2} border-l-2 border-primary/20`}
                  style={{ paddingLeft: `${(idx + 1) * 8}px` }}
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Vote with Badge */}
        {vote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 pt-1 border-t border-border/20"
          >
            {vote.approved ? (
              <ThumbsUp className="w-3 h-3 text-green-500" />
            ) : (
              <ThumbsDown className="w-3 h-3 text-red-500" />
            )}
            <Badge variant={vote.approved ? "default" : "destructive"} className="text-[9px] px-1.5 py-0">
              {vote.approved ? "Approved" : "Dissent"}
            </Badge>
            {vote.reasoning && (
              <span className="text-[9px] text-muted-foreground/60 line-clamp-1 flex-1">
                {vote.reasoning.slice(0, 40)}...
              </span>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
};
