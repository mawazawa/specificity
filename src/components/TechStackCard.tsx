import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TechStackItem, TechAlternative } from "@/types/spec";

/**
 * Generate Brandfetch CDN URL for technology logos
 * Falls back to lettermark if logo not found
 * @see https://docs.brandfetch.com/logo-api/overview
 */
function getBrandfetchLogoUrl(domain: string, opts: { width?: number; height?: number; theme?: 'dark' | 'light' } = {}): string {
  const { width = 64, height = 64, theme = 'dark' } = opts;
  return `https://cdn.brandfetch.io/${domain}/w/${width}/h/${height}?theme=${theme}&fallback=lettermark`;
}

/**
 * Get the best logo URL for a technology
 * Priority: 1. Brandfetch (if domain available) 2. Provided logo URL 3. Fallback SVG
 */
function getTechLogoUrl(tech: TechAlternative): string {
  if (tech.domain) {
    return getBrandfetchLogoUrl(tech.domain);
  }
  if (tech.logo && tech.logo.trim() !== '') {
    return tech.logo;
  }
  // Fallback to a generic tech icon
  return '/fallback-icons/generic-tech.svg';
}

interface TechStackCardProps {
  item: TechStackItem;
  onSelect: (category: string, techName: string) => void;
}

export const TechStackCard = ({ item, onSelect }: TechStackCardProps) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  // Handle image load errors by falling back to generic icon
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    // Prevent infinite loop - only try fallback once
    if (!target.dataset.fallbackAttempted) {
      target.dataset.fallbackAttempted = 'true';
      target.src = '/fallback-icons/generic-tech.svg';
    }
  }, []);

  const renderTechOption = (tech: typeof item.selected, isSelected: boolean) => (
    <Card
      className={`p-4 transition-all duration-300 cursor-pointer group ${
        isSelected
          ? "bg-gradient-to-br from-primary/20 via-primary/10 to-background/50 border-primary/50 ring-2 ring-primary/30"
          : "bg-background/40 border-border/20 hover:border-primary/30 hover:bg-background/60"
      }`}
      onClick={() => !isSelected && onSelect(item.category, tech.name)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-background/80 border border-border/30 flex items-center justify-center p-1.5 shrink-0">
              <img
                src={getTechLogoUrl(tech)}
                alt={tech.name}
                className="w-full h-full object-contain"
                onError={handleImageError}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground truncate">{tech.name}</h4>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </div>
              {renderStars(tech.rating)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="space-y-1">
            <p className="text-muted-foreground/60 uppercase tracking-wider font-medium">Pros</p>
            <ul className="space-y-0.5">
              {tech.pros.slice(0, 2).map((pro, i) => (
                <li key={i} className="text-foreground/70 flex items-start gap-1">
                  <span className="text-primary mt-0.5">+</span>
                  <span className="line-clamp-1">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground/60 uppercase tracking-wider font-medium">Cons</p>
            <ul className="space-y-0.5">
              {tech.cons.slice(0, 2).map((con, i) => (
                <li key={i} className="text-foreground/70 flex items-start gap-1">
                  <span className="text-destructive mt-0.5">-</span>
                  <span className="line-clamp-1">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{item.category}</h3>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Selected technology stack</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAlternatives(!showAlternatives)}
          className="text-xs"
        >
          {showAlternatives ? "Hide" : "Show"} Alternatives
        </Button>
      </div>

      {renderTechOption(item.selected, true)}

      <AnimatePresence>
        {showAlternatives && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 pt-2 border-t border-border/20">
              <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Alternative Options
              </p>
            </div>
            <div className="space-y-2">
              {item.alternatives.map((alt) => (
                <div key={alt.name}>
                  {renderTechOption(alt, false)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
