import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MessageSquare, Sparkles } from "lucide-react";
import { MentorProfile } from "@/types/mentor";
import { useState } from "react";
import { motion } from "framer-motion";

interface MentorContactCardProps {
  profile: MentorProfile;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (agent: string) => void;
}

export const MentorContactCard = ({ 
  profile, 
  isOpen, 
  onClose,
  onStartChat 
}: MentorContactCardProps) => {
  const [parameters, setParameters] = useState(profile.parameters);

  const handleParameterChange = (index: number, newValue: number[]) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], value: newValue[0] };
    setParameters(updated);
  };

  const resetToDefault = () => {
    setParameters(profile.parameters);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-gradient-to-br from-background via-background/95 to-background/90 border-l border-border/20">
        <SheetHeader className="space-y-4 pb-6 border-b border-border/20">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-xl">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/30 to-primary/10">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${profile.gradient} border-2 border-background flex items-center justify-center`}>
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-2xl font-bold text-foreground mb-1">
                {profile.name}
              </SheetTitle>
              <Badge variant="secondary" className="mb-2 rounded-full px-3 py-1">
                {profile.title}
              </Badge>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                {profile.bio}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                Core Parameters
              </h3>
              <Button 
                onClick={resetToDefault} 
                variant="ghost" 
                size="sm"
                className="text-xs h-7 rounded-full px-3"
              >
                Reset
              </Button>
            </div>
            
            <div className="space-y-5">
              {parameters.map((param, index) => (
                <motion.div
                  key={param.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/20 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{param.icon}</span>
                      <span className="text-sm font-medium text-foreground">
                        {param.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums min-w-[2ch]">
                      {param.value}
                    </span>
                  </div>
                  
                  <Slider
                    value={[param.value]}
                    onValueChange={(val) => handleParameterChange(index, val)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {param.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3 border-t border-border/20">
            <Button 
              onClick={() => onStartChat?.(profile.agent)}
              className="w-full h-12 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg shadow-primary/20 text-base font-semibold"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start 1:1 Chat
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full h-11 rounded-full border-border/30"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
