import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ExternalLink, Twitter, Linkedin, Youtube, Globe } from "lucide-react";
import { Expert } from "@/types/expert";
import { motion } from "framer-motion";

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

export const ExpertCard = ({ expert, index }: ExpertCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/30 hover:border-primary/40 transition-all duration-700 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-primary/10 h-full">
        {/* Animated gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
        
        <div className="relative p-6 space-y-6">
          {/* Large Avatar */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative group/avatar">
              <div className={`absolute -inset-1 bg-gradient-to-br ${expert.color} rounded-3xl opacity-75 group-hover/avatar:opacity-100 blur group-hover/avatar:blur-md transition-all duration-500`} />
              <div className={`relative w-48 h-48 rounded-3xl bg-gradient-to-br ${expert.color} overflow-hidden shadow-2xl ring-2 ring-white/10 group-hover/avatar:ring-white/20 transition-all duration-500 transform group-hover/avatar:scale-105`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
                <img 
                  src={expert.avatar} 
                  alt={expert.name} 
                  className="relative w-full h-full object-cover object-center"
                />
                {expert.alive && (
                  <div className="absolute bottom-3 right-3 w-4 h-4 bg-green-400 rounded-full ring-2 ring-background shadow-lg animate-pulse" />
                )}
              </div>
            </div>

            {/* Expert Info */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                {expert.name}
              </h3>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
                {expert.title}
              </p>
              <p className="text-xs text-primary font-medium">
                {expert.role}
              </p>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expert.bio}
          </p>

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {expert.expertise.map((skill, i) => (
              <Badge key={i} variant="outline" className="border-primary/30 bg-primary/5">
                {skill}
              </Badge>
            ))}
          </div>

          {/* Links */}
          <div className="space-y-3 pt-4 border-t border-border/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold text-center">
              {expert.alive ? 'Connect & Learn' : 'Learn More'}
            </div>
            <div className="flex flex-col gap-2">
              {expert.links.map((link, i) => {
                const Icon = getLinkIcon(link.type);
                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border/20 hover:border-primary/30 transition-all duration-300 group/link text-sm"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground group-hover/link:text-primary transition-colors" />
                    <span className="text-foreground/80 group-hover/link:text-foreground transition-colors flex-1">
                      {link.label}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover/link:text-primary/50 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Status Badge */}
          {!expert.alive && (
            <div className="text-center">
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                Legacy · 1955-2011
              </Badge>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
