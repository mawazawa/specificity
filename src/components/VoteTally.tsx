import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";

interface Vote {
  agent: string;
  approved: boolean;
  reasoning: string;
  timestamp: string;
}

interface VoteTallyProps {
  votes: Vote[];
}

export const VoteTally = ({ votes }: VoteTallyProps) => {
  const approvedCount = votes.filter(v => v.approved).length;
  const totalCount = votes.length;
  const approvalRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

  return (
    <Card className="p-4 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-foreground/80">Consensus Vote</h3>
          <span className="text-xs font-mono text-foreground/70">
            {approvedCount}/{totalCount}
          </span>
        </div>

        {/* Vote Bar */}
        <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${approvalRate}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>

        {/* Vote Breakdown */}
        <div className="flex items-center justify-between gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3 h-3 text-green-500" />
            <span className="text-muted-foreground">{approvedCount} approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsDown className="w-3 h-3 text-red-500" />
            <span className="text-muted-foreground">{totalCount - approvedCount} dissent</span>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="text-center">
          <span className="text-lg font-light text-primary">{Math.round(approvalRate)}%</span>
          <span className="text-[10px] text-muted-foreground ml-2">approval</span>
        </div>
      </div>
    </Card>
  );
};
