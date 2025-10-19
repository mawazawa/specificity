import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { AgentType } from "@/types/spec";

interface DialogueEntry {
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

export const DialoguePanel = ({ entries, isOpen = false, onToggle }: DialoguePanelProps) => {
  const [expanded, setExpanded] = useState(isOpen);

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return '❓';
      case 'answer': return '💡';
      case 'vote': return '✓';
      case 'reasoning': return '🧠';
      default: return '💬';
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
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">Panel Dialogue</h3>
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
                        className={`p-4 rounded-xl bg-gradient-to-br ${agentColors[entry.agent]} border border-border/10 hover:border-border/30 transition-all duration-300`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{getTypeIcon(entry.type)}</span>
                              <span className="text-xs font-semibold text-foreground/90">
                                {agentNames[entry.agent]}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                {entry.type}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(entry.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="prose prose-sm prose-invert max-w-none prose-p:text-xs prose-p:text-foreground/70 prose-p:leading-relaxed">
                            <ReactMarkdown>{entry.message}</ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border/20 bg-gradient-to-r from-transparent to-primary/5">
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Live panel discussion • Real-time updates
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
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 border border-primary/20 transition-all duration-300 hover:scale-110"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <MessageSquare className="w-5 h-5 relative z-10" />
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
