import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Login Flow Test', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Navigate to the app
    await page.goto('http://localhost:8082/auth');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on Sign In tab (in case we're on Sign Up)
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    // Fill in email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);

    // Fill in password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(password);

    // Click Sign In button - use form submission button locator
    const signInButton = page.locator('button[type="submit"]').first();
    await signInButton.click();

    // Wait for navigation after login
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Verify we're on the main page (not auth page)
    expect(page.url()).toBe('http://localhost:8082/');

    // Check for landing hero or main content
    await expect(page.locator('text=Specificity AI')).toBeVisible({ timeout: 5000 });

    console.log('✅ Login successful!');
  });
});
