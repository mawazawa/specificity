import { FileText, Zap, Search, GitBranch, Shield, CheckCircle2, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AnimatedButton } from "./AnimatedButton";
import { ExpertCard } from "./ExpertCard";
import { EXPERTS } from "@/types/expert";
import { ScrollingTextSection } from "./ScrollingTextSection";
import { Footer } from "./Footer";
import DottedGlowBackground from "./ui/dotted-glow-background";
import { motion } from "framer-motion";

export const LandingHero = () => {
  const scrollToInput = () => {
    const inputElement = document.querySelector('[data-spec-input]');
    inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-32 animate-fade-in relative">
      {/* Grid background overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-15 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ADVANCED HEADER - Specificity AI */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
        <DottedGlowBackground
          className="pointer-events-none"
          opacity={0.85}
          gap={16}
          radius={2.2}
          colorLightVar="--foreground"
          glowColorLightVar="--accent"
          colorDarkVar="--foreground"
          glowColorDarkVar="--accent"
          backgroundOpacity={0.08}
          speedMin={0.25}
          speedMax={0.85}
          speedScale={1.3}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center space-y-8"
        >
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 60px hsl(var(--accent) / 0.4))"
            }}
          >
            Specificity AI
          </h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <AnimatedButton onClick={scrollToInput} className="text-lg px-12 py-6">
              Get Started
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </div>

      {/* HERO SECTION - PAS Framework: Problem → Agitate → Solve */}
      <div className="text-center space-y-12 max-w-6xl mx-auto pt-16 pb-8 relative z-10">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1]">
          <span className="block text-foreground/90">Specificity:</span>
          <span className="block text-foreground/60 text-2xl md:text-4xl lg:text-5xl font-extralight mt-2">
            Production-Ready Specs in 30 Minutes
          </span>
        </h1>
        
        {/* PAS: Agitate the Problem */}
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Bad specs cost you <span className="text-destructive font-semibold">$50K in wasted dev time</span>, 
            months of delays, and feature drift that kills products before launch.
          </p>
          
          {/* PAS: Solution */}
          <p className="text-lg text-foreground/80 leading-relaxed border-l-4 border-accent pl-6">
            <span className="font-semibold">8 world-class AI advisors</span> debate your product, 
            research the latest tech, and deliver <span className="font-semibold">15-section battle-tested specs</span> 
            with anti-drift controls — so you never miss a requirement again.
          </p>
        </div>

        {/* Minimal value props */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <div className="text-4xl md:text-5xl font-extralight text-foreground">8</div>
            <div className="text-xs text-muted-foreground/80">Expert Advisors</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-4xl md:text-5xl font-extralight text-foreground">30m</div>
            <div className="text-xs text-muted-foreground/80">Average Time</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-4xl md:text-5xl font-extralight text-foreground">15</div>
            <div className="text-xs text-muted-foreground/80">Sections</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-4xl md:text-5xl font-extralight text-foreground">$20</div>
            <div className="text-xs text-muted-foreground/80">Per Spec</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 justify-center items-center pt-10">
          <AnimatedButton onClick={scrollToInput} className="text-base px-10 py-5">
            Get Started
          </AnimatedButton>
          <p className="text-xs text-muted-foreground/60">$20 per spec • Money back guarantee</p>
        </div>
      </div>

      {/* What You Get - Deliverable Preview */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">What You Get</h2>
          <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto">
            Production-ready specification with 15 comprehensive sections
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { title: "Executive Summary", items: ["Business value", "Key objectives", "Timeline & costs"] },
            { title: "Requirements", items: ["Functional & non-functional", "Acceptance criteria", "Traceability matrix"] },
            { title: "System Architecture", items: ["Component design", "Data flow", "Scalability plan"] },
            { title: "Data Model", items: ["Entity definitions", "Relationships", "Migration strategy"] },
            { title: "API Specifications", items: ["Endpoint documentation", "Authentication", "Rate limiting"] },
            { title: "Security & Compliance", items: ["Threat model", "Data protection", "Regulatory requirements"] },
            { title: "Testing Strategy", items: ["Unit, integration, E2E", "Performance tests", "Coverage targets"] },
            { title: "Deployment Plan", items: ["CI/CD pipeline", "Environments", "Rollback strategy"] },
            { title: "Risk Assessment", items: ["Probability & impact", "Mitigation plans", "Risk owners"] },
            { title: "Timeline & Milestones", items: ["Phase breakdown", "Dependencies", "Deliverables"] },
            { title: "Tech Stack Analysis", items: ["Recommended technologies", "Alternatives comparison", "Research-backed"] },
            { title: "Anti-Drift Controls", items: ["Scope boundaries", "Change management", "Validation checklist"] }
          ].map((section, i) => (
            <Card key={i} className="p-4 space-y-2 border-border/30 bg-card/30 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-foreground/40 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-xs mb-1.5">{section.title}</div>
                  <ul className="space-y-0.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-[10px] text-muted-foreground/60">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Expert Advisory Panel */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">Your Advisory Panel</h2>
          <p className="text-sm text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            Simulating a productive meeting by world-renowned major league moguls — at the speed of <span className="font-semibold text-foreground/80">Groq Cloud</span> with the research power of <span className="font-semibold text-foreground/80">Exa MCP</span> remote workers in the cloud. High-fidelity AI models trained on the complete corpus of publicly available tweets, videos, books, 
            news articles, and interviews — with daily real-time monitoring and scraping. Each advisor brings 
            authentic expertise from Steve Jobs' user obsession to Amal Clooney's risk analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {EXPERTS.map((expert, index) => (
            <ExpertCard key={expert.id} expert={expert} index={index} />
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">How It Works</h2>
          <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto">
            Six-phase workflow with research validation and expert debate
          </p>
        </div>

        <div className="grid md:grid-cols-6 gap-3">
          {[
            { phase: "Constitution", icon: Shield },
            { phase: "Specify", icon: FileText },
            { phase: "Plan", icon: GitBranch },
            { phase: "Research", icon: Search },
            { phase: "Tasks", icon: CheckCircle2 },
            { phase: "Deliver", icon: Zap }
          ].map((item, i) => (
            <Card key={i} className="p-3 text-center border-border/20 bg-card/20">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center mx-auto mb-2">
                <item.icon className="w-4 h-4 text-foreground/50" />
              </div>
              <div className="text-[10px] font-medium text-foreground/70">{i + 1}. {item.phase}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cutting Edge Research */}
      <div className="max-w-5xl mx-auto">
        <Card className="p-8 md:p-10 border-border/20 bg-card/20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-light tracking-tight">Absolute Cutting Edge</h3>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                Your specs are validated against the latest AI-native tools and frameworks. 
                We monitor and scrape in real-time daily — finding today's security patches, 
                framework updates, and breakthrough architectural patterns from tweets, videos, 
                documentation, and research papers.
              </p>
              <div className="space-y-1.5 pt-2">
                {[
                  "Latest framework versions",
                  "Current security practices",
                  "Recent architectural patterns",
                  "Up-to-date compliance"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-foreground/40 flex-shrink-0" />
                    <span className="text-foreground/60">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background/30 rounded-lg p-5 border border-border/20">
              <div className="text-[10px] text-muted-foreground/50 mb-2">Sample Research Query</div>
              <div className="space-y-2">
                <div className="bg-foreground/5 rounded p-2.5 border border-border/10">
                  <div className="text-[10px] font-mono text-foreground/70">React 19 server components 2025</div>
                </div>
                <div className="space-y-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px]">
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-foreground/50">React Docs - Server Components</div>
                        <div className="text-muted-foreground/40 text-[9px]">Score: 0.98</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Simple Pricing */}
      <div className="max-w-2xl mx-auto">
        <Card className="p-10 md:p-12 text-center border-border/20 bg-card/20">
          <div className="space-y-6">
            <div>
              <div className="text-6xl md:text-7xl font-extralight text-foreground mb-2">$20</div>
              <div className="text-sm text-muted-foreground/70">per specification</div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-foreground/60">Complete production-ready spec</p>
              <p className="text-xs text-foreground/60">Money back guarantee</p>
              <p className="text-xs text-foreground/60">No trial, no subscription</p>
            </div>
            <AnimatedButton onClick={scrollToInput} className="text-base px-10 py-5">
              Get Started
            </AnimatedButton>
          </div>
        </Card>
      </div>

      {/* Scrolling Text Section with "Ship" finale */}
      <ScrollingTextSection />

      {/* Footer - at the very end */}
      <Footer />
    </div>
  );
};
