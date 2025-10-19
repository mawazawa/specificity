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
      {/* Sticky large word */}
      <div className="sticky top-1/2 -translate-y-1/2 z-10 pointer-events-none mb-32">
        <div className="container mx-auto px-4">
          <motion.h2 
            key={stickyWord}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ 
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="text-[20vw] md:text-[15vw] font-bold text-center leading-none"
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
