import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring } from "framer-motion";
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
  magnetic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, magnetic = true, onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, ...props }, ref) => {
    const localRef = React.useRef<HTMLButtonElement>(null);
    const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || localRef;
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 30 });

    React.useEffect(() => {
      const element = buttonRef.current;
      if (!element || !magnetic) return;

      const updatePosition = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const { clientX, clientY } = e;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        x.set(deltaX * 0.15); // Adjust strength (0.1 to 0.3)
        y.set(deltaY * 0.15);
      };

      element.addEventListener("mousemove", updatePosition);
      return () => element.removeEventListener("mousemove", updatePosition);
    }, [x, y, magnetic, buttonRef]);

    const [ripple, setRipple] = React.useState<{x: number; y: number; size: number} | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      setRipple({x, y, size});
      // Clear ripple after animation
      setTimeout(() => setRipple(null), 600);
      // Call original onClick if exists
      if (props.onClick) {
        props.onClick(e as any);
      }
    };

    // Note: rippleSpring removed - using direct animation instead

    const Comp = asChild ? Slot : motion.button;

    const buttonProps = {
      ...props,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (asChild) {
          // For asChild, ripple not supported or handle differently
        } else {
          handleClick(e);
        }
        if (props.onClick) props.onClick(e);
      },
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        style={{ x: mouseX, y: mouseY }}
        {...(buttonProps as any)}
      >
        {ripple && (
          <motion.div
            className="absolute bg-white/20 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
