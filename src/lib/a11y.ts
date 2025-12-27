/**
 * Accessibility utilities for keyboard navigation and ARIA support
 * Following WCAG 2.2 guidelines and React accessibility best practices
 *
 * @see https://www.w3.org/TR/WCAG22/
 * @see https://www.freecodecamp.org/news/designing-keyboard-accessibility-for-complex-react-experiences/
 */

import { KeyboardEvent } from 'react';

/**
 * Creates a keyboard event handler for interactive elements
 * Handles Enter and Space keys to trigger click actions
 *
 * @param onClick - The click handler to trigger
 * @returns A keyboard event handler
 *
 * @example
 * <div
 *   role="button"
 *   tabIndex={0}
 *   onClick={handleClick}
 *   onKeyDown={createKeyboardClickHandler(handleClick)}
 * >
 *   Interactive content
 * </div>
 */
export function createKeyboardClickHandler(
  onClick: () => void
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    // Only handle Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent scroll on Space
      onClick();
    }
  };
}

/**
 * Props to add to any interactive non-button element
 * Makes div/span/card elements keyboard accessible
 *
 * @param onClick - The click handler
 * @param ariaLabel - Accessible label for screen readers
 * @returns Object with all necessary accessibility props
 *
 * @example
 * <Card {...getInteractiveProps(handleClick, 'Select this option')}>
 *   Content
 * </Card>
 */
export function getInteractiveProps(
  onClick: () => void,
  ariaLabel?: string
): {
  role: 'button';
  tabIndex: 0;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  'aria-label'?: string;
} {
  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: createKeyboardClickHandler(onClick),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
  };
}

/**
 * Props for toggle elements (expandable cards, accordions)
 *
 * @param isExpanded - Current expanded state
 * @param onToggle - Toggle handler
 * @param ariaLabel - Accessible label
 * @returns Object with toggle-specific accessibility props
 */
export function getToggleProps(
  isExpanded: boolean,
  onToggle: () => void,
  ariaLabel: string
): {
  role: 'button';
  tabIndex: 0;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  'aria-expanded': boolean;
  'aria-label': string;
} {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onToggle,
    onKeyDown: createKeyboardClickHandler(onToggle),
    'aria-expanded': isExpanded,
    'aria-label': ariaLabel,
  };
}

/**
 * Check if user prefers reduced motion
 * Use with Framer Motion or CSS animations
 *
 * @returns boolean indicating reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
