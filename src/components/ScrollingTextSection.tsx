import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words = [
  "design", "prototype", "solve", "build", "develop", "debug", "learn", "ship",
  "prompt", "collaborate", "create", "inspire", "innovate", "test", "optimize",
  "visualize", "transform", "scale", "deliver", "dream", "code", "refactor",
  "deploy", "architect", "research", "iterate", "validate", "measure", "improve",
  "automate", "integrate", "discover", "experiment", "achieve", "execute",
  "strategize", "analyze", "synthesize", "implement", "launch", "evolve"
];

export const ScrollingTextSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStickyWord, setCurrentStickyWord] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const wordIndex = Math.floor(latest * words.length);
      setCurrentStickyWord(Math.min(wordIndex, words.length - 1));
    });
    
    return () => unsubscribe();
  }, [scrollYProgress]);

  const stickyWord = words[currentStickyWord];

  return (
    <section ref={containerRef} className="relative w-full py-32">
      {/* Visible grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Intro text + Sticky large word */}
      <div className="sticky top-1/2 -translate-y-1/2 z-10 pointer-events-none mb-32">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            {/* Intro text */}
            <p className="text-2xl md:text-3xl font-light text-foreground/40 tracking-wide">
              you can
            </p>
            
            {/* Sticky word with gentler animation */}
            <motion.h2 
              key={stickyWord}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 60,
                damping: 25
              }}
              className="text-[18vw] md:text-[14vw] font-bold leading-none"
              style={{
                background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {stickyWord}.
            </motion.h2>
          </div>
        </div>
      </div>

      {/* Scrolling background words */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <div className="space-y-8 py-32">
          {[...Array(3)].map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {words.map((word, i) => (
                <motion.div
                  key={`${groupIndex}-${i}`}
                  className="text-7xl md:text-9xl font-bold text-foreground/40 whitespace-nowrap"
                  style={{
                    marginLeft: `${(i * 15) % 100}%`,
                  }}
                >
                  {word}.
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Spacer for scroll */}
      <div style={{ height: `${words.length * 100}vh` }} />
    </section>
  );
};
