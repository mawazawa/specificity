import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Get Started Button Focus Bug Fix', () => {
  test('should focus the textarea when Get Started button is clicked', async ({ page }) => {
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

    // Step 2: Verify landing page is visible
    await expect(page.locator('text=Specificity AI')).toBeVisible({ timeout: 5000 });
    console.log('✅ Landing page loaded');

    // Step 3: Find and click the "Get Started" button
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    await expect(getStartedButton).toBeVisible({ timeout: 5000 });

    console.log('Step 3: Clicking Get Started button...');
    await getStartedButton.click();

    // Step 4: Wait for scroll animation to complete
    await page.waitForTimeout(600); // Slightly longer than the 500ms timeout in the code

    // Step 5: Verify the textarea element received focus
    console.log('Step 5: Verifying textarea has focus...');
    const textarea = page.locator('[data-spec-input] textarea').first();

    // Check if the textarea is focused using evaluate
    const isFocused = await textarea.evaluate(el => document.activeElement === el);

    if (isFocused) {
      console.log('✅ PASS: Textarea is focused after clicking Get Started');
    } else {
      const activeElementTag = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`❌ FAIL: Textarea is NOT focused. Active element is: ${activeElementTag}`);
    }

    expect(isFocused).toBe(true);

    // Step 6: Verify user can immediately start typing
    console.log('Step 6: Testing immediate typing capability...');
    await page.keyboard.type('Testing focus');

    const value = await textarea.inputValue();
    expect(value).toBe('Testing focus');
    console.log('✅ User can immediately type after clicking Get Started');

    // Summary
    console.log('\n=== Test Summary ===');
    console.log('✅ Get Started button scrolls to input');
    console.log('✅ Textarea receives focus automatically');
    console.log('✅ User can type immediately without manual click');
    console.log('==================\n');
  });

  test('should maintain focus even after multiple Get Started clicks', async ({ page }) => {
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

    // Click Get Started multiple times
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const textarea = page.locator('[data-spec-input] textarea').first();

    for (let i = 0; i < 3; i++) {
      console.log(`Iteration ${i + 1}: Clicking Get Started...`);
      await getStartedButton.click();
      await page.waitForTimeout(600);

      const isFocused = await textarea.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
      console.log(`✅ Iteration ${i + 1}: Textarea focused correctly`);
    }

    console.log('✅ All iterations passed - focus works consistently');
  });
});
