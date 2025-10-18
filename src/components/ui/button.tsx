import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-[0_6px_0_hsl(210_100%_40%),0_8px_20px_hsl(0_0%_0%/0.4)] hover:shadow-[0_4px_0_hsl(210_100%_40%),0_6px_16px_hsl(0_0%_0%/0.5)] active:shadow-[0_2px_0_hsl(210_100%_40%),0_3px_8px_hsl(0_0%_0%/0.6)] active:translate-y-1",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_6px_0_hsl(0_84%_50%),0_8px_20px_hsl(0_0%_0%/0.4)] hover:shadow-[0_4px_0_hsl(0_84%_50%),0_6px_16px_hsl(0_0%_0%/0.5)] active:shadow-[0_2px_0_hsl(0_84%_50%),0_3px_8px_hsl(0_0%_0%/0.6)] active:translate-y-1",
        outline: "border border-border bg-background/50 hover:bg-accent/10 hover:border-accent",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_0_hsl(0_0%_8%),0_6px_16px_hsl(0_0%_0%/0.3)] hover:shadow-[0_3px_0_hsl(0_0%_8%),0_5px_12px_hsl(0_0%_0%/0.4)] active:shadow-[0_1px_0_hsl(0_0%_8%),0_2px_6px_hsl(0_0%_0%/0.5)] active:translate-y-1",
        ghost: "hover:bg-accent/10 hover:text-accent",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-full px-4 py-2",
        lg: "h-14 rounded-full px-10 py-4 text-base",
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
