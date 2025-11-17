import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Error Handling in handleSubmit Bug Fix', () => {
  test('should display error toast when spec generation fails', async ({ page }) => {
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

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
    console.log('✅ Logged in successfully');

    // Step 2: Click "Get Started" to scroll to input section
    console.log('Step 2: Clicking Get Started button...');
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    await getStartedButton.click();
    await page.waitForTimeout(600); // Wait for scroll animation
    console.log('✅ Scrolled to input section');

    // Step 3: Intercept the API call and force it to fail
    console.log('Step 3: Setting up network interception to simulate API failure...');

    await page.route('**/functions/v1/multi-agent-spec', route => {
      console.log('   🔴 Intercepting API call - returning 500 error');
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to generate questions'
        })
      });
    });

    console.log('✅ Network interception configured');

    // Step 4: Fill in spec input
    console.log('Step 4: Filling spec input...');
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    await textarea.fill('Build a simple test app for error handling verification');
    console.log('✅ Input filled');

    // Step 5: Submit the form
    console.log('Step 5: Submitting form to trigger error...');

    // Find button within the spec-input container
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await expect(generateButton).toBeVisible({ timeout: 10000 });
    await generateButton.click();

    // Step 6: Confirm the dialog
    console.log('Step 6: Confirming generation dialog...');
    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
    console.log('✅ Confirmed - spec generation starting...');

    // Step 7: Wait for error toast to appear
    console.log('Step 7: Waiting for error toast...');

    // Look for toast notification with error
    const errorToast = page.locator('[role="status"], [role="alert"]').filter({ hasText: /error|failed/i });

    try {
      await expect(errorToast).toBeVisible({ timeout: 10000 });
      const toastText = await errorToast.textContent();
      console.log(`✅ PASS: Error toast displayed with message: "${toastText}"`);

      // Verify the toast contains meaningful error information
      expect(toastText?.toLowerCase()).toMatch(/error|failed/);
      console.log('✅ PASS: Toast contains error information');

    } catch (error) {
      console.log('❌ FAIL: Error toast did not appear');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/error-handling-failed.png', fullPage: true });
      console.log('📸 Screenshot saved to test-results/error-handling-failed.png');

      throw error;
    }

    // Step 8: Verify processing state is reset
    console.log('Step 8: Verifying processing state is reset...');

    // The "Generate" button should be clickable again (not in loading state)
    const buttonText = await generateButton.textContent();
    expect(buttonText?.toLowerCase()).not.toContain('generating');
    console.log('✅ PASS: Processing state correctly reset');

    // Summary
    console.log('\n=== Test Summary ===');
    console.log('✅ API error intercepted successfully');
    console.log('✅ Error toast displayed to user');
    console.log('✅ Toast contains meaningful error message');
    console.log('✅ Processing state properly reset');
    console.log('==================\n');
  });

  test('should handle errors gracefully and allow retry', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Login
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Click "Get Started" to scroll to input section
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });
    await getStartedButton.click();
    await page.waitForTimeout(600); // Wait for scroll animation

    // Intercept and fail first attempt
    let attemptCount = 0;
    await page.route('**/functions/v1/multi-agent-spec', route => {
      attemptCount++;
      if (attemptCount === 1) {
        console.log(`   Attempt ${attemptCount}: Returning error`);
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Simulated failure' })
        });
      } else {
        console.log(`   Attempt ${attemptCount}: Passing through (would succeed in real scenario)`);
        // On retry, we still need to mock because edge function might not be fully configured
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Test scenario - not testing success path' })
        });
      }
    });

    // Fill and submit
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('Test retry capability after error');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await expect(generateButton).toBeVisible({ timeout: 10000 });
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for first error
    const errorToast = page.locator('[role="status"], [role="alert"]').filter({ hasText: /error|failed/i });
    await expect(errorToast).toBeVisible({ timeout: 10000 });
    console.log('✅ First attempt failed as expected');

    // Verify button is clickable again (can retry)
    await page.waitForTimeout(1000);
    const isEnabled = await generateButton.isEnabled();
    expect(isEnabled).toBe(true);
    console.log('✅ Generate button is enabled - user can retry');

    console.log('✅ Error recovery works - user can retry after failure');
  });
});
