import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const words = [
  "design.",
  "prototype.",
  "solve.",
  "build.",
  "develop.",
  "debug.",
  "learn.",
  "ship.",
  "prompt.",
  "collaborate.",
  "create.",
  "inspire.",
  "innovate.",
  "test.",
  "optimize.",
  "visualize.",
  "transform.",
  "scale.",
  "deliver.",
];

export const ScrollingTextSection = () => {
  const ulRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!ulRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.5 }
    );

    const items = ulRef.current.querySelectorAll("li");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full min-h-screen py-24 overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '45px 45px',
            maskImage: 'linear-gradient(-20deg, transparent 50%, black)',
            WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, black)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-16 flex items-start gap-8 min-h-screen">
        {/* Sticky header */}
        <div className="sticky top-[50vh] -translate-y-1/2 hidden lg:block">
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-b from-foreground to-foreground/30 bg-clip-text text-transparent leading-tight">
            you can
          </h2>
        </div>

        {/* Scrolling words */}
        <ul 
          ref={ulRef}
          className="flex-1 space-y-2 list-none m-0 p-0"
          style={{ 
            counterReset: 'item',
            ['--count' as string]: words.length 
          }}
        >
          {words.map((word, i) => (
            <motion.li
              key={i}
              className="scroll-word text-6xl md:text-7xl lg:text-8xl font-bold py-4 opacity-20 transition-all duration-300"
              style={
                {
                  ['--i' as string]: i,
                  ['--hue' as string]: `calc(0 + (360 / ${words.length} * ${i}))`,
                } as React.CSSProperties
              }
              initial={{ opacity: 0.2 }}
              whileInView={{ 
                opacity: 1,
                filter: "brightness(1.2)",
                color: `oklch(75% 0.3 calc(0 + (360 / ${words.length} * ${i})))`,
              }}
              viewport={{ amount: 0.5, margin: "-200px" }}
              transition={{ duration: 0.3 }}
            >
              {word}
            </motion.li>
          ))}
          <li className="text-6xl md:text-7xl lg:text-8xl font-bold py-4 bg-gradient-to-b from-foreground to-foreground/30 bg-clip-text text-transparent">
            do it.
          </li>
        </ul>
      </div>

      {/* Final section */}
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-8xl md:text-9xl font-bold bg-gradient-to-b from-foreground to-foreground/30 bg-clip-text text-transparent">
          fin.
        </h2>
      </div>
    </section>
  );
};
