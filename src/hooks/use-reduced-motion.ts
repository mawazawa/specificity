/**
 * useReducedMotion hook
 * Respects user's prefers-reduced-motion system preference
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @see https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns true if the user prefers reduced motion
 * Subscribes to changes in the system preference
 *
 * @returns boolean indicating reduced motion preference
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // Disable animations when reduced motion is preferred
 * const animationProps = prefersReducedMotion
 *   ? {}
 *   : { animate: { scale: 1.1 }, transition: { duration: 0.3 } };
 */
export function useReducedMotion(): boolean {
  // Default to false (allow motion) for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(QUERY).matches;
    }
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns Framer Motion variant props that respect reduced motion
 * Disables all animation when reduced motion is preferred
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @returns Framer Motion props with or without animation
 */
export function getMotionSafeProps(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }
  return {};
}

/**
 * Default animation variants that respect reduced motion
 * Use with Framer Motion's variants prop
 */
export const reducedMotionVariants = {
  // Fade animation
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide up animation
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Scale animation
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  // No animation (for reduced motion)
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

/**
 * Get animation variant based on reduced motion preference
 *
 * @param name - The variant name ('fade', 'slideUp', 'scale')
 * @param reducedMotion - Whether reduced motion is preferred
 * @returns The appropriate variant object
 */
export function getVariant(
  name: keyof typeof reducedMotionVariants,
  reducedMotion: boolean
) {
  if (reducedMotion) {
    return reducedMotionVariants.none;
  }
  return reducedMotionVariants[name];
}
