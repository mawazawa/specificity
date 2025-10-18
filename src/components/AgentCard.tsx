import { Brain, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AgentPerspective, AgentType } from "@/types/spec";

const agentConfig: Record<AgentType, { name: string; icon: string; color: string }> = {
  elon: { name: "Elon Musk", icon: "🚀", color: "agent-elon" },
  cuban: { name: "Mark Cuban", icon: "💰", color: "agent-cuban" },
  dev: { name: "Senior Dev", icon: "⚡", color: "agent-dev" },
  designer: { name: "UX Designer", icon: "🎨", color: "agent-designer" },
  entrepreneur: { name: "Entrepreneur", icon: "🔥", color: "agent-entrepreneur" },
  legal: { name: "Legal Expert", icon: "⚖️", color: "agent-legal" },
};

interface AgentCardProps {
  perspective: AgentPerspective;
}

export const AgentCard = ({ perspective }: AgentCardProps) => {
  const config = agentConfig[perspective.agent];
  const isActive = perspective.status === 'thinking';
  const isComplete = perspective.status === 'complete';

  return (
    <Card 
      className={`p-6 bg-gradient-card backdrop-blur-sm border-${config.color}/30 transition-all duration-300 ${
        isActive ? 'shadow-glow-primary ring-2 ring-primary/50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`text-4xl ${isActive ? 'animate-pulse-glow' : ''}`}>
          {config.icon}
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-lg text-${config.color}`}>
              {config.name}
            </h3>
            {isActive && (
              <div className="flex items-center gap-2 text-primary text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {isComplete && (
              <div className="flex items-center gap-2 text-agent-dev text-sm">
                <Brain className="w-4 h-4" />
                <span>Complete</span>
              </div>
            )}
          </div>

          {perspective.thinking && (
            <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground italic">
                {perspective.thinking}
              </p>
            </div>
          )}

          {perspective.response && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-foreground leading-relaxed">
                {perspective.response}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
