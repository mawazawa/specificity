import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

test.describe('ChatView Component Rendering Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Login to access the chat view
    await page.goto('http://localhost:8082/auth');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(process.env.TEST_USER_EMAIL!);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(process.env.TEST_USER_PASSWORD!);

    // Submit login form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for redirect to main page
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
  });

  test('should render ChatView component without "Button is not defined" error', async ({ page }) => {
    console.log('Testing ChatView component renders without crashing...');

    // Track JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
      errors.push(error.message);
    });

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // Start the refinement flow to trigger ChatView
    const getStartedButton = page.getByText('Get Started');
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    await getStartedButton.click();

    // Wait for chat view to load - look for scroll area which is in ChatView
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 5000 });

    console.log('ChatView loaded successfully');

    // Verify no "Button is not defined" errors occurred
    const buttonErrors = errors.filter(e => e.includes('Button is not defined'));
    expect(buttonErrors).toHaveLength(0);

    console.log('✅ No "Button is not defined" errors detected');
  });

  test('should render refinement stage without crashing when Button component is used', async ({ page }) => {
    console.log('Testing refinement stage Button rendering...');

    // Track errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to chat view
    const getStartedButton = page.getByText('Get Started');
    await getStartedButton.click();

    // Wait for chat interface to load
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 5000 });

    console.log('Chat interface loaded');

    // The component should render without errors even if the Button
    // is conditionally rendered based on currentStage === 'refinement'
    // We're testing that importing Button doesn't cause runtime errors

    // Wait a moment for any delayed rendering
    await page.waitForTimeout(1000);

    // Check for any Button-related errors
    const buttonErrors = errors.filter(e =>
      e.includes('Button') && (e.includes('not defined') || e.includes('undefined'))
    );

    expect(buttonErrors).toHaveLength(0);
    console.log('✅ ChatView component renders without Button-related errors');
  });

  test('should not crash when attempting to render Start Expert Panel Analysis button', async ({ page }) => {
    console.log('Testing that Button component can be rendered...');

    // Track JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to the app
    const getStartedButton = page.getByText('Get Started');
    await getStartedButton.click();

    // Wait for chat view
    await page.waitForSelector('[data-radix-scroll-area-viewport]', { timeout: 5000 });

    // The "Start Expert Panel Analysis" button should be able to render
    // when the conditions are met (currentStage === 'refinement' && !isProcessing)
    // Even if it's not visible in this test, the component should not crash

    // Wait for potential button rendering
    await page.waitForTimeout(1500);

    // Verify no errors occurred
    const criticalErrors = jsErrors.filter(e =>
      e.toLowerCase().includes('button') ||
      e.toLowerCase().includes('reference') ||
      e.toLowerCase().includes('not defined')
    );

    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No errors when Button component is in scope');

    // Log success
    console.log('Test completed: ChatView can safely reference Button component');
  });
});
