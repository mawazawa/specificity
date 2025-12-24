import { FileText, Zap, Search, GitBranch, Shield, CheckCircle2, ExternalLink, Users, Sparkles } from "lucide-react";
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
import { CollaborativeFlowDiagram } from "./CollaborativeFlowDiagram";
import { SkeletonCard, SkeletonText } from "./ui/skeleton-loader";
import { useState } from "react";

interface LandingHeroProps {
  onGetStarted?: () => void;
}

export const LandingHero = ({ onGetStarted }: LandingHeroProps) => {
  const [showSkeletons, setShowSkeletons] = useState(false);

  return (
    <div className="space-y-32 animate-fade-in relative">
      {/* Grid background overlay - reduced opacity for less visual noise */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* HERO SECTION - Clean, Focused, Single CTA */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background/95 to-background"
        aria-labelledby="hero-heading"
      >
        <DottedGlowBackground
          className="pointer-events-none"
          opacity={0.5}
          gap={16}
          radius={2.2}
          colorLightVar="--foreground"
          glowColorLightVar="--accent"
          colorDarkVar="--foreground"
          glowColorDarkVar="--accent"
          backgroundOpacity={0.08}
          speedMin={0.25}
          speedMax={0.85}
          speedScale={0.8}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center space-y-8 max-w-6xl mx-auto px-4 py-8"
        >
          {/* Main Headline */}
          <div className="space-y-5">
            <h1
              id="hero-heading"
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 60px hsl(var(--accent) / 0.4))"
              }}
            >
              <span className="block">Production-Ready Specs</span>
              <span className="block text-2xl md:text-4xl lg:text-5xl font-light mt-3 opacity-90">
                in 30 Minutes
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto px-4">
              8 world-class AI advisors debate your product, research the latest tech,
              and deliver <span className="text-foreground font-semibold">15-section battle-tested specifications</span>
              —ready for Claude Code to build from idea to production.
            </p>
          </div>

          {/* Stats Grid - with hover micro-interactions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2 max-w-4xl mx-auto">
            {[
              { value: "8", label: "Expert Advisors", ariaLabel: "8 Expert Advisors" },
              { value: "30m", label: "Delivery Time", ariaLabel: "30 minute delivery" },
              { value: "15", label: "Comprehensive Sections", ariaLabel: "15 comprehensive sections" },
              { value: "$20", label: "Per Specification", ariaLabel: "20 dollar per spec" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center space-y-1.5 cursor-default select-none"
                role="group"
                aria-label={stat.ariaLabel}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-extralight text-foreground transition-colors duration-300"
                  whileHover={{ color: "hsl(var(--accent))" }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="pt-6"
          >
            <AnimatedButton
              onClick={onGetStarted}
              className="text-xl px-14 py-7 shadow-2xl"
              aria-label="Get started with specification generation"
              data-testid="get-started-button"
            >
              <span className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" aria-hidden="true" />
                Get Started
              </span>
            </AnimatedButton>
            <div className="flex items-center justify-center gap-6 mt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>30-min delivery</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>$20 flat fee</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>Money-back guarantee</span>
              </span>
            </div>
          </motion.div>

          {/* Problem Statement - Subtle */}
          <div className="max-w-2xl mx-auto pt-8">
            <p className="text-sm text-muted-foreground/60 leading-relaxed italic">
              Bad specs cost <span className="text-destructive font-medium not-italic">$50K in wasted dev time</span>
              and months of delays. Never miss a requirement again.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works - Clean 6-Step Process */}
      <section className="max-w-6xl mx-auto space-y-12" aria-labelledby="how-it-works-heading">
        <div className="text-center space-y-4">
          <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-light tracking-tight">
            How It Works
          </h2>
          <p className="text-base text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Six-phase collaborative workflow with real-time research validation and expert debate
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              phase: "Constitution",
              icon: Shield,
              description: "Establish project constitution, scope boundaries, and success criteria with expert alignment.",
              step: "1"
            },
            {
              phase: "Specify",
              icon: FileText,
              description: "Define detailed functional and non-functional requirements through collaborative debate.",
              step: "2"
            },
            {
              phase: "Plan",
              icon: GitBranch,
              description: "Architect system design, data models, and technical roadmap with scalability in mind.",
              step: "3"
            },
            {
              phase: "Research",
              icon: Search,
              description: "Validate all decisions against real-time web research and latest industry standards.",
              step: "4"
            },
            {
              phase: "Tasks",
              icon: CheckCircle2,
              description: "Break down implementation into actionable tasks with clear ownership and timelines.",
              step: "5"
            },
            {
              phase: "Deliver",
              icon: Zap,
              description: "Synthesize comprehensive 15-section specification with anti-drift controls.",
              step: "6"
            }
          ].map((item, i) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group"
            >
              <Card className="h-full p-6 text-center border-border/30 bg-card/30 backdrop-blur-sm shadow-lg group-hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-accent/40">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-6 h-6 text-accent" aria-hidden="true" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.phase}</h3>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.description}</p>
                </div>
              </Card>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Skeleton Loaders Section */}
      {showSkeletons && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* First Skeleton - Legible Content */}
          <Card className="p-8 space-y-6 border-border/30 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Executive Summary: Revolutionizing Product Specifications</h2>
              <div className="space-y-3 text-foreground/80 leading-relaxed">
                <p>
                  In the rapidly evolving landscape of software development, the gap between vision and execution has never been more critical. 
                  Traditional specification processes suffer from three fundamental failures: incomplete requirements discovery, stakeholder 
                  misalignment, and scope drift during implementation.
                </p>
                <p>
                  Our research indicates that <span className="font-semibold text-foreground">68% of failed projects</span> trace back to 
                  inadequate initial specifications, costing organizations an average of <span className="font-semibold text-destructive">$50,000 
                  in wasted development time</span> per project. The root cause isn't lack of effort—it's the absence of diverse, expert 
                  perspectives working in genuine collaboration.
                </p>
                <p>
                  This platform addresses these challenges through a revolutionary multi-agent AI system that simulates a world-class advisory 
                  board. Eight distinct expert personas—from Steve Jobs' design philosophy to Amal Clooney's risk assessment framework—engage 
                  in <span className="font-semibold text-foreground">iterative deliberation</span>, challenging assumptions, validating technical 
                  decisions against real-time research, and synthesizing comprehensive specifications that account for business, technical, legal, 
                  and user experience dimensions simultaneously.
                </p>
                <p className="pt-2 border-l-4 border-accent pl-4">
                  <span className="font-semibold">Deliverable:</span> A production-ready, 15-section specification document encompassing executive 
                  summary, functional requirements, system architecture, data models, API specifications, security protocols, testing strategy, 
                  deployment plan, risk assessment, timeline, tech stack analysis, and anti-drift controls—delivered in approximately 30 minutes 
                  for $20.
                </p>
              </div>
            </div>
          </Card>

          {/* Remaining 14 Skeletons - Blurred */}
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="relative">
              <div className="absolute inset-0 backdrop-blur-md bg-background/40 z-10 rounded-lg" />
              <SkeletonCard className="opacity-50" />
            </div>
          ))}
        </motion.div>
      )}

      {/* What You Get - Deliverable Preview */}
      <section className="max-w-6xl mx-auto space-y-12" aria-labelledby="what-you-get-heading">
        <div className="text-center space-y-4">
          <h2 id="what-you-get-heading" className="text-4xl md:text-5xl font-light tracking-tight">
            What You Get
          </h2>
          <p className="text-base text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Production-ready specification with 15 comprehensive sections—ready for Claude Code to execute
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <Card
              key={i}
              className="p-5 space-y-3 border-border/30 bg-card/30 backdrop-blur-sm hover:border-accent/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent/60 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2 text-foreground">{section.title}</h3>
                  <ul className="space-y-1" role="list">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-xs text-muted-foreground/70 leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Expert Advisory Panel - Unified */}
      <section className="max-w-7xl mx-auto space-y-16" aria-labelledby="advisory-panel-heading">
        <div className="text-center space-y-6">
          <h2 id="advisory-panel-heading" className="text-4xl md:text-5xl font-light tracking-tight">
            Your AI Advisory Panel
          </h2>
          <p className="text-base text-muted-foreground/70 max-w-4xl mx-auto leading-relaxed">
            Simulating a productive meeting of world-renowned experts — powered by{" "}
            <span className="font-semibold text-foreground/80">Groq Cloud</span> for speed and{" "}
            <span className="font-semibold text-foreground/80">Exa MCP</span> for real-time research.
            High-fidelity AI models trained on the complete corpus of publicly available content:
            tweets, videos, books, articles, and interviews.
          </p>
        </div>

        {/* Expert Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 lg:gap-10">
          {EXPERTS.map((expert, index) => (
            <ExpertCard key={expert.id} expert={expert} index={index} />
          ))}
        </div>

        {/* How They Collaborate */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Collaborative Flow Diagram */}
          <div className="lg:col-span-3">
            <Card className="p-8 border-border/20 bg-card/20 backdrop-blur-sm h-full">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl md:text-2xl font-light tracking-tight">Collaborative Refinement Process</h3>
                  <p className="text-xs text-muted-foreground/60">
                    Watch how advisors influence each other through iterative rounds
                  </p>
                </div>
                <CollaborativeFlowDiagram />
              </div>
            </Card>
          </div>

          {/* Key Differentiators */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 border-border/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm">True Collaboration</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Advisors <span className="text-foreground font-medium">debate, challenge, and refine</span> each other's perspectives — exactly like a real executive roundtable.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-border/20 bg-gradient-to-br from-accent/5 to-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-accent" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm">Research-Backed</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Every decision validated against <span className="text-foreground font-medium">real-time web research</span> using Exa MCP. No hallucinations, just verified recommendations.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-border/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm">Iterative Synthesis</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    The spec evolves through <span className="text-foreground font-medium">multiple refinement loops</span> until consensus is reached.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-border/20 bg-gradient-to-br from-accent/5 to-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm">Expert Synthesis</h4>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Each advisor brings <span className="text-foreground font-medium">authentic expertise</span> from Steve Jobs' design obsession to Amal Clooney's risk analysis.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

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
      <section className="max-w-3xl mx-auto" aria-labelledby="pricing-heading">
        <Card className="p-12 md:p-16 text-center border-border/20 bg-card/20 backdrop-blur-sm shadow-2xl">
          <div className="space-y-8">
            <div>
              <h2 id="pricing-heading" className="text-7xl md:text-8xl font-extralight text-foreground mb-3">
                $20
              </h2>
              <p className="text-base text-muted-foreground/70 font-medium">per specification</p>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>Complete production-ready specification</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                <span>No trial, no subscription</span>
              </div>
            </div>
            <AnimatedButton
              onClick={onGetStarted}
              className="text-lg px-12 py-6 mt-6"
              aria-label="Get started with specification generation"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                Get Started Now
              </span>
            </AnimatedButton>
          </div>
        </Card>
      </section>

      {/* Scrolling Text Section with "Ship" finale */}
      <ScrollingTextSection />

      {/* Footer - at the very end */}
      <Footer />
      <style>{`@keyframes blinking-cursor {0% {opacity:0;} 50% {opacity:1;} 100% {opacity:0;}}`}</style>
    </div>
  );
};
