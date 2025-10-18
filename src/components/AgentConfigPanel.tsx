import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AgentConfig, AgentType } from "@/types/spec";
import { Settings2 } from "lucide-react";

interface AgentConfigPanelProps {
  configs: AgentConfig[];
  onChange: (configs: AgentConfig[]) => void;
}

const agentNames: Record<AgentType, string> = {
  elon: "Scale",
  cuban: "Business",
  dev: "Technical",
  designer: "Design",
  entrepreneur: "Strategy",
  legal: "Legal",
};

export const AgentConfigPanel = ({ configs, onChange }: AgentConfigPanelProps) => {
  const updateConfig = (index: number, updates: Partial<AgentConfig>) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    onChange(newConfigs);
  };

  return (
    <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-foreground/60" />
          <h2 className="text-sm font-extralight uppercase tracking-widest text-foreground/80">
            Agent Configuration
          </h2>
        </div>

        <div className="grid gap-6">
          {configs.map((config, index) => (
            <Card key={config.agent} className="p-6 bg-background/20 border-border/10 rounded-fluid">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-light uppercase tracking-wider text-foreground/70">
                    {agentNames[config.agent]}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) => updateConfig(index, { enabled })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Temperature: {config.temperature.toFixed(2)}
                  </Label>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([temperature]) => updateConfig(index, { temperature })}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">System Prompt</Label>
                  <Textarea
                    value={config.systemPrompt}
                    onChange={(e) => updateConfig(index, { systemPrompt: e.target.value })}
                    className="min-h-[100px] bg-background/30 border-border/20 text-xs font-mono resize-none rounded-fluid"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};
