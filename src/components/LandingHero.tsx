import { Sparkles, Users, FileText, Zap } from "lucide-react";
import { Card } from "./ui/card";

export const LandingHero = () => {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section - Above the fold, value proposition first */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Product Specification</span>
        </div>
        
        {/* Headline 4-U Formula: Useful, Unique, Urgent, Ultra-specific */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Turn Your Idea Into a
          <br />
          <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Production-Ready Spec
          </span>
        </h1>
        
        {/* Above-Fold Value Proposition: Customer problem focus */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Stop struggling with incomplete requirements. Get a comprehensive technical specification 
          vetted by world-class AI advisors in minutes, not weeks.
        </p>

        {/* Social Proof - Testimonial placement */}
        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">8</div>
            <div className="text-sm text-muted-foreground">Expert Advisors</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">3x</div>
            <div className="text-sm text-muted-foreground">Faster Than Manual</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">100%</div>
            <div className="text-sm text-muted-foreground">AI-Powered</div>
          </div>
        </div>
      </div>

      {/* How It Works - Visual Hierarchy F-Pattern */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 space-y-4 hover-scale border-border/50 bg-card/50 backdrop-blur">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">1. Panel Discussion</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your idea is analyzed by 8 AI experts including Steve Jobs, Elon Musk, and Paul Graham
          </p>
        </Card>

        <Card className="p-6 space-y-4 hover-scale border-border/50 bg-card/50 backdrop-blur">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">2. Deep Research</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI agents research best practices, technical requirements, and potential risks
          </p>
        </Card>

        <Card className="p-6 space-y-4 hover-scale border-border/50 bg-card/50 backdrop-blur">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">3. Spec Generation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Receive a complete specification with tech stack, architecture, and implementation plan
          </p>
        </Card>
      </div>

      {/* Benefits - Benefit-First Language */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-center mb-8">
          What You Get
        </h2>
        
        <div className="grid gap-4">
          {[
            { 
              benefit: "Save 2-3 weeks of planning time",
              detail: "Get your spec in under 10 minutes instead of endless meetings"
            },
            { 
              benefit: "Catch critical issues before development",
              detail: "AI advisors identify risks and technical challenges upfront"
            },
            { 
              benefit: "Get multiple expert perspectives",
              detail: "Design, engineering, and business viewpoints in one document"
            },
            { 
              benefit: "Start development immediately",
              detail: "Production-ready specs your team can execute today"
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{item.benefit}</div>
                <div className="text-sm text-muted-foreground">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
