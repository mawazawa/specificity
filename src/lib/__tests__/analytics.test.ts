/**
 * Analytics Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  configureAnalytics,
  identify,
  resetIdentity,
  track,
  trackPageView,
  trackFeature,
  trackSpecFlow,
  trackError,
  trackConversion,
  trackTiming,
  getAnalyticsState,
  AnalyticsEvents,
} from '../analytics';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock sessionStorage for Node.js environment
const mockStorage: Record<string, string> = {};
const mockSessionStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  },
  length: 0,
  key: () => null,
};

// @ts-expect-error - mock global sessionStorage
globalThis.sessionStorage = mockSessionStorage;

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    // Reset analytics state
    resetIdentity();
    // Enable analytics for testing
    configureAnalytics({
      enabled: true,
      debug: false,
      sampleRate: 1.0,
      respectDoNotTrack: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configureAnalytics', () => {
    it('should update configuration', () => {
      configureAnalytics({ enabled: false });
      const state = getAnalyticsState();
      expect(state.config.enabled).toBe(false);
    });

    it('should merge with existing configuration', () => {
      configureAnalytics({ sampleRate: 0.5 });
      const state = getAnalyticsState();
      expect(state.config.sampleRate).toBe(0.5);
      expect(state.config.enabled).toBe(true);
    });
  });

  describe('identify', () => {
    it('should set user ID', () => {
      identify('user-123');
      const state = getAnalyticsState();
      expect(state.userTraits.userId).toBe('user-123');
    });

    it('should set user traits', () => {
      identify('user-123', { plan: 'pro', specCount: 5 });
      const state = getAnalyticsState();
      expect(state.userTraits.plan).toBe('pro');
      expect(state.userTraits.specCount).toBe(5);
    });

    it('should call Sentry.setUser', () => {
      identify('user-123', { plan: 'pro' });
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        plan: 'pro',
      });
    });
  });

  describe('resetIdentity', () => {
    it('should clear user traits', () => {
      identify('user-123', { plan: 'pro' });
      resetIdentity();
      const state = getAnalyticsState();
      expect(state.userTraits.userId).toBeUndefined();
    });

    it('should call Sentry.setUser with null', () => {
      identify('user-123');
      resetIdentity();
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should clear session ID', () => {
      track('Test Event');
      resetIdentity();
      const state = getAnalyticsState();
      expect(state.sessionId).toBeNull();
    });
  });

  describe('track', () => {
    it('should send event to Sentry as breadcrumb', () => {
      track('Test Event', { foo: 'bar' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'analytics',
          message: 'Test Event',
          level: 'info',
        })
      );
    });

    it('should include user traits in event properties', () => {
      identify('user-123', { plan: 'pro' });
      track('Test Event', { foo: 'bar' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            foo: 'bar',
            userId: 'user-123',
            plan: 'pro',
          }),
        })
      );
    });

    it('should not track when disabled', () => {
      configureAnalytics({ enabled: false });
      track('Test Event');
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should respect sample rate', () => {
      configureAnalytics({ sampleRate: 0 });
      track('Test Event');
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    it('should track page view with page name', () => {
      trackPageView('Home');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Page Viewed',
          data: expect.objectContaining({
            page: 'Home',
          }),
        })
      );
    });

    it('should include path in page view', () => {
      trackPageView('Specs', '/specs');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            path: '/specs',
          }),
        })
      );
    });
  });

  describe('trackFeature', () => {
    it('should track feature usage', () => {
      trackFeature('Voice Input', 'started');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Feature Used',
          data: expect.objectContaining({
            feature: 'Voice Input',
            action: 'started',
          }),
        })
      );
    });
  });

  describe('trackSpecFlow', () => {
    it('should track spec flow stage', () => {
      trackSpecFlow('started', { inputLength: 500 });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Spec Flow',
          data: expect.objectContaining({
            stage: 'started',
            inputLength: 500,
          }),
        })
      );
    });

    it('should track all flow stages', () => {
      const stages = [
        'started',
        'questions',
        'research',
        'challenge',
        'synthesis',
        'review',
        'voting',
        'spec',
        'completed',
        'failed',
      ] as const;

      stages.forEach((stage) => {
        vi.clearAllMocks();
        trackSpecFlow(stage);
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ stage }),
          })
        );
      });
    });
  });

  describe('trackError', () => {
    it('should track error with type and message', () => {
      trackError('API_ERROR', 'Request failed');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error Occurred',
          data: expect.objectContaining({
            errorType: 'API_ERROR',
            errorMessage: 'Request failed',
          }),
        })
      );
    });
  });

  describe('trackConversion', () => {
    it('should track conversion events', () => {
      trackConversion('signup', { source: 'organic' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Conversion',
          data: expect.objectContaining({
            type: 'signup',
            source: 'organic',
          }),
        })
      );
    });
  });

  describe('trackTiming', () => {
    it('should track timing data', () => {
      trackTiming('API', 'spec-generation', 5000);
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Timing',
          data: expect.objectContaining({
            category: 'API',
            variable: 'spec-generation',
            duration: 5000,
          }),
        })
      );
    });
  });

  describe('AnalyticsEvents', () => {
    it('should have all expected events', () => {
      expect(AnalyticsEvents.SIGNUP_STARTED).toBe('Signup Started');
      expect(AnalyticsEvents.SPEC_COMPLETED).toBe('Spec Completed');
      expect(AnalyticsEvents.CHAT_OPENED).toBe('Chat Opened');
      expect(AnalyticsEvents.ERROR_BOUNDARY_HIT).toBe('Error Boundary Hit');
    });
  });

  describe('getAnalyticsState', () => {
    it('should return current state', () => {
      identify('user-123');
      track('Test Event');
      const state = getAnalyticsState();
      expect(state.config).toBeDefined();
      expect(state.userTraits.userId).toBe('user-123');
      expect(state.sessionId).toBeDefined();
    });
  });
});
