/**
 * Product Analytics & User Tracking
 * Privacy-respecting analytics for understanding user behavior
 * Action 14: 90% confidence
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
  sessionId?: string;
}

interface UserTraits {
  userId?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  signupDate?: string;
  specCount?: number;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  sampleRate: number; // 0-1, percentage of events to track
  respectDoNotTrack: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: import.meta.env.PROD,
  debug: import.meta.env.DEV,
  sampleRate: 1.0, // Track 100% in production
  respectDoNotTrack: true,
};

let config = { ...DEFAULT_CONFIG };
let sessionId: string | null = null;
let userTraits: UserTraits = {};

// ============================================
// HELPERS
// ============================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if Do Not Track is enabled
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes';
}

/**
 * Check if analytics should be active
 */
function isAnalyticsActive(): boolean {
  if (!config.enabled) return false;
  if (config.respectDoNotTrack && isDoNotTrackEnabled()) return false;
  return Math.random() < config.sampleRate;
}

/**
 * Check if sessionStorage is available
 */
function hasSessionStorage(): boolean {
  try {
    return typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (!sessionId) {
    // Try to restore from sessionStorage
    if (hasSessionStorage()) {
      const stored = sessionStorage.getItem('analytics_session_id');
      if (stored) {
        sessionId = stored;
      } else {
        sessionId = generateSessionId();
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
    } else {
      sessionId = generateSessionId();
    }
  }
  return sessionId;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Configure analytics
 */
export function configureAnalytics(newConfig: Partial<AnalyticsConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Identify a user
 */
export function identify(userId: string, traits?: Partial<UserTraits>): void {
  userTraits = {
    ...userTraits,
    userId,
    ...traits,
  };

  // Set Sentry user context
  Sentry.setUser({
    id: userId,
    ...traits,
  });

  if (config.debug) {
    logger.info('[Analytics] User identified:', { userId, traits });
  }
}

/**
 * Clear user identity (on logout)
 */
export function resetIdentity(): void {
  userTraits = {};
  sessionId = null;
  if (hasSessionStorage()) {
    sessionStorage.removeItem('analytics_session_id');
  }
  Sentry.setUser(null);

  if (config.debug) {
    logger.info('[Analytics] Identity reset');
  }
}

/**
 * Track an event
 */
export function track(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsActive()) return;

  const event: AnalyticsEvent = {
    name: eventName,
    properties: {
      ...properties,
      ...userTraits,
    },
    timestamp: new Date(),
    sessionId: getSessionId(),
  };

  // Send to Sentry as breadcrumb
  Sentry.addBreadcrumb({
    category: 'analytics',
    message: eventName,
    level: 'info',
    data: event.properties,
  });

  if (config.debug) {
    logger.info('[Analytics] Event tracked:', event);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, path?: string): void {
  track('Page Viewed', {
    page: pageName,
    path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  });
}

/**
 * Track feature usage
 */
export function trackFeature(featureName: string, action: string): void {
  track('Feature Used', {
    feature: featureName,
    action,
  });
}

/**
 * Track spec generation flow
 */
export function trackSpecFlow(
  stage:
    | 'started'
    | 'questions'
    | 'research'
    | 'challenge'
    | 'synthesis'
    | 'review'
    | 'voting'
    | 'spec'
    | 'completed'
    | 'failed',
  metadata?: Record<string, unknown>
): void {
  track('Spec Flow', {
    stage,
    ...metadata,
  });
}

/**
 * Track error occurrence
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
): void {
  track('Error Occurred', {
    errorType,
    errorMessage,
    ...metadata,
  });
}

/**
 * Track conversion events
 */
export function trackConversion(
  conversionType: 'signup' | 'subscription' | 'spec_complete' | 'export',
  metadata?: Record<string, unknown>
): void {
  track('Conversion', {
    type: conversionType,
    ...metadata,
  });
}

/**
 * Track timing/performance
 */
export function trackTiming(
  category: string,
  variable: string,
  durationMs: number
): void {
  track('Timing', {
    category,
    variable,
    duration: durationMs,
  });
}

// ============================================
// PREDEFINED EVENTS
// ============================================

export const AnalyticsEvents = {
  // Auth events
  SIGNUP_STARTED: 'Signup Started',
  SIGNUP_COMPLETED: 'Signup Completed',
  LOGIN: 'Login',
  LOGOUT: 'Logout',

  // Spec events
  SPEC_STARTED: 'Spec Started',
  SPEC_INPUT_SUBMITTED: 'Spec Input Submitted',
  SPEC_STAGE_CHANGED: 'Spec Stage Changed',
  SPEC_COMPLETED: 'Spec Completed',
  SPEC_EXPORTED: 'Spec Exported',
  SPEC_SHARED: 'Spec Shared',

  // Chat events
  CHAT_OPENED: 'Chat Opened',
  CHAT_MESSAGE_SENT: 'Chat Message Sent',

  // UI events
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  SAMPLE_SPEC_SELECTED: 'Sample Spec Selected',
  VOICE_INPUT_USED: 'Voice Input Used',

  // Error events
  ERROR_BOUNDARY_HIT: 'Error Boundary Hit',
  API_ERROR: 'API Error',
  VALIDATION_ERROR: 'Validation Error',
} as const;

// ============================================
// REACT INTEGRATION
// ============================================

/**
 * React hook for tracking page views
 */
export function usePageTracking(pageName: string): void {
  // Track on mount
  if (typeof window !== 'undefined') {
    trackPageView(pageName);
  }
}

/**
 * Get analytics state (for debugging)
 */
export function getAnalyticsState(): {
  config: AnalyticsConfig;
  sessionId: string | null;
  userTraits: UserTraits;
  doNotTrack: boolean;
} {
  return {
    config,
    sessionId,
    userTraits,
    doNotTrack: isDoNotTrackEnabled(),
  };
}
