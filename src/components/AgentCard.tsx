import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/types/spec";
import steveJobsAvatar from "@/assets/steve-jobs.png";
import oprahAvatar from "@/assets/oprah.png";
import stevenBartlettAvatar from "@/assets/steven-bartlett.png";
import agentPlaceholder from "@/assets/agent-placeholder.png";

const agentInfo = {
  elon: { name: "Elon Musk", role: "Visionary", color: "from-purple-500 to-pink-500", avatar: agentPlaceholder },
  steve: { name: "Steve Jobs", role: "Designer", color: "from-blue-500 to-cyan-500", avatar: steveJobsAvatar },
  oprah: { name: "Oprah Winfrey", role: "Humanitarian", color: "from-amber-500 to-orange-500", avatar: oprahAvatar },
  zaha: { name: "Zaha Hadid", role: "Architect", color: "from-emerald-500 to-teal-500", avatar: agentPlaceholder },
  jony: { name: "Jony Ive", role: "Craftsman", color: "from-slate-500 to-zinc-500", avatar: agentPlaceholder },
  bartlett: { name: "Steven Bartlett", role: "Entrepreneur", color: "from-red-500 to-rose-500", avatar: stevenBartlettAvatar },
  amal: { name: "Amal Clooney", role: "Legal Expert", color: "from-indigo-500 to-violet-500", avatar: agentPlaceholder },
};

interface AgentCardProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export const AgentCard = ({ config, onChange }: AgentCardProps) => {
  const agent = agentInfo[config.agent as keyof typeof agentInfo];

  return (
    <Card className="group p-3 bg-card/50 backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <div className="space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-200 p-0.5 shrink-0`}>
              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover rounded-md" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
            </div>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
            className="data-[state=checked]:bg-primary shrink-0"
          />
        </div>

        {/* Compact Settings */}
        {config.enabled && (
          <div className="space-y-2 animate-fade-in pt-1 border-t border-border/30">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Temp</Label>
                <span className="text-xs font-mono text-foreground/70">{config.temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.temperature]}
                onValueChange={([temperature]) => onChange({ ...config, temperature })}
                min={0}
                max={1}
                step={0.05}
                className="py-1"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Prompt</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
                className="min-h-[60px] bg-background/50 border-border/30 focus:border-primary/50 text-xs rounded-md resize-none"
                placeholder="Define perspective..."
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
