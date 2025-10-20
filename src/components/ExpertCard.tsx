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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group"
    >
      <Card className="relative overflow-visible border-border/10 bg-gradient-to-b from-card/60 to-card/30 backdrop-blur-sm hover:from-card/80 hover:to-card/50 transition-all duration-500 h-full">
        {/* Premium metallic background effect */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-foreground/2 to-foreground/5" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.02)_50%,transparent_75%)] bg-[length:8px_8px]" />
          <div className="absolute inset-0 rounded-lg border border-border/20 group-hover:border-border/40 transition-colors duration-500" />
        </div>

        <div className="relative p-5 space-y-3.5">
          {/* Avatar - elevated with better shadows */}
          <div className="relative mx-auto w-20 h-20 -mt-12 mb-2">
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-b from-foreground/20 to-transparent shadow-2xl" 
              style={{ 
                transform: 'translateY(6px)',
                filter: 'blur(12px)',
                opacity: 0.7
              }} 
            />
            
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-border/60 to-border/30 p-[2px] group-hover:scale-110 transition-transform duration-500 shadow-xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-background/90 to-card/90 p-[1.5px]">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-card to-background">
                  <img 
                    src={expert.avatar} 
                    alt={expert.name}
                    className="w-full h-full object-cover scale-105 grayscale-[30%] group-hover:grayscale-0 group-hover:scale-115 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/10" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
              {expert.name}
            </h3>
            <p className="text-[11px] text-muted-foreground/70 leading-tight px-1">
              {expert.role}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
