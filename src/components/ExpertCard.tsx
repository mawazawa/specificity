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
      <Card className="relative overflow-visible border-border/5 bg-gradient-to-b from-card/5 to-transparent backdrop-blur-sm hover:bg-card/10 transition-all duration-500 h-full">
        {/* Minimal card content */}
        <div className="relative p-4 space-y-3">
          {/* Avatar - elevated and prominent */}
          <div className="relative mx-auto w-16 h-16 -mt-10 mb-2">
            {/* Soft shadow for depth */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-background to-transparent shadow-2xl" 
                 style={{ 
                   transform: 'translateY(6px)',
                   filter: 'blur(12px)',
                   opacity: 0.5
                 }} 
            />
            
            {/* Avatar container - premium aluminum finish */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-zinc-200/50 to-zinc-400/50 dark:from-zinc-600/50 dark:to-zinc-800/50 p-[1.5px] group-hover:scale-110 transition-transform duration-500 shadow-xl">
              {/* Inner metallic ring */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-100/80 to-zinc-300/80 dark:from-zinc-700/80 dark:to-zinc-900/80 p-[1px]">
                {/* Image container */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-background to-card">
                  <img 
                    src={expert.avatar} 
                    alt={expert.name}
                    className="w-full h-full object-cover scale-105 grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                  />
                  {/* Subtle overlay for premium look */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/10" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center space-y-0.5">
            <h3 className="text-[11px] font-medium tracking-tight text-foreground">{expert.name}</h3>
            <p className="text-[9px] text-muted-foreground/50 leading-tight">
              {expert.role}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
