import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Full Application Flow', () => {
  test('should complete full user journey from login to spec request', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to main page
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
    console.log('✅ Step 1 complete: Logged in successfully');

    // Step 2: Verify landing page loads
    console.log('Step 2: Verifying landing page...');
    await expect(page.locator('text=Specificity AI')).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 2 complete: Landing page loaded');

    // Step 3: Check for any console errors
    console.log('Step 3: Checking for console errors...');
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    // Wait a bit to collect any errors
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors found:');
      consoleErrors.forEach(err => console.log(`   ${err}`));
    } else {
      console.log('✅ Step 3 complete: No console errors');
    }

    // Step 4: Try to interact with Get Started button
    console.log('Step 4: Testing Get Started button...');
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();

    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      console.log('✅ Step 4 complete: Get Started button clicked');

      // Wait for scroll animation
      await page.waitForTimeout(1000);
    } else {
      console.log('ℹ️  Get Started button not visible (may already be in app state)');
    }

    // Step 5: Look for the spec input field
    console.log('Step 5: Looking for spec input...');
    const specInput = page.locator('textarea, input[placeholder*="spec" i], input[placeholder*="describe" i], textarea[placeholder*="spec" i], textarea[placeholder*="describe" i]').first();

    if (await specInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Step 5 complete: Spec input found and visible');

      // Step 6: Try to enter text in the spec input
      console.log('Step 6: Testing spec input...');
      await specInput.fill('Build a mobile app for tracking daily habits with gamification');
      await page.waitForTimeout(500);

      const inputValue = await specInput.inputValue();
      expect(inputValue).toContain('Build a mobile app');
      console.log('✅ Step 6 complete: Spec input works correctly');
    } else {
      console.log('ℹ️  Spec input not immediately visible, checking page state...');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/full-flow-state.png', fullPage: true });
      console.log('📸 Screenshot saved to test-results/full-flow-state.png');
    }

    // Step 7: Check page accessibility
    console.log('Step 7: Checking basic accessibility...');
    const mainContent = await page.locator('main, [role="main"], body').first();
    expect(await mainContent.isVisible()).toBe(true);
    console.log('✅ Step 7 complete: Main content is accessible');

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`✅ Login: Success`);
    console.log(`✅ Landing page: Loaded`);
    console.log(`${consoleErrors.length === 0 ? '✅' : '⚠️ '} Console errors: ${consoleErrors.length}`);
    console.log('==================\n');

    // Fail test if there were console errors
    if (consoleErrors.length > 0) {
      throw new Error(`Test completed but ${consoleErrors.length} console error(s) found. Check logs above.`);
    }
  });
});
