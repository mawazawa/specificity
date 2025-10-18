import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AgentPerspective, AgentType } from "@/types/spec";
import ReactMarkdown from "react-markdown";

const agentConfig: Record<AgentType, { name: string; color: string }> = {
  elon: { name: "Scale", color: "agent-elon" },
  cuban: { name: "Business", color: "agent-cuban" },
  dev: { name: "Technical", color: "agent-dev" },
  designer: { name: "Design", color: "agent-designer" },
  entrepreneur: { name: "Strategy", color: "agent-entrepreneur" },
  legal: { name: "Legal", color: "agent-legal" },
};

const getAgentColor = (agent: AgentType) => {
  return `border-l-${agentConfig[agent].color}`;
};

interface AgentCardProps {
  perspective: AgentPerspective;
}

export const AgentCard = ({ perspective }: AgentCardProps) => {
  const { agent, thinking, response, status } = perspective;
  const config = agentConfig[agent];

  return (
    <Card className={`p-8 border border-border/20 transition-all duration-500 rounded-fluid backdrop-blur-sm ${getAgentColor(agent)} hover:border-border/40`}>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${status === 'thinking' ? 'animate-pulse-glow' : ''} ${
              status === 'thinking' ? 'bg-primary/60' : 
              status === 'complete' ? 'bg-primary' : 'bg-muted'
            }`} />
            <h3 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">{config.name}</h3>
          </div>
          {status === 'thinking' && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
          )}
        </div>

        {thinking && status === 'thinking' && (
          <p className="text-xs text-muted-foreground/70 italic font-light">{thinking}</p>
        )}

        {response && (
          <div className="prose prose-sm prose-invert max-w-none prose-headings:font-light prose-headings:tracking-wide prose-p:text-foreground/80 prose-p:text-sm prose-p:leading-relaxed">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        )}
      </div>
    </Card>
  );
};
