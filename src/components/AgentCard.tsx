import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/types/spec";
import { ChevronDown, ChevronUp, Settings, Sparkles } from "lucide-react";
import { NeumorphicSlider } from "./NeumorphicSlider";
import steveJobsAvatar from "@/assets/steve-jobs-nobg.png";
import oprahAvatar from "@/assets/oprah-nobg.png";
import stevenBartlettAvatar from "@/assets/steven-bartlett-nobg.png";
import jonyIveAvatar from "@/assets/jony-ive-nobg.png";
import amalClooneyAvatar from "@/assets/amal-clooney-nobg.png";
import elonMuskAvatar from "@/assets/elon-musk-nobg.png";
import agentPlaceholder from "@/assets/agent-placeholder.png";

const agentInfo = {
  elon: { name: "Elon Musk", role: "First Principles", color: "from-purple-500 via-fuchsia-500 to-pink-500", avatar: elonMuskAvatar },
  steve: { name: "Steve Jobs", role: "Product Vision", color: "from-blue-500 via-cyan-500 to-teal-500", avatar: steveJobsAvatar },
  oprah: { name: "Oprah Winfrey", role: "Human Impact", color: "from-amber-500 via-orange-500 to-red-500", avatar: oprahAvatar },
  zaha: { name: "Zaha Hadid", role: "Design Innovation", color: "from-emerald-500 via-teal-500 to-cyan-500", avatar: agentPlaceholder },
  jony: { name: "Jony Ive", role: "Simplicity & Craft", color: "from-slate-400 via-zinc-400 to-neutral-500", avatar: jonyIveAvatar },
  bartlett: { name: "Steven Bartlett", role: "Growth Strategy", color: "from-red-500 via-rose-500 to-pink-500", avatar: stevenBartlettAvatar },
  amal: { name: "Amal Clooney", role: "Ethics & Law", color: "from-indigo-500 via-violet-500 to-purple-500", avatar: amalClooneyAvatar },
};

interface AgentCardProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export const AgentCard = ({ config, onChange }: AgentCardProps) => {
  const agent = agentInfo[config.agent as keyof typeof agentInfo];
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/30 hover:border-primary/40 transition-all duration-700 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-primary/10">
      {/* Animated gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
      
      {/* Subtle glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      
      <div className="relative p-6 space-y-6">
        {/* Header with large avatar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Large avatar - 2x bigger */}
            <div className="relative group/avatar">
              <div className={`absolute -inset-1 bg-gradient-to-br ${agent.color} rounded-2xl opacity-75 group-hover/avatar:opacity-100 blur group-hover/avatar:blur-md transition-all duration-500`} />
              <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${agent.color} overflow-hidden shadow-2xl ring-2 ring-white/10 group-hover/avatar:ring-white/20 transition-all duration-500 transform group-hover/avatar:scale-105`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
                <img 
                  src={agent.avatar} 
                  alt={agent.name} 
                  className="relative w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full ring-2 ring-background shadow-lg animate-pulse" />
              </div>
            </div>

            {/* Agent info */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-lg font-bold text-foreground tracking-tight truncate">
                {agent.name}
              </h3>
              <p className="text-xs text-muted-foreground/90 uppercase tracking-widest font-semibold truncate">
                {agent.role}
              </p>
              
              {/* Status badge */}
              {config.enabled && (
                <div className="flex items-center gap-2 pt-1">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[10px] text-primary uppercase tracking-wider font-bold">
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enable switch */}
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
            className="shrink-0 data-[state=checked]:bg-primary shadow-lg"
          />
        </div>

        {/* Advanced settings - collapsible */}
        {config.enabled && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-300 group/btn"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Advanced Settings
                </span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-all" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-all" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-5 animate-slide-up px-2">
                {/* Temperature slider - neumorphic style */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      Temperature
                    </Label>
                    <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      {config.temperature.toFixed(2)}
                    </span>
                  </div>
                  <NeumorphicSlider
                    value={config.temperature}
                    onChange={(temperature) => onChange({ ...config, temperature })}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground/60 uppercase tracking-wider px-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
