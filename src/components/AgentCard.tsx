import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/types/spec";
import steveJobsAvatar from "@/assets/steve-jobs.png";
import oprahAvatar from "@/assets/oprah.png";
import stevenBartlettAvatar from "@/assets/steven-bartlett.png";
import jonyIveAvatar from "@/assets/jony-ive.png";
import agentPlaceholder from "@/assets/agent-placeholder.png";

const agentInfo = {
  elon: { name: "Elon Musk", role: "First Principles", color: "from-purple-500 via-fuchsia-500 to-pink-500", avatar: agentPlaceholder },
  steve: { name: "Steve Jobs", role: "Product Vision", color: "from-blue-500 via-cyan-500 to-teal-500", avatar: steveJobsAvatar },
  oprah: { name: "Oprah Winfrey", role: "Human Impact", color: "from-amber-500 via-orange-500 to-red-500", avatar: oprahAvatar },
  zaha: { name: "Zaha Hadid", role: "Design Innovation", color: "from-emerald-500 via-teal-500 to-cyan-500", avatar: agentPlaceholder },
  jony: { name: "Jony Ive", role: "Simplicity & Craft", color: "from-slate-400 via-zinc-400 to-neutral-500", avatar: jonyIveAvatar },
  bartlett: { name: "Steven Bartlett", role: "Growth Strategy", color: "from-red-500 via-rose-500 to-pink-500", avatar: stevenBartlettAvatar },
  amal: { name: "Amal Clooney", role: "Ethics & Law", color: "from-indigo-500 via-violet-500 to-purple-500", avatar: agentPlaceholder },
};

interface AgentCardProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export const AgentCard = ({ config, onChange }: AgentCardProps) => {
  const agent = agentInfo[config.agent as keyof typeof agentInfo];

  return (
    <Card className="group relative p-4 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/60 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-primary/20 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-110 transition-all duration-500 p-[2px] shrink-0`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
              <img src={agent.avatar} alt={agent.name} className="relative w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate tracking-tight">{agent.name}</h3>
              <p className="text-xs text-muted-foreground/80 truncate font-medium">{agent.role}</p>
            </div>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
            className="data-[state=checked]:bg-primary shrink-0"
          />
        </div>

        {/* Settings */}
        {config.enabled && (
          <div className="space-y-3 animate-fade-in pt-2 border-t border-border/40">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Temperature</Label>
                <span className="text-xs font-mono text-foreground/80 bg-muted/50 px-2 py-0.5 rounded">{config.temperature.toFixed(2)}</span>
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

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">System Prompt</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
                className="min-h-[80px] bg-background/60 backdrop-blur-sm border-border/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 text-xs rounded-lg resize-none transition-all duration-300"
                placeholder="Define this agent's perspective and priorities..."
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
