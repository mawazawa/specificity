import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Expert } from "@/types/expert";
import { motion } from "framer-motion";
import { ExternalLink, Twitter, Linkedin, Youtube, Globe, BookOpen } from "lucide-react";
import { useState } from "react";

interface ExpertCardProps {
  expert: Expert;
  index: number;
}

const getLinkIcon = (type: string) => {
  switch (type) {
    case 'twitter': return Twitter;
    case 'linkedin': return Linkedin;
    case 'youtube': return Youtube;
    case 'biography': return BookOpen;
    default: return Globe;
  }
};

export const ExpertCard = ({ expert, index }: ExpertCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group h-full"
    >
      <Card
        className="relative overflow-hidden border-border/20 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm hover:from-card/90 hover:to-card/60 transition-all duration-500 h-full flex flex-col cursor-pointer hover:shadow-xl hover:scale-[1.02]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          <div className="absolute inset-0 border border-border/20 group-hover:border-border/40 rounded-lg transition-colors duration-500" />
        </div>

        <div className="relative p-6 space-y-4 flex-1 flex flex-col">
          {/* Avatar with status indicator */}
          <div className="relative mx-auto w-24 h-24 -mt-12">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-foreground/20 to-transparent shadow-2xl"
              style={{
                transform: 'translateY(8px)',
                filter: 'blur(16px)',
                opacity: 0.7
              }}
            />

            <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br ${expert.color} p-[3px] group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-background/95 to-card/95 p-[2px]">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-card to-background">
                  <img
                    src={expert.avatar}
                    alt={expert.name}
                    className="w-full h-full object-cover scale-105 grayscale-[40%] group-hover:grayscale-0 group-hover:scale-115 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/10" />
                </div>
              </div>
            </div>

            {/* Living/Historical indicator - ping fades after 3 pulses for visual calm */}
            {expert.alive && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-lg"
                   title="Currently active">
                <div className="w-full h-full rounded-full bg-green-400 opacity-75 animate-[ping_1s_ease-in-out_3]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center space-y-2 flex-1">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors duration-300">
                {expert.name}
              </h3>
              <p className="text-xs font-medium text-accent/80 mt-1">
                {expert.title}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              {expert.role}
            </p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              {expert.expertise.slice(0, isExpanded ? undefined : 2).map((skill, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 bg-accent/10 hover:bg-accent/20 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
              {!isExpanded && expert.expertise.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border-accent/30 text-accent/70"
                >
                  +{expert.expertise.length - 2}
                </Badge>
              )}
            </div>

            {/* Expanded Bio */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-3 space-y-3"
              >
                <p className="text-xs text-muted-foreground/90 leading-relaxed text-left px-2 border-l-2 border-accent/30">
                  {expert.bio}
                </p>

                {/* Links */}
                {expert.links.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {expert.links.map((link, i) => {
                      const Icon = getLinkIcon(link.type);
                      return (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8 text-xs hover:bg-accent/10 hover:text-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(link.url, '_blank');
                          }}
                        >
                          <Icon className="w-3 h-3 mr-2" />
                          {link.label}
                          <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-50" />
                        </Button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Expand indicator */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/70">
              {isExpanded ? 'Click to collapse' : 'Click to learn more'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
