import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Star, Briefcase, Award, Target } from "lucide-react";
import { Expert } from "@/types/expert";
import { Badge } from "./ui/badge";

interface ExpertDrawerProps {
  expert: Expert;
}

export const ExpertDrawer = ({ expert }: ExpertDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock data for demonstration - would come from expert type in production
  const topParameters = [
    { name: "Innovation Focus", value: 95, icon: Star },
    { name: "Execution Speed", value: 88, icon: Briefcase },
    { name: "Quality Standards", value: 92, icon: Award },
    { name: "Strategic Vision", value: 90, icon: Target },
  ];

  return (
    <div className="relative">
      {/* Drawer trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 group"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${expert.color} opacity-40 blur-lg transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'group-hover:opacity-60'}`} />
          
          {/* Button */}
          <div className="relative px-4 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-sm border border-white/10 flex items-center gap-2">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-3 h-3 text-white" />
            </motion.div>
            <span className="text-xs text-white/80 font-medium">
              {isOpen ? 'Less' : 'More'}
            </span>
          </div>
        </div>
      </button>

      {/* Drawer content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-8 pb-4 px-6 space-y-4 border-t border-white/10">
              {/* Top Parameters Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Top Parameters
                </h4>
                
                <div className="space-y-2">
                  {topParameters.map((param, i) => {
                    const Icon = param.icon;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-xs text-zinc-300">{param.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-white">{param.value}%</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${param.value}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${expert.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full expertise list */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white/90">
                  All Expertise
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {expert.expertise.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-xs px-2 py-0.5 backdrop-blur-sm transition-all duration-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Methodology insights */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <h4 className="text-sm font-semibold text-white/90">
                  Unique Perspective
                </h4>
                <p className="text-xs text-zinc-300/80 leading-relaxed">
                  This advisor brings a distinct analytical framework focused on{' '}
                  {expert.expertise[0].toLowerCase()} and {expert.expertise[1]?.toLowerCase() || 'innovation'}.
                  Their insights are calibrated to challenge assumptions and drive practical outcomes.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
