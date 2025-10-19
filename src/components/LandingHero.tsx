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
    <div className="space-y-24 animate-fade-in">
      {/* Branding - Very Top */}
      <div className="text-center pt-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground">
            Specificity AI
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">Precision Intelligence for Production-Grade Specifications</p>
      </div>

      {/* Expert Advisory Panel - Top Priority */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-4 py-2">
            <Users className="w-3 h-3 mr-2" />
            Your Expert Advisory Panel
          </Badge>
          <h2 className="text-3xl font-bold">World-Class AI Advisors</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each specification is analyzed by 6 AI experts, each embodying the methodologies and thinking patterns 
            of legendary innovators. This isn't just prompt engineering—it's a carefully crafted multi-perspective analysis system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERTS.map((expert, index) => (
            <ExpertCard key={expert.id} expert={expert} index={index} />
          ))}
        </div>
      </div>

      {/* Hero Section - Above the fold, value proposition first */}
      <div className="text-center space-y-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">6-Phase SpecKit Methodology • Multi-Model AI • Real-Time Research</span>
        </div>
        
        {/* Headline - Enhanced Value Prop */}
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Generate Production-Grade Technical Specs
          <br />
          <span className="text-muted-foreground">with Multi-Agent AI Analysis</span>
        </h2>
        
        {/* Enhanced Value Proposition */}
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Stop wasting weeks on incomplete requirements. Get comprehensive, research-backed specifications 
          through a <span className="text-foreground font-medium">6-phase iterative process</span> with 
          8 world-class AI advisors and <span className="text-foreground font-medium">real-time tech research</span> 
          — complete with validation checklists and anti-feature-drift controls.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <AnimatedButton onClick={scrollToInput}>
            Start Your Spec
          </AnimatedButton>
        </div>

        {/* Enhanced Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-1">8</div>
            <div className="text-sm text-muted-foreground">AI Expert Advisors</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-1">6</div>
            <div className="text-sm text-muted-foreground">Workflow Phases</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-1">15</div>
            <div className="text-sm text-muted-foreground">Spec Sections</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-1">Live</div>
            <div className="text-sm text-muted-foreground">Tech Research</div>
          </div>
        </div>
      </div>

      {/* Unique Methodology - SpecKit 6-Phase Process */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-4 py-2">
            <GitBranch className="w-3 h-3 mr-2" />
            Inspired by GitHub's SpecKit Methodology
          </Badge>
          <h2 className="text-3xl font-bold">Iterative 6-Phase Workflow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlike one-shot AI tools, our multi-round process ensures comprehensive coverage with validation at every step
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

      {/* Research-Powered Intelligence */}
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 bg-gradient-to-br from-accent/5 via-card to-card/50 border-accent/20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="border-accent/30">
                <Search className="w-3 h-3 mr-2" />
                Powered by Exa AI Research
              </Badge>
              <h3 className="text-2xl font-bold">Always Current, Always Accurate</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every spec generation includes real-time research across the latest technical documentation, 
                best practices, and cutting-edge advances. Our AI agents don't just guess — they search 
                the web for the most recent information at every phase.
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

      {/* Comprehensive Output - 15 Sections */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Production-Grade Specifications</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every spec includes 15 comprehensive sections with anti-drift controls, requirement traceability, and validation checklists
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
