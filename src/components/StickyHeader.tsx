import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { SubscriptionModal } from "./SubscriptionModal";
import { useProfile } from "@/hooks/use-profile";

interface StickyHeaderProps {
  onGetStarted: () => void;
  showLanding: boolean;
}

/**
 * Custom hook for bounded scroll tracking
 * Tracks scroll within a threshold and provides normalized progress (0-1)
 */
function useBoundedScroll(threshold: number) {
  const { scrollY } = useScroll();
  const scrollYBounded = useMotionValue(0);
  const scrollYBoundedProgress = useTransform(scrollYBounded, [0, threshold], [0, 1]);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (current) => {
      const previous = scrollY.getPrevious() ?? 0;
      const diff = current - previous;
      const newScrollYBounded = scrollYBounded.get() + diff;
      scrollYBounded.set(Math.min(Math.max(newScrollYBounded, 0), threshold));
    });
    return unsubscribe;
  }, [threshold, scrollY, scrollYBounded]);

  return { scrollYBounded, scrollYBoundedProgress };
}

/**
 * StickyHeader - Scroll-triggered header with CTA
 *
 * Appears after scrolling past the Hero section (~400px)
 * Provides persistent "Get Started" button access
 */
export const StickyHeader = ({ onGetStarted, showLanding }: StickyHeaderProps) => {
  const { scrollYBoundedProgress } = useBoundedScroll(400);
  const { profile } = useProfile();

  // Animate opacity and Y position based on scroll progress
  const headerOpacity = useTransform(scrollYBoundedProgress, [0, 0.5, 1], [0, 0, 1]);
  const headerY = useTransform(scrollYBoundedProgress, [0, 0.5, 1], [-60, -30, 0]);

  // Add spring physics for smoother animation
  const springY = useSpring(headerY, { stiffness: 300, damping: 30 });

  // Only show on landing page
  if (!showLanding) return null;

  return (
    <motion.header
      style={{ opacity: headerOpacity, y: springY }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/20 pointer-events-auto"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Specificity
          </span>
          <span className="text-xs text-muted-foreground font-medium">AI</span>
        </div>

        <div className="flex items-center gap-3">
          {profile?.plan === 'free' && (
            <div className="hidden md:flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-secondary/50 border border-border/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {profile.credits} Credits Left
                </span>
              </div>
              <SubscriptionModal>
                <Button variant="ghost" size="sm" className="flex gap-2 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              </SubscriptionModal>
            </div>
          )}

          {/* CTA Button */}
          <Button
            onClick={onGetStarted}
            size="sm"
            className="gap-2 rounded-full px-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default StickyHeader;