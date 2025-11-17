import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Spec Generation Test', () => {
  test('should attempt spec generation and capture actual error', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Capture all console messages and errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      networkErrors.push(`Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Login
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
    console.log('✅ Logged in successfully');

    // Find the spec input - try multiple selectors
    await page.waitForTimeout(2000);

    const specInput = page.locator('textarea[placeholder*="describe" i], textarea[data-spec-input], textarea').first();

    // Wait for it to be visible
    await specInput.waitFor({ state: 'visible', timeout: 5000 });

    console.log('✅ Found spec input');

    // Fill in a test spec
    await specInput.fill('Build a simple todo app with React');
    await page.waitForTimeout(500);

    console.log('✅ Filled spec input');

    // Find and click submit button
    const submitButton = page.locator('button:has-text("Generate"), button[type="submit"]:has-text("Start"), button:has-text("Begin")').first();

    if (await submitButton.isVisible({ timeout: 2000 })) {
      console.log('✅ Found submit button');
      await submitButton.click();
      console.log('✅ Clicked submit button');
    } else {
      // Try pressing Enter
      console.log('ℹ️  No submit button found, trying Enter key');
      await specInput.press('Enter');
    }

    // Wait for processing to start
    await page.waitForTimeout(3000);

    // Check for toast notifications
    const toastElements = page.locator('[role="status"], [role="alert"], .sonner-toast, .toast');
    const toastCount = await toastElements.count();

    if (toastCount > 0) {
      for (let i = 0; i < toastCount; i++) {
        const toastText = await toastElements.nth(i).textContent();
        console.log(`📢 Toast ${i + 1}: ${toastText}`);
      }
    }

    // Wait a bit more to capture any delayed errors
    await page.waitForTimeout(2000);

    // Output all captured information
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`❌ ${err}`));
    } else {
      console.log('✅ No console errors');
    }

    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(`❌ ${err}`));
    } else {
      console.log('✅ No network errors');
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/spec-generation-attempt.png', fullPage: true });
    console.log('\n📸 Screenshot saved to test-results/spec-generation-attempt.png');

    // The test passes even if generation fails - we just want to see the error
    console.log('\n✅ Test complete - check logs above for actual error details');
  });
});
