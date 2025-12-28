import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Users, MessageSquare, Search, Vote, FileText } from "lucide-react";

interface StageIndicatorProps {
  stage: 'questions' | 'research' | 'answers' | 'voting' | 'spec';
  roundNumber: number;
}

const stageConfig = {
  questions: {
    icon: MessageSquare,
    label: "Clarifying Questions",
    description: "Panel members generating key questions",
    color: "from-purple-500/20 to-blue-500/20"
  },
  research: {
    icon: Search,
    label: "Research Phase",
    description: "Deep research via Exa on key topics",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  answers: {
    icon: Users,
    label: "Analysis Phase",
    description: "Each expert provides their perspective",
    color: "from-cyan-500/20 to-green-500/20"
  },
  voting: {
    icon: Vote,
    label: "Consensus Vote",
    description: "Panel votes on proceeding to spec",
    color: "from-green-500/20 to-yellow-500/20"
  },
  spec: {
    icon: FileText,
    label: "Specification",
    description: "Generating final specification",
    color: "from-yellow-500/20 to-orange-500/20"
  }
};

export const StageIndicator = ({ stage, roundNumber }: StageIndicatorProps) => {
  const config = stageConfig[stage];
  const Icon = config.icon;
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : `${prev  }.`);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className={`relative p-8 bg-gradient-to-br ${config.color} backdrop-blur-xl border border-border/30 rounded-fluid overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-fluid opacity-30 animate-morph" />
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-xl animate-pulse-glow rounded-full" />
            <div className="relative bg-background/80 backdrop-blur-sm p-4 rounded-full border border-accent/30">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-light text-foreground/90 uppercase tracking-wider">
                {config.label}
              </h3>
            </div>
            <p className="text-sm text-foreground/60">
              {config.description}{dots}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Round {roundNumber}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-4 h-1 bg-background/30 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%]"
            animate={{
              backgroundPosition: ["0% 0%", "200% 0%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ width: "100%" }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
