import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Curated power words that build momentum
const words = [
  "design", "prototype", "innovate", "build", 
  "test", "iterate", "scale", "launch", "ship"
];

export const ScrollingTextSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const wordIndex = Math.floor(latest * words.length);
      setCurrentIndex(Math.min(wordIndex, words.length - 1));
    });
    
    return () => unsubscribe();
  }, [scrollYProgress]);

  const currentWord = words[currentIndex];
  const isShip = currentWord === "ship";

  return (
    <section ref={containerRef} className="relative w-full">
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Sticky word container */}
      <div className="sticky top-1/2 -translate-y-1/2 z-10 pointer-events-none h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            {/* Intro text */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl md:text-3xl font-light text-foreground/40 tracking-wide"
            >
              you can
            </motion.p>
            
            {/* Main word with enhanced ship effect */}
            <motion.div
              key={currentWord}
              initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
              animate={{ 
                opacity: 1, 
                scale: isShip ? 1.05 : 1, 
                filter: "blur(0px)" 
              }}
              transition={{ 
                duration: isShip ? 1.2 : 0.6,
                type: "spring",
                stiffness: isShip ? 40 : 60,
                damping: isShip ? 20 : 25
              }}
              className={`relative ${isShip ? 'mb-8' : ''}`}
            >
              {isShip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.3, scale: 2 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-accent/20 rounded-full blur-[100px]"
                />
              )}
              
              <h2 
                className="text-[18vw] md:text-[14vw] font-bold leading-none relative"
                style={{
                  background: isShip 
                    ? "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--foreground)))"
                    : "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.5))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: isShip 
                    ? "drop-shadow(0 0 60px hsl(var(--accent) / 0.6))"
                    : "none"
                }}
              >
                {currentWord}.
              </h2>
            </motion.div>

            {/* Ship landing message */}
            {isShip && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-lg md:text-xl font-light text-foreground/60 tracking-wide"
              >
                that's what you're here for.
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for scroll - reduced from 100vh to 60vh per word */}
      <div style={{ height: `${words.length * 60}vh` }} />
    </section>
  );
};