import { motion, useInView, useReducedMotion } from "framer-motion";
import { ReactNode, useRef } from "react";

/**
 * AnimatedButton - Hero CTA with animated circuit lines
 *
 * Performance optimized (December 2025):
 * - Animations pause when button is off-screen (Intersection Observer)
 * - Respects prefers-reduced-motion
 * - Consolidated from 5 gradient animations to 3 for better performance
 */

const grad1 = {
  initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
  animate: {
    x1: ["0%", "0%", "200%"],
    x2: ["0%", "0%", "180%"],
    y1: ["80%", "0%", "0%"],
    y2: ["100%", "20%", "20%"],
  },
};

const grad2 = {
  initial: { x1: "0%", x2: "0%", y1: "80%", y2: "100%" },
  animate: {
    x1: ["20%", "100%", "100%"],
    x2: ["0%", "90%", "90%"],
    y1: ["80%", "80%", "-20%"],
    y2: ["100%", "100%", "0%"],
  },
};

const grad3 = {
  initial: { x1: "-40%", x2: "-10%", y1: "0%", y2: "20%" },
  animate: {
    x1: ["40%", "0%", "0%"],
    x2: ["10%", "0%", "0%"],
    y1: ["0%", "0%", "180%"],
    y2: ["20%", "20%", "200%"],
  },
};

const GradientColors = () => (
  <>
    <stop stopColor="#18CCFC" stopOpacity="0" />
    <stop stopColor="#18CCFC" />
    <stop offset="0.325" stopColor="#6344F5" />
    <stop offset="1" stopColor="#AE48FF" stopOpacity="0" />
  </>
);

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const AnimatedButton = ({ children, onClick, className = "", ...props }: AnimatedButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ref = useRef<HTMLButtonElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  const prefersReducedMotion = useReducedMotion();

  // Determine if animations should play
  const shouldAnimate = isInView && !prefersReducedMotion;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative w-[320px] h-[120px] bg-background/10 backdrop-blur-sm no-underline group cursor-pointer shadow-2xl shadow-primary/20 rounded-full p-px text-xs font-semibold leading-6 text-foreground inline-block ${className}`}
      {...props}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,hsl(var(--primary)/0.6)_0%,hsl(var(--primary)/0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      <div className="relative flex justify-center w-full text-center space-x-2 h-full items-center z-10 rounded-full bg-background/95 py-0.5 px-4 ring-1 ring-border">
        <span className="md:text-4xl text-base inline-block bg-clip-text text-transparent bg-gradient-to-r from-foreground/60 via-foreground to-foreground/60">
          {children}
        </span>
      </div>

      {/* Circuit lines SVG - animations paused when off-screen */}
      <svg
        width="858"
        height="434"
        viewBox="0 0 858 434"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 opacity-50 absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Static base paths */}
        <path d="M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5" stroke="hsl(var(--border))" />
        <path d="M568 200H841C846.523 200 851 195.523 851 190V40" stroke="hsl(var(--border))" />
        <path d="M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5" stroke="hsl(var(--border))" />
        <path d="M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427" stroke="hsl(var(--border))" />
        <path d="M380 168V17C380 11.4772 384.477 7 390 7H414" stroke="hsl(var(--border))" />

        {/* Animated gradient paths - only 3 active at once for performance */}
        <path d="M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5" stroke="url(#grad1)" />
        <path d="M568 200H841C846.523 200 851 195.523 851 190V40" stroke="url(#grad2)" />
        <path d="M380 168V17C380 11.4772 384.477 7 390 7H414" stroke="url(#grad3)" />

        <defs>
          <motion.linearGradient
            variants={grad1}
            animate={shouldAnimate ? "animate" : "initial"}
            initial="initial"
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              repeatDelay: 2,
            }}
            id="grad1"
          >
            <GradientColors />
          </motion.linearGradient>
          <motion.linearGradient
            variants={grad2}
            animate={shouldAnimate ? "animate" : "initial"}
            initial="initial"
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              repeatDelay: 2,
              delay: 0.5,
            }}
            id="grad2"
          >
            <GradientColors />
          </motion.linearGradient>
          <motion.linearGradient
            variants={grad3}
            animate={shouldAnimate ? "animate" : "initial"}
            initial="initial"
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              repeatDelay: 2,
              delay: 1,
            }}
            id="grad3"
          >
            <GradientColors />
          </motion.linearGradient>
        </defs>

        {/* Connection nodes */}
        <circle cx="851" cy="34" r="6.5" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
        <circle cx="6.5" cy="398.5" r="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
        <circle cx="420.5" cy="6.5" r="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
      </svg>
    </button>
  );
};
