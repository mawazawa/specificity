import { Card } from "./ui/card";
import { Expert } from "@/types/expert";
import { motion } from "framer-motion";

interface ExpertCardProps {
  expert: Expert;
  index: number;
}

export const ExpertCard = ({ expert, index }: ExpertCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group"
    >
      <Card className="relative overflow-visible border-border/10 bg-gradient-to-b from-zinc-900/40 to-zinc-800/20 backdrop-blur-sm hover:from-zinc-800/50 hover:to-zinc-700/30 transition-all duration-500 h-full shadow-2xl">
        {/* Brushed aluminum effect background */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-400/10 via-zinc-500/5 to-zinc-600/10" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.03)_50%,transparent_75%)] bg-[length:6px_6px]" />
          {/* Chamfered edge highlight */}
          <div className="absolute inset-0 rounded-lg border border-zinc-400/20 group-hover:border-zinc-300/30 transition-colors duration-500" />
          <div className="absolute inset-[1px] rounded-lg border border-zinc-600/10" />
        </div>

        <div className="relative p-6 space-y-4">
          {/* Large avatar - elevated */}
          <div className="relative mx-auto w-24 h-24 -mt-14 mb-3">
            {/* Shadow for depth */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-b from-background to-transparent shadow-2xl" 
              style={{ 
                transform: 'translateY(8px)',
                filter: 'blur(16px)',
                opacity: 0.6
              }} 
            />
            
            {/* Avatar container - premium aluminum finish */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-zinc-200/60 to-zinc-400/60 dark:from-zinc-600/60 dark:to-zinc-800/60 p-[2px] group-hover:scale-105 transition-transform duration-500 shadow-2xl">
              {/* Inner metallic ring */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-100/90 to-zinc-300/90 dark:from-zinc-700/90 dark:to-zinc-900/90 p-[1.5px]">
                {/* Image container */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-background to-card">
                  <img 
                    src={expert.avatar} 
                    alt={expert.name}
                    className="w-full h-full object-cover scale-105 grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                  />
                  {/* Subtle overlay for premium look */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-medium tracking-tight text-foreground">{expert.name}</h3>
            <p className="text-xs text-muted-foreground/60 leading-tight">
              {expert.role}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
