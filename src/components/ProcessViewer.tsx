import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  type: 'question' | 'research' | 'answer' | 'vote';
  agent?: string;
  description: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
  result?: any;
}

interface ProcessViewerProps {
  tasks: Task[];
  currentStage: string;
}

export const ProcessViewer = ({ tasks, currentStage }: ProcessViewerProps) => {
  if (tasks.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '0.3s' }} />
          <h3 className="text-xs uppercase tracking-widest text-foreground/80">
            {currentStage}
          </h3>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/10"
              >
                {task.status === 'running' && (
                  <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" style={{ animationDuration: '0.3s' }} />
                )}
                {task.status === 'complete' && (
                  <CheckCircle2 className="w-3 h-3 text-green-500/80 flex-shrink-0" />
                )}
                {task.status === 'pending' && (
                  <Clock className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {task.agent && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0">
                        {task.agent}
                      </Badge>
                    )}
                    {task.type === 'research' && (
                      <Search className="w-3 h-3 text-primary/60" />
                    )}
                    <p className="text-xs text-foreground/70 truncate">{task.description}</p>
                  </div>
                </div>

                {task.duration !== undefined && task.status === 'complete' && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">
                    {task.duration}ms
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};
