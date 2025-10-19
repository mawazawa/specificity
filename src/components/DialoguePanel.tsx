import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, X, Sparkles, HelpCircle, Lightbulb, CheckCircle, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { AgentType } from "@/types/spec";
import elonAvatar from "@/assets/elon-musk.png";
import steveAvatar from "@/assets/steve-jobs.png";
import oprahAvatar from "@/assets/oprah.png";
import zahaAvatar from "@/assets/agent-placeholder.png";
import jonyAvatar from "@/assets/jony-ive.png";
import bartlettAvatar from "@/assets/steven-bartlett.png";
import amalAvatar from "@/assets/amal-clooney.png";

export interface DialogueEntry {
  agent: AgentType;
  message: string;
  timestamp: string;
  type: 'question' | 'answer' | 'vote' | 'reasoning';
}

interface DialoguePanelProps {
  entries: DialogueEntry[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const agentColors: Record<AgentType, string> = {
  elon: "from-purple-500/20 to-fuchsia-500/20",
  steve: "from-blue-500/20 to-cyan-500/20",
  oprah: "from-amber-500/20 to-orange-500/20",
  zaha: "from-emerald-500/20 to-teal-500/20",
  jony: "from-slate-400/20 to-zinc-400/20",
  bartlett: "from-red-500/20 to-rose-500/20",
  amal: "from-indigo-500/20 to-violet-500/20",
};

const agentNames: Record<AgentType, string> = {
  elon: "Elon Musk",
  steve: "Steve Jobs",
  oprah: "Oprah Winfrey",
  zaha: "Zaha Hadid",
  jony: "Jony Ive",
  bartlett: "Steven Bartlett",
  amal: "Amal Clooney",
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

export const DialoguePanel = ({ entries, isOpen = false, onToggle }: DialoguePanelProps) => {
  const [expanded, setExpanded] = useState(isOpen);

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'answer': return <Lightbulb className="w-3.5 h-3.5 text-blue-400" />;
      case 'vote': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'reasoning': return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-foreground/50" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-2xl border border-border/40 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">Live Roundtable</h3>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {entries.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggle}
                  className="h-8 w-8 p-0 hover:bg-background/40 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Dialogue Content */}
              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-3">
                  {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground/60">No dialogue yet</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Panel discussion will appear here</p>
                    </div>
                  ) : (
                    entries.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3"
                      >
                        <div className="relative w-12 h-12 shrink-0">
                          <Avatar className="w-12 h-12 ring-2 ring-border/30 shadow-lg">
                            <AvatarImage src={agentAvatars[entry.agent]} alt={agentNames[entry.agent]} />
                            <AvatarFallback className="text-xs">{agentNames[entry.agent][0]}</AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 rounded-full pointer-events-none" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground/90">
                              {agentNames[entry.agent]}
                            </span>
                            {getTypeIcon(entry.type)}
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {entry.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/50 ml-auto">
                              {new Date(entry.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <Card className={`p-3 bg-gradient-to-br ${agentColors[entry.agent]} border border-border/10 rounded-xl`}>
                            <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70 prose-p:leading-relaxed prose-p:my-1">
                              <ReactMarkdown>{entry.message}</ReactMarkdown>
                            </div>
                          </Card>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border/20 bg-gradient-to-r from-transparent to-primary/5">
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  🔴 Live roundtable • Real-time conversation
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleToggle}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 hover:from-primary/95 hover:via-primary/85 hover:to-primary/75 shadow-[0_8px_24px_-4px] shadow-primary/40 hover:shadow-[0_12px_32px_-4px] hover:shadow-primary/50 border-2 border-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent rounded-full" />
              <MessageSquare className="w-6 h-6 relative z-10" />
              {entries.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background shadow-lg">
                  {entries.length}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
