import { useState, useEffect } from "react";

type AvatarVariant = "celebrity" | "archetype";

const STORAGE_KEY = "specificity-avatar-variant";

/**
 * A/B test hook for avatar display style
 *
 * Variants:
 * - "celebrity": Original celebrity personas (Steve Jobs, Elon Musk, etc.)
 * - "archetype": Abstract role-based names (The Visionary, The Disruptor, etc.)
 *
 * The variant is randomly assigned on first visit and persisted in localStorage.
 * This allows for A/B testing of enterprise-friendly vs recognition-optimized naming.
 *
 * @returns The current avatar variant for this user
 */
export const useAvatarVariant = (): AvatarVariant => {
  const [variant, setVariant] = useState<AvatarVariant>(() => {
    // Check for existing variant in localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as AvatarVariant | null;
      if (stored === "celebrity" || stored === "archetype") {
        return stored;
      }
    }
    // Default to celebrity for SSR
    return "celebrity";
  });

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);

    // If no variant stored, randomly assign one
    if (!stored) {
      const newVariant: AvatarVariant = Math.random() > 0.5 ? "celebrity" : "archetype";
      localStorage.setItem(STORAGE_KEY, newVariant);
      setVariant(newVariant);
    }
  }, []);

  return variant;
};

/**
 * Archetype aliases for celebrity personas
 * Maps celebrity names to enterprise-friendly role descriptions
 */
export const ARCHETYPE_ALIASES: Record<string, string> = {
  "Steve Jobs": "The Visionary",
  "Elon Musk": "The Disruptor",
  "Oprah Winfrey": "The Connector",
  "Zaha Hadid": "The Innovator",
  "Jony Ive": "The Craftsman",
  "Steven Bartlett": "The Strategist",
  "Amal Clooney": "The Advocate",
};

/**
 * Get display name based on current A/B variant
 * @param celebrityName Original celebrity name
 * @param variant Current A/B test variant
 * @returns Either the celebrity name or archetype alias
 */
export const getDisplayName = (celebrityName: string, variant: AvatarVariant): string => {
  if (variant === "archetype" && ARCHETYPE_ALIASES[celebrityName]) {
    return ARCHETYPE_ALIASES[celebrityName];
  }
  return celebrityName;
};
