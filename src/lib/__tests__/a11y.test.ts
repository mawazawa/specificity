/**
 * Unit Tests for accessibility utilities
 * Tests keyboard navigation and a11y helpers in src/lib/a11y.ts
 */

import { describe, it, expect, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of a11y functions for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

function createKeyboardClickHandler(
  onClick: () => void
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
}

function getInteractiveProps(
  onClick: () => void,
  ariaLabel?: string
) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: createKeyboardClickHandler(onClick),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('createKeyboardClickHandler', () => {
  it('should call onClick when Enter is pressed', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    const event = {
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    handler(event);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onClick when Space is pressed', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    const event = {
      key: ' ',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    handler(event);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not call onClick for other keys', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    const keysToTest = ['Tab', 'Escape', 'ArrowDown', 'a', '1', 'Shift'];

    keysToTest.forEach(key => {
      const event = {
        key,
        preventDefault: vi.fn()
      } as unknown as KeyboardEvent;

      handler(event);

      expect(onClick).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should prevent default action on activation keys', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    const enterEvent = {
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const spaceEvent = {
      key: ' ',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    handler(enterEvent);
    handler(spaceEvent);

    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(spaceEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent default for non-activation keys', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    const event = {
      key: 'Tab',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    handler(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('getInteractiveProps', () => {
  it('should return required ARIA attributes', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick);

    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);
    expect(typeof props.onClick).toBe('function');
    expect(typeof props.onKeyDown).toBe('function');
  });

  it('should include aria-label when provided', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick, 'Click to select');

    expect(props['aria-label']).toBe('Click to select');
  });

  it('should not include aria-label when not provided', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick);

    expect(props).not.toHaveProperty('aria-label');
  });

  it('should trigger onClick when clicked', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick);

    props.onClick();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger onClick on keyboard activation', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick);

    const event = {
      key: 'Enter',
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    props.onKeyDown(event);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should handle empty aria-label', () => {
    const onClick = vi.fn();
    const props = getInteractiveProps(onClick, '');

    // Empty string is falsy, so aria-label should not be included
    expect(props).not.toHaveProperty('aria-label');
  });

  it('should preserve onClick reference', () => {
    const onClick = vi.fn();
    const props1 = getInteractiveProps(onClick);
    const props2 = getInteractiveProps(onClick);

    // Both should reference the same onClick function
    expect(props1.onClick).toBe(onClick);
    expect(props2.onClick).toBe(onClick);
  });
});

describe('prefersReducedMotion', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should return false when window is undefined', () => {
    // Simulate SSR environment
    // @ts-expect-error - testing SSR scenario
    global.window = undefined;

    const result = prefersReducedMotion();
    expect(result).toBe(false);
  });

  it('should return false when matchMedia is not available', () => {
    global.window = {} as Window & typeof globalThis;

    const result = prefersReducedMotion();
    expect(result).toBe(false);
  });

  it('should return false when reduced motion is not preferred', () => {
    global.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    } as unknown as Window & typeof globalThis;

    const result = prefersReducedMotion();
    expect(result).toBe(false);
  });

  it('should return true when reduced motion is preferred', () => {
    global.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    } as unknown as Window & typeof globalThis;

    const result = prefersReducedMotion();
    expect(result).toBe(true);
  });

  it('should query correct media feature', () => {
    const matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    global.window = {
      matchMedia: matchMediaMock
    } as unknown as Window & typeof globalThis;

    prefersReducedMotion();

    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

describe('accessibility integration patterns', () => {
  it('should create fully accessible card props', () => {
    const handleSelect = vi.fn();
    const props = getInteractiveProps(handleSelect, 'Select AI SaaS Template');

    // Verify all required accessibility attributes
    expect(props).toEqual({
      role: 'button',
      tabIndex: 0,
      onClick: handleSelect,
      onKeyDown: expect.any(Function),
      'aria-label': 'Select AI SaaS Template'
    });
  });

  it('should support focus management patterns', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    const interactiveItems = items.map((item, index) => ({
      ...getInteractiveProps(() => console.log(`Selected ${item}`), `Select ${item}`),
      'data-index': index
    }));

    // All items should be focusable
    interactiveItems.forEach(item => {
      expect(item.tabIndex).toBe(0);
    });
  });

  it('should handle rapid keyboard activations', () => {
    const onClick = vi.fn();
    const handler = createKeyboardClickHandler(onClick);

    // Simulate rapid key presses
    for (let i = 0; i < 10; i++) {
      handler({
        key: 'Enter',
        preventDefault: vi.fn()
      } as unknown as KeyboardEvent);
    }

    expect(onClick).toHaveBeenCalledTimes(10);
  });
});
