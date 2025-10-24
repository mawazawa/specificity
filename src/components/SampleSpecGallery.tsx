import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Package, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface SampleSpec {
  title: string;
  description: string;
  input: string;
  category: string;
  icon: React.ReactNode;
  tags: string[];
}

const SAMPLE_SPECS: SampleSpec[] = [
  {
    title: "AI SaaS Platform",
    description: "Build an AI-powered content generation platform with team collaboration",
    input: "I want to build a SaaS platform where teams can use AI to generate marketing content, blog posts, and social media. Users should be able to collaborate, save templates, and integrate with tools like Notion and Slack.",
    category: "SaaS",
    icon: <Sparkles className="w-5 h-5" />,
    tags: ["AI", "Collaboration", "Marketing"]
  },
  {
    title: "Fitness Tracking App",
    description: "Mobile app for workout tracking with social features and AI coaching",
    input: "Create a mobile fitness app where users can log workouts, track progress, compete with friends, and get AI-powered coaching recommendations. Include integration with Apple Health and wearables.",
    category: "Mobile",
    icon: <Smartphone className="w-5 h-5" />,
    tags: ["Mobile", "Health", "Social"]
  },
  {
    title: "E-commerce Platform",
    description: "Modern e-commerce with AR product previews and AI recommendations",
    input: "Build an e-commerce platform with AR product visualization, AI-powered product recommendations, one-click checkout, and seller dashboard. Support for subscriptions and digital products.",
    category: "E-commerce",
    icon: <Package className="w-5 h-5" />,
    tags: ["Commerce", "AR", "AI"]
  },
  {
    title: "Real-time Analytics Dashboard",
    description: "Analytics platform for monitoring business metrics in real-time",
    input: "I need a real-time analytics dashboard that aggregates data from multiple sources (Stripe, GA4, database), shows customizable charts, sends alerts, and generates automated reports.",
    category: "Analytics",
    icon: <Zap className="w-5 h-5" />,
    tags: ["Analytics", "Real-time", "Business"]
  }
];

interface SampleSpecGalleryProps {
  onSelectSample: (input: string) => void;
}

export const SampleSpecGallery = ({ onSelectSample }: SampleSpecGalleryProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Not sure where to start?
        </h3>
        <p className="text-sm text-muted-foreground">
          Try one of these example projects to see how it works
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE_SPECS.map((sample, index) => (
          <motion.div
            key={sample.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group cursor-pointer h-full flex flex-col"
              onClick={() => onSelectSample(sample.input)}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {sample.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {sample.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {sample.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample(sample.input);
                  }}
                >
                  Try This Example
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Click any example to populate the input field, then hit "Generate Spec" to see the magic happen
        </p>
      </div>
    </div>
  );
};
