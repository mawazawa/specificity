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
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(process.env.TEST_USER_EMAIL!);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(process.env.TEST_USER_PASSWORD!);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForURL('/', { timeout: 10000 });

    // Wait for page to stabilize after login
    await page.waitForTimeout(1500);

    // Dismiss any onboarding/welcome dialogs that may appear
    // The "Welcome to Specificity AI" modal has a Close button
    const dismissOnboardingDialog = async () => {
      // Wait a bit for dialogs to appear
      await page.waitForTimeout(1000);

      // Check if dialog exists
      const welcomeDialog = page.locator('[role="dialog"]');
      const dialogVisible = await welcomeDialog.isVisible().catch(() => false);

      if (dialogVisible) {
        console.log('Onboarding dialog detected, dismissing...');

        // Use getByRole for more reliable button selection
        const closeButton = page.getByRole('button', { name: 'Close' });
        const closeVisible = await closeButton.isVisible().catch(() => false);

        if (closeVisible) {
          await closeButton.click();
          console.log('Clicked Close button');
          await page.waitForTimeout(500);
        } else {
          // Try Escape as fallback
          console.log('Close button not found, trying Escape key...');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }

        // Verify dialog is closed
        const stillVisible = await welcomeDialog.isVisible().catch(() => false);
        if (stillVisible) {
          console.log('Dialog still visible, trying force click on any close button...');
          // Force click any button in the dialog that might close it
          const dialogButtons = page.locator('[role="dialog"] button');
          const buttonCount = await dialogButtons.count();
          for (let i = 0; i < buttonCount; i++) {
            const btn = dialogButtons.nth(i);
            const btnText = await btn.textContent().catch(() => '');
            if (btnText?.toLowerCase().includes('close') || btnText === '') {
              await btn.click({ force: true });
              await page.waitForTimeout(300);
              if (!(await welcomeDialog.isVisible().catch(() => false))) {
                console.log('Dialog dismissed by clicking button ' + i);
                break;
              }
            }
          }
        }

        console.log('Onboarding dialog dismissed');
      } else {
        console.log('No onboarding dialog detected');
      }
    };

    await dismissOnboardingDialog();
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

    // To trigger ActiveSessionContent rendering, we need to submit a spec idea
    // First, scroll to and focus the input area using "Get Started" button
    const getStartedButton = page.getByText('Get Started').first();
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    await getStartedButton.click();
    console.log('Clicked Get Started, scrolling to input...');

    // Wait for scroll animation and find the spec input textarea
    await page.waitForTimeout(1000);

    // Find and fill the spec input textarea
    const specInput = page.locator('[data-spec-input] textarea');
    await expect(specInput).toBeVisible({ timeout: 5000 });
    await specInput.fill('A simple todo app for managing daily tasks');
    console.log('Filled spec input');

    // Click the generate button to open confirmation dialog
    const generateButton = page.getByText('Generate My Specification').first();
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log('Clicked Generate button');

    // Wait for and click the confirmation dialog button
    const confirmButton = page.getByText('Confirm & Generate (FREE)');
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
    console.log('Confirmed spec generation');

    // Wait for the chat/session view to load (ActiveSessionContent)
    // The session view has a ScrollArea component with data-radix-scroll-area-viewport
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 30000 });
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

    // To trigger ActiveSessionContent rendering, we need to submit a spec idea
    // First, scroll to and focus the input area using "Get Started" button
    const getStartedButton = page.getByText('Get Started').first();
    await getStartedButton.click();

    // Wait for scroll animation
    await page.waitForTimeout(1000);

    // Find and fill the spec input textarea with a simple idea
    const specInput = page.locator('[data-spec-input] textarea');
    await expect(specInput).toBeVisible({ timeout: 5000 });
    await specInput.fill('Test task for empty tasks array handling');

    // Click the generate button to open confirmation dialog
    const generateButton = page.getByText('Generate My Specification').first();
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log('Clicked Generate button');

    // Wait for and click the confirmation dialog button
    const confirmButton = page.getByText('Confirm & Generate (FREE)');
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
    console.log('Confirmed spec generation');

    // Wait for view to load (session view with ScrollArea)
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 30000 });

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
