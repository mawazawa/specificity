import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ExternalLink, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Expert } from "@/types/expert";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ExpertDrawer } from "./ExpertDrawer";

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
        className="h-full"
      >
        <Card className="group relative overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 h-full max-w-sm">
          {/* Backlit aluminum backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
            {/* Brushed metal texture */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.03) 2px,
                rgba(255, 255, 255, 0.03) 4px
              )`
            }} />
            {/* Backlight glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-700`} />
          </div>
          
          <div className="relative p-6 space-y-5">
            {/* Avatar with backlit effect */}
            <div className="flex items-start gap-5">
              <div className="relative group/avatar flex-shrink-0">
                {/* Outer glow ring */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${expert.color} rounded-2xl opacity-40 group-hover/avatar:opacity-70 blur-md transition-all duration-500`} />
                
                {/* Avatar container with metal rim */}
                <div className={`relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover/avatar:ring-white/20 transition-all duration-500`}>
                  {/* Metal bezel */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 opacity-20" />
                  
                  {/* Backlight behind avatar */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-30 blur-xl`} />
                  
                  {/* Avatar image */}
                  <img 
                    src={expert.avatar} 
                    alt={expert.name}
                    loading="lazy"
                    className="relative w-full h-full object-cover object-center scale-110 mix-blend-lighten"
                  />
                  
                  {/* Status indicator */}
                  {expert.alive && (
                    <div className="absolute bottom-2 right-2 flex items-center justify-center">
                      <div className="absolute w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75" />
                      <div className="relative w-3 h-3 bg-green-400 rounded-full ring-2 ring-black/50 shadow-lg shadow-green-400/50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Expert Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xl font-bold text-white tracking-tight truncate drop-shadow-lg">
                  {expert.name}
                </h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold truncate mt-1">
                  {expert.title}
                </p>
                <p className={`text-xs font-medium mt-1.5 truncate bg-gradient-to-r ${expert.color} bg-clip-text text-transparent`}>
                  {expert.role}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-zinc-300/90 leading-relaxed line-clamp-3">
              {expert.bio}
            </p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-2">
              {expert.expertise.slice(0, 3).map((skill, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-xs px-2.5 py-1 backdrop-blur-sm transition-all duration-200"
                >
                  {skill}
                </Badge>
              ))}
              {expert.expertise.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="border-white/10 bg-white/5 text-white/60 text-xs px-2.5 py-1 backdrop-blur-sm"
                >
                  +{expert.expertise.length - 3}
                </Badge>
              )}
            </div>

            {/* Links */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                {expert.alive ? 'Connect' : 'Learn More'}
              </div>
              <div className="flex flex-wrap gap-2">
                {expert.links.map((link, i) => {
                  const Icon = getLinkIcon(link.type);
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group/link text-xs backdrop-blur-sm"
                        >
                          <Icon className="w-4 h-4 text-zinc-400 group-hover/link:text-white transition-colors" />
                          <span className="text-white/80 group-hover/link:text-white transition-colors font-medium">
                            {link.label}
                          </span>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/link:text-zinc-300 transition-colors" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                        <p>{getTooltipText(link.type)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Status Badge */}
            {!expert.alive && (
              <div className="flex justify-center pt-2">
                <Badge variant="outline" className="border-white/20 bg-white/5 text-zinc-400 text-xs backdrop-blur-sm">
                  Legacy · 1955-2011
                </Badge>
              </div>
            )}

            {/* Expandable Drawer */}
            <ExpertDrawer expert={expert} />
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
