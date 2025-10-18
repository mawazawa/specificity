import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/types/spec";

const agentInfo = {
  elon: { name: "Elon Musk", role: "Visionary", avatar: "🚀", color: "from-purple-500 to-pink-500" },
  steve: { name: "Steve Jobs", role: "Designer", avatar: "🎨", color: "from-blue-500 to-cyan-500" },
  oprah: { name: "Oprah Winfrey", role: "Humanitarian", avatar: "💫", color: "from-amber-500 to-orange-500" },
  zaha: { name: "Zaha Hadid", role: "Architect", avatar: "🏛️", color: "from-emerald-500 to-teal-500" },
  jony: { name: "Jony Ive", role: "Craftsman", avatar: "✨", color: "from-slate-500 to-zinc-500" },
  bartlett: { name: "Steven Bartlett", role: "Entrepreneur", avatar: "💼", color: "from-red-500 to-rose-500" },
  amal: { name: "Amal Clooney", role: "Legal Expert", avatar: "⚖️", color: "from-indigo-500 to-violet-500" },
};

interface AgentCardProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export const AgentCard = ({ config, onChange }: AgentCardProps) => {
  const agent = agentInfo[config.agent as keyof typeof agentInfo];

  return (
    <Card className="group p-6 bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-xl border-border/30 rounded-fluid hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transform hover:translate-y-[-4px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-3xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] transform group-hover:scale-110 transition-transform duration-300`}>
              {agent.avatar}
            </div>
            <div>
              <h3 className="text-lg font-light text-foreground">{agent.name}</h3>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
            className="data-[state=checked]:bg-primary shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
          />
        </div>

        {/* Settings */}
        {config.enabled && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Temperature</Label>
                <span className="text-sm font-mono text-foreground/80">{config.temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[config.temperature]}
                onValueChange={([temperature]) => onChange({ ...config, temperature })}
                min={0}
                max={1}
                step={0.05}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">System Prompt</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
                className="min-h-[100px] bg-background/30 border-border/20 focus:border-primary/30 text-sm rounded-lg backdrop-blur-sm resize-none"
                placeholder="Define agent's perspective..."
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
