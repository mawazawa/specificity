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
  result?: unknown;
}

interface ProcessViewerProps {
  tasks: Task[];
  currentStage: string;
}

export const ProcessViewer = ({ tasks, currentStage }: ProcessViewerProps) => {
  if (tasks.length === 0) return null;

  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;
  const progress = (completedTasks / tasks.length) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-2xl border border-border/30 rounded-2xl shadow-xl">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '0.6s' }} />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground/90">
                {currentStage}
              </h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {runningTasks} running • {completedTasks}/{tasks.length} complete
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary/80 tabular-nums">
              {progress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-background/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full"
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  task.status === 'complete' 
                    ? 'bg-primary/5 border-primary/20' 
                    : task.status === 'running'
                    ? 'bg-background/40 border-primary/30 shadow-sm shadow-primary/10'
                    : 'bg-background/20 border-border/10'
                }`}
              >
                <div className="shrink-0">
                  {task.status === 'running' && (
                    <div className="relative">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '0.6s' }} />
                      <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full" />
                    </div>
                  )}
                  {task.status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                  {task.status === 'pending' && (
                    <Clock className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {task.agent && (
                      <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-medium">
                        {task.agent}
                      </Badge>
                    )}
                    {task.type === 'research' && (
                      <Search className="w-3 h-3 text-primary/60" />
                    )}
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-1">{task.description}</p>
                </div>

                {task.duration !== undefined && task.status === 'complete' && (
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-1 rounded">
                      {task.duration.toFixed(0)}ms
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};
