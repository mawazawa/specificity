import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ExternalLink, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Expert } from "@/types/expert";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ExpertCardProps {
  expert: Expert;
  index: number;
}

const getLinkIcon = (type: string) => {
  switch (type) {
    case 'twitter': return Twitter;
    case 'linkedin': return Linkedin;
    case 'youtube': return Youtube;
    case 'website': return Globe;
    case 'biography': return ExternalLink;
    default: return ExternalLink;
  }
};

const getTooltipText = (type: string) => {
  switch (type) {
    case 'twitter': return 'Follow on Twitter/X';
    case 'linkedin': return 'View LinkedIn profile';
    case 'youtube': return 'Watch on YouTube';
    case 'website': return 'Visit official website';
    case 'biography': return 'Read full biography';
    default: return 'Learn more';
  }
};

export const ExpertCard = ({ expert, index }: ExpertCardProps) => {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 h-full max-w-sm">
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
          
          <div className="relative p-5 space-y-4">
            {/* Compact Avatar */}
            <div className="flex items-start gap-4">
              <div className="relative group/avatar flex-shrink-0">
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${expert.color} rounded-2xl opacity-60 group-hover/avatar:opacity-80 blur-sm transition-all duration-300`} />
                <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${expert.color} overflow-hidden shadow-lg ring-1 ring-background/20 group-hover/avatar:ring-primary/30 transition-all duration-300`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-background/5" />
                  <img 
                    src={expert.avatar} 
                    alt={expert.name}
                    loading="lazy"
                    className="relative w-full h-full object-cover object-center scale-110"
                  />
                  {expert.alive && (
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 rounded-full ring-2 ring-background shadow-lg animate-pulse" />
                  )}
                </div>
              </div>

              {/* Expert Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-lg font-bold text-foreground tracking-tight truncate">
                  {expert.name}
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold truncate">
                  {expert.title}
                </p>
                <p className="text-xs text-primary font-medium mt-0.5 truncate">
                  {expert.role}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-3">
              {expert.bio}
            </p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1.5">
              {expert.expertise.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="outline" className="border-primary/20 bg-primary/5 text-xs px-2 py-0.5">
                  {skill}
                </Badge>
              ))}
              {expert.expertise.length > 3 && (
                <Badge variant="outline" className="border-muted-foreground/20 bg-muted/5 text-xs px-2 py-0.5">
                  +{expert.expertise.length - 3}
                </Badge>
              )}
            </div>

            {/* Links */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {expert.alive ? 'Connect' : 'Learn More'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {expert.links.map((link, i) => {
                  const Icon = getLinkIcon(link.type);
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-200 group/link text-xs"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                          <span className="text-foreground/80 group-hover/link:text-foreground transition-colors">
                            {link.label}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/50 group-hover/link:text-primary/50 transition-colors" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getTooltipText(link.type)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Status Badge */}
            {!expert.alive && (
              <div className="flex justify-center pt-1">
                <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                  Legacy · 1955-2011
                </Badge>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
