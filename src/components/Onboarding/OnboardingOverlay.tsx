import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users, FileText, ArrowRight, Check } from "lucide-react";

interface OnboardingOverlayProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to Specificity AI",
    description: "Build production-ready product specifications in minutes, not weeks. Your personal AI advisory board is ready to help.",
    icon: Sparkles,
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  {
    id: 2,
    title: "Your Expert Team",
    description: "Collaborate with world-class AI personas like Elon, Steve, and others. They research, debate, and refine your idea in real-time.",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    id: 3,
    title: "Comprehensive Output",
    description: "Get a complete technical spec with database schema, API endpoints, and implementation details ready for your engineering team.",
    icon: FileText,
    color: "text-green-400",
    bg: "bg-green-400/10"
  }
];

export const OnboardingOverlay = ({ open, onComplete }: OnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Reset step when closed/reopened
  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onComplete()}>
      <DialogContent className="sm:max-w-md border-border/20 bg-gradient-to-br from-card to-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden gap-0">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-secondary/30">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center space-y-6 py-6"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${steps[currentStep].bg} mb-2 ring-4 ring-background shadow-lg`}>
                <CurrentIcon className={`w-10 h-10 ${steps[currentStep].color}`} />
              </div>
              
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {steps[currentStep].title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground/80 leading-relaxed max-w-xs mx-auto">
                  {steps[currentStep].description}
                </DialogDescription>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="p-6 sm:justify-between items-center bg-secondary/5 mt-4 border-t border-border/10">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentStep ? "bg-primary" : "bg-primary/20"
                }`}
              />
            ))}
          </div>
          
          <Button onClick={handleNext} className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20">
            {currentStep === steps.length - 1 ? (
              <>
                Get Started <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
