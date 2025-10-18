import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-fluid text-sm font-light tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-[0_8px_32px_hsl(0_0%_0%/0.5),0_2px_8px_hsl(210_100%_50%/0.2)] hover:shadow-[0_12px_48px_hsl(0_0%_0%/0.6),0_4px_16px_hsl(210_100%_50%/0.3)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-[0_4px_16px_hsl(0_0%_0%/0.4),0_1px_4px_hsl(210_100%_50%/0.1)] backdrop-blur-sm",
        destructive: "bg-destructive text-white shadow-[0_8px_32px_hsl(0_0%_0%/0.5),0_2px_8px_hsl(0_84%_60%/0.2)] hover:shadow-[0_12px_48px_hsl(0_0%_0%/0.6),0_4px_16px_hsl(0_84%_60%/0.3)] hover:translate-y-[-2px] active:translate-y-0",
        outline: "border border-border/30 bg-background/50 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/50 hover:shadow-[0_4px_16px_hsl(210_100%_50%/0.1)]",
        secondary: "bg-secondary/80 text-secondary-foreground backdrop-blur-sm shadow-[0_4px_16px_hsl(0_0%_0%/0.3)] hover:shadow-[0_8px_24px_hsl(0_0%_0%/0.4)] hover:translate-y-[-1px] active:translate-y-0",
        ghost: "hover:bg-accent/10 hover:text-accent",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-10 py-4 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
