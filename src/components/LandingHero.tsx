import { Sparkles, Users, FileText, Zap, Search, GitBranch, Shield, CheckCircle2, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AnimatedButton } from "./AnimatedButton";
import { ExpertCard } from "./ExpertCard";
import { EXPERTS } from "@/types/expert";
import { ScrollingTextSection } from "./ScrollingTextSection";
import { Footer } from "./Footer";

export const LandingHero = () => {
  const scrollToInput = () => {
    const inputElement = document.querySelector('[data-spec-input]');
    inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-32 animate-fade-in">
      {/* HERO SECTION - PAS Framework: Problem → Agitate → Solve */}
      <div className="text-center space-y-12 max-w-6xl mx-auto pt-16 pb-8">
        {/* Urgency Badge - Cognitive Bias: Scarcity */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 animate-pulse">
          <Sparkles className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Limited Beta Access • 147 Spots Remaining</span>
        </div>
        
        {/* 4-U Headline: Useful, Unique, Urgent, Ultra-specific */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          <span className="block text-foreground/90 mb-2">Stop Wasting 3 Weeks</span>
          <span className="block text-foreground/90 mb-2">on Incomplete Requirements.</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] animate-shimmer">
            Get Production-Ready Specs in 30 Minutes.
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

        {/* Social Proof - Above Fold */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 max-w-5xl mx-auto">
          <div className="text-center space-y-2">
            <div className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-accent to-primary">8</div>
            <div className="text-sm text-muted-foreground font-medium">AI Expert Advisors</div>
            <div className="text-xs text-muted-foreground/60">Debate every decision</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-accent to-primary">30m</div>
            <div className="text-sm text-muted-foreground font-medium">Average Time</div>
            <div className="text-xs text-muted-foreground/60">vs 3 weeks manual</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-accent to-primary">15</div>
            <div className="text-sm text-muted-foreground font-medium">Complete Sections</div>
            <div className="text-xs text-muted-foreground/60">From vision to deploy</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-accent to-primary">100%</div>
            <div className="text-sm text-muted-foreground font-medium">Research-Backed</div>
            <div className="text-xs text-muted-foreground/60">Live web searches</div>
          </div>
        </div>

        {/* CTA - First Person Psychology */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <AnimatedButton onClick={scrollToInput} className="text-lg px-8 py-6">
            Get My Free Spec Now →
          </AnimatedButton>
          <p className="text-xs text-muted-foreground">No credit card • 2-minute setup</p>
        </div>

        {/* Trust Signal Clustering */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground/70">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>GDPR Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span>99.9% Uptime SLA</span>
          </div>
        </div>
      </div>

      {/* OBJECTION PREEMPTION - Address top 3 concerns */}
      <div className="max-w-5xl mx-auto">
        <Card className="p-10 bg-gradient-to-br from-card/50 via-card to-accent/5 border-accent/20">
          <h2 className="text-2xl font-bold text-center mb-8">"Will This Actually Work for My Project?"</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Not Another Generic Template</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each spec is custom-researched with live web searches. We find the latest framework versions, 
                security patches, and architectural patterns specific to <em>your</em> tech stack.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Multi-Perspective Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                8 AI experts (modeled on Jobs, Musk, Clooney, etc.) debate trade-offs. 
                What one misses, another catches. You get the wisdom of crowds, not a single AI voice.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Anti-Drift Built In</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every spec includes scope boundaries, change management processes, and validation checklists. 
                No more "just one more feature" killing your timeline.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Expert Advisory Panel - Social Proof */}
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-4 py-2 border-accent/30">
            <Users className="w-3 h-3 mr-2" />
            Meet Your AI Advisory Panel
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">8 Expert Minds. One Spec.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Each advisor brings a unique lens — from Steve Jobs' user obsession to Amal Clooney's risk analysis. 
            They debate, challenge, and refine until every edge case is covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERTS.map((expert, index) => (
            <ExpertCard key={expert.id} expert={expert} index={index} />
          ))}
        </div>
      </div>

      {/* Benefit-First Methodology */}
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-4 py-2 border-accent/30">
            <GitBranch className="w-3 h-3 mr-2" />
            Proven GitHub SpecKit Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Never Miss a Requirement Again</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Our 6-phase workflow catches what others miss. Each phase builds on the last, 
            with research validation and expert debate ensuring nothing falls through the cracks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { phase: "Constitution", icon: Shield, desc: "Establish core principles & constraints" },
            { phase: "Specify", icon: FileText, desc: "Define user needs & requirements" },
            { phase: "Plan", icon: GitBranch, desc: "Technical architecture & design" },
            { phase: "Clarify", icon: Search, desc: "Research & validation with Exa" },
            { phase: "Tasks", icon: CheckCircle2, desc: "Implementation breakdown" },
            { phase: "Implement", icon: Zap, desc: "Final spec with traceability" }
          ].map((item, i) => (
            <Card key={i} className="p-4 text-center hover-scale border-accent/20 bg-gradient-card">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xs font-semibold mb-2">{i + 1}. {item.phase}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{item.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefit: Never Use Outdated Tech */}
      <div className="max-w-6xl mx-auto">
        <Card className="p-10 md:p-12 bg-gradient-to-br from-accent/5 via-card to-card/50 border-accent/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-accent/30">
                <Search className="w-3 h-3 mr-2" />
                Live Research Engine
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold">Never Deploy Deprecated Code Again</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Your competitors use last year's best practices. You get <span className="text-foreground font-semibold">live web searches</span> 
                finding today's security patches, framework updates, and cutting-edge patterns — 
                before you write a single line of code.
              </p>
              <div className="space-y-2 pt-4">
                {[
                  "Latest framework versions & compatibility",
                  "Current security best practices",
                  "Recent architectural patterns",
                  "Up-to-date compliance requirements"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background/50 rounded-xl p-6 border border-border/30">
              <div className="text-xs text-muted-foreground mb-3">Sample Research Query</div>
              <div className="space-y-3">
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                  <div className="text-xs font-mono text-accent">Searching: "React 19 server components best practices 2025"</div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <ExternalLink className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-foreground/70">React Documentation - Server Components</div>
                        <div className="text-muted-foreground text-[10px]">Published 2025, Score: 0.98</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Benefit: Everything Your Dev Team Needs */}
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">From Napkin Sketch to Dev-Ready in Minutes</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Stop bouncing between Notion, Figma, and Google Docs. Get <span className="text-foreground font-semibold">15 battle-tested sections</span> 
            covering everything from user stories to rollback strategies — in one exportable document.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
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
            <Card key={i} className="p-5 space-y-3 border-border/30 bg-card/50 hover-scale">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-2">{section.title}</div>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Scrolling Text Section */}
      <ScrollingTextSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};
