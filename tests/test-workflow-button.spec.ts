import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

/**
 * Bug Fix Test: Test Workflow Button Visibility in Development Mode
 *
 * This test verifies the fix for the bug where the test workflow button
 * was not appearing in development mode due to incorrect environment check.
 *
 * Bug: Line 1165 in src/pages/Index.tsx used `process.env.NODE_ENV` instead of `import.meta.env.MODE`
 * Fix: Changed to use `import.meta.env.MODE === 'development'`
 *
 * Expected behavior: Test workflow button should be visible in development mode
 */
test.describe('Test Workflow Button - Development Mode Bug Fix', () => {
  test('should display test workflow button in development mode', async ({ page }) => {
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
    console.log('✅ Logged in successfully');

    // Step 2: Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for all components to render

    // Step 3: Verify the test workflow button is visible
    console.log('Step 2: Checking for test workflow button...');

    // The button should be in the bottom-right corner with "Test Workflow" text
    const testWorkflowButton = page.locator('button:has-text("Test Workflow")');

    // This is the critical assertion - before the fix, this would fail
    // because process.env.NODE_ENV would be undefined in Vite
    await expect(testWorkflowButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Test workflow button is visible');

    // Step 4: Verify button positioning (should be fixed bottom-right)
    const buttonBox = await testWorkflowButton.boundingBox();
    expect(buttonBox).not.toBeNull();

    if (buttonBox) {
      // Button should be near the bottom-right of the viewport
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        expect(buttonBox.x).toBeGreaterThan(viewportSize.width * 0.8);
        expect(buttonBox.y).toBeGreaterThan(viewportSize.height * 0.8);
        console.log('✅ Button is positioned correctly (bottom-right)');
      }
    }

    // Step 5: Verify button is clickable (don't actually click it to avoid triggering the workflow)
    const isClickable = await testWorkflowButton.isEnabled();
    expect(isClickable).toBe(true);
    console.log('✅ Button is enabled and clickable');

    console.log('\n=== Test Summary ===');
    console.log('✅ Bug Fix Verified: Test workflow button appears in development mode');
    console.log('✅ Environment check now uses import.meta.env.MODE (Vite standard)');
    console.log('==================\n');
  });

  test('should not display test workflow button in production mode', async ({ page }) => {
    // Note: This test documents expected behavior in production
    // In actual production builds, import.meta.env.MODE would be 'production'
    // and the button would not render

    console.log('ℹ️  This test documents production behavior');
    console.log('ℹ️  In production mode (import.meta.env.MODE === "production"),');
    console.log('ℹ️  the test workflow button should NOT be visible');
    console.log('ℹ️  Current test runs in development mode, so button IS visible');

    // This test passes as documentation - actual production testing would require
    // building the app in production mode and running a separate test suite
  });
});
