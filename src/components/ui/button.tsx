import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-[0_8px_32px_hsl(0_0%_0%/0.5),0_2px_8px_hsl(210_100%_50%/0.2)] hover:shadow-[0_12px_48px_hsl(0_0%_0%/0.6),0_4px_16px_hsl(210_100%_50%/0.3)] hover:translate-y-[-2px] active:translate-y-0 backdrop-blur-sm",
        destructive: "bg-destructive text-white shadow-[0_8px_32px_hsl(0_0%_0%/0.5),0_2px_8px_hsl(0_84%_60%/0.2)] hover:shadow-[0_12px_48px_hsl(0_0%_0%/0.6),0_4px_16px_hsl(0_84%_60%/0.3)] hover:translate-y-[-2px] active:translate-y-0",
        outline: "border border-border/30 bg-background/50 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/50 hover:shadow-[0_4px_16px_hsl(210_100%_50%/0.1)]",
        secondary: "bg-secondary/80 text-secondary-foreground backdrop-blur-sm shadow-[0_4px_16px_hsl(0_0%_0%/0.3)] hover:shadow-[0_8px_24px_hsl(0_0%_0%/0.4)] hover:translate-y-[-1px] active:translate-y-0",
        ghost: "hover:bg-accent/10 hover:text-accent",
        link: "text-accent underline-offset-4 hover:underline",
        aluminum: "bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300/50 dark:border-zinc-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.3),0_8px_32px_rgba(59,130,246,0.3)] hover:border-accent/30 font-medium",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1.5 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Enable magnetic hover effect - only use for hero CTAs */
  magnetic?: boolean;
  /** Enable ripple click effect */
  ripple?: boolean;
}

/**
 * Lightweight Button Component
 *
 * Performance optimized (December 2025):
 * - Default: Standard button with no motion overhead
 * - magnetic={true}: Enables magnetic hover effect (loads Framer Motion)
 * - ripple={true}: Enables ripple click effect
 *
 * Use magnetic only for hero CTAs and primary actions.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, magnetic = false, ripple = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // For non-magnetic buttons, render a simple button without motion overhead
    if (!magnetic && !ripple) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    // Only import motion components when actually needed
    return (
      <InteractiveButton
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        magnetic={magnetic}
        ripple={ripple}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/**
 * Interactive Button with motion effects
 * Only loaded when magnetic or ripple is enabled
 */
const InteractiveButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { magnetic: boolean; ripple: boolean }
>(({ className, magnetic, ripple, onClick, children, ...props }, ref) => {
  const [motionComponents, setMotionComponents] = React.useState<{
    motion: typeof import("framer-motion")["motion"];
    useMotionValue: typeof import("framer-motion")["useMotionValue"];
    useSpring: typeof import("framer-motion")["useSpring"];
  } | null>(null);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const combinedRef = ref || buttonRef;

  const [rippleState, setRippleState] = React.useState<{x: number; y: number; size: number} | null>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  // Lazy load framer-motion only when needed
  React.useEffect(() => {
    import("framer-motion").then((mod) => {
      setMotionComponents({
        motion: mod.motion,
        useMotionValue: mod.useMotionValue,
        useSpring: mod.useSpring,
      });
    });
  }, []);

  // Magnetic effect handler
  React.useEffect(() => {
    const element = buttonRef.current;
    if (!element || !magnetic) return;

    const updatePosition = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.15;
      const deltaY = (e.clientY - centerY) * 0.15;
      setPosition({ x: deltaX, y: deltaY });
    };

    const resetPosition = () => setPosition({ x: 0, y: 0 });

    element.addEventListener("mousemove", updatePosition);
    element.addEventListener("mouseleave", resetPosition);
    return () => {
      element.removeEventListener("mousemove", updatePosition);
      element.removeEventListener("mouseleave", resetPosition);
    };
  }, [magnetic]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      setRippleState({
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
      });
      setTimeout(() => setRippleState(null), 600);
    }
    onClick?.(e);
  };

  // Render with motion if loaded, otherwise fallback
  if (motionComponents) {
    const { motion } = motionComponents;
    const MotionButton = motion.button;

    return (
      <MotionButton
        className={className}
        ref={buttonRef}
        onClick={handleClick}
        animate={magnetic ? { x: position.x, y: position.y } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      >
        {children}
        {rippleState && (
          <motion.div
            className="absolute bg-white/20 rounded-full pointer-events-none"
            style={{
              left: rippleState.x,
              top: rippleState.y,
              width: rippleState.size,
              height: rippleState.size,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </MotionButton>
    );
  }

  // Fallback while loading
  return (
    <button
      className={className}
      ref={buttonRef}
      onClick={handleClick}
      style={magnetic ? { transform: `translate(${position.x}px, ${position.y}px)` } : undefined}
      {...props}
    >
      {children}
    </button>
  );
});
InteractiveButton.displayName = "InteractiveButton";

export { Button, buttonVariants };
