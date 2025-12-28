import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AgentConfig, AgentType } from "@/types/spec";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { mentorProfiles } from "@/types/mentor";
import { useState } from "react";
import { MentorContactCard } from "../mentor/MentorContactCard";
import { logger } from '@/lib/logger';
import { getAgentAvatar } from "@/lib/avatars";

interface MobileHeaderProps {
  agentConfigs: AgentConfig[];
  onAgentClick?: (agent: string) => void;
  onMenuClick?: () => void;
}

const agentAvatars: Record<string, string> = {
  elon: getAgentAvatar('elon'),
  steve: getAgentAvatar('steve'),
  oprah: getAgentAvatar('oprah'),
  zaha: getAgentAvatar('zaha'),
  jony: getAgentAvatar('jony'),
  bartlett: getAgentAvatar('bartlett'),
  amal: getAgentAvatar('amal'),
};

export const MobileHeader = ({ 
  agentConfigs, 
  onAgentClick,
  onMenuClick 
}: MobileHeaderProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const enabledAgents = agentConfigs.filter(c => c.enabled);

  const handleAvatarClick = (agent: string) => {
    setSelectedAgent(agent);
    onAgentClick?.(agent);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-xl border-b border-border/20">
        <div className="px-4 py-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-bold text-foreground">Advisory Panel</h1>
              <p className="text-[10px] text-muted-foreground">
                {enabledAgents.length} mentors active
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-full"
                onClick={onMenuClick}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Avatar Row */}
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {enabledAgents.map((config, index) => {
                const profile = mentorProfiles[config.agent as AgentType];
                if (!profile) return null;
                return (
                  <motion.div
                    key={config.agent}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                    onClick={() => handleAvatarClick(config.agent)}
                  >
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg">
                        <AvatarImage src={agentAvatars[config.agent]} alt={profile.name} />
                        <AvatarFallback className={`text-sm font-bold bg-gradient-to-br ${profile.gradient}`}>
                          {profile.name.split(' ').map(n => n[0] ?? '').join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${profile.gradient} border-2 border-background`} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground/70 max-w-[64px] text-center truncate">
                      {profile.name.split(' ')[0] ?? profile.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mentor Contact Card */}
      {selectedAgent && mentorProfiles[selectedAgent as keyof typeof mentorProfiles] && (
        <MentorContactCard
          profile={mentorProfiles[selectedAgent as keyof typeof mentorProfiles]}
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onStartChat={(agent) => {
            logger.debug('Start 1:1 chat with', agent);
            setSelectedAgent(null);
          }}
        />
      )}
    </>
  );
};
