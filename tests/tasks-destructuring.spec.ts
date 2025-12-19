import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Test for bug fix: Missing `tasks` destructuring in Index.tsx
 *
 * Bug description:
 * - useSpecFlow returns a `tasks` property (use-spec-flow.ts:618)
 * - Index.tsx was not destructuring `tasks` from the hook
 * - Index.tsx:220 passed `tasks={tasks}` to ActiveSessionContent
 * - This caused `tasks` to be undefined, potentially crashing the app
 *
 * Fix: Added `tasks` to the destructuring in Index.tsx:91-105
 */
test.describe('Tasks Destructuring Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Login to access the main application
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(process.env.TEST_USER_EMAIL!);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(process.env.TEST_USER_PASSWORD!);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
  });

  test('should not throw "tasks is undefined" error when rendering active session', async ({ page }) => {
    console.log('Testing that tasks prop is correctly destructured and passed...');

    // Track JavaScript errors specifically related to tasks
    const errors: string[] = [];
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
      errors.push(error.message);
    });

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        console.error('Console error:', text);
        // Check for errors related to undefined tasks or iteration
        if (text.includes('undefined') || text.includes('tasks') || text.includes('Cannot read properties')) {
          errors.push(text);
        }
      }
    });

    // Start the refinement flow which will trigger ActiveSessionContent rendering
    const getStartedButton = page.getByText('Get Started');
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    await getStartedButton.click();

    // Wait for the chat/session view to load
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 5000 });
    console.log('Session view loaded');

    // Wait for any async state updates
    await page.waitForTimeout(2000);

    // Verify no "tasks is undefined" or related errors occurred
    const tasksErrors = errors.filter(e =>
      e.toLowerCase().includes('tasks') ||
      e.includes('Cannot read properties of undefined') ||
      e.includes('is not iterable')
    );

    expect(tasksErrors).toHaveLength(0);
    console.log('✅ No tasks-related errors detected');

    // Additional check: The page should not be in an error state
    const errorBoundary = page.locator('[class*="error"], [data-error="true"]');
    const hasErrorState = await errorBoundary.count() > 0;
    expect(hasErrorState).toBe(false);

    console.log('✅ Test passed: tasks is properly destructured and passed to components');
  });

  test('should render ProcessViewer/PanelsView without crashing when tasks array is empty', async ({ page }) => {
    console.log('Testing tasks array handling when empty...');

    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to the session view
    const getStartedButton = page.getByText('Get Started');
    await getStartedButton.click();

    // Wait for view to load
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 5000 });

    // Let the app settle
    await page.waitForTimeout(1500);

    // Check for any runtime errors
    const criticalErrors = errors.filter(e =>
      e.includes('undefined') ||
      e.includes('null') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    );

    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No runtime errors with empty/undefined tasks');
  });
});
