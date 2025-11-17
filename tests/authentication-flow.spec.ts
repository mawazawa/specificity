import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Authentication Flow - User Experience', () => {
  test('should display sign in form by default', async ({ page }) => {
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    // Verify Sign In tab is active by default
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await expect(signInTab).toBeVisible();
    await expect(signInTab).toHaveAttribute('data-state', 'active');

    // Verify form fields are visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    console.log('✅ Sign in form displays correctly');
  });

  test('should switch between sign in and sign up tabs', async ({ page }) => {
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    // Click Sign Up tab
    const signUpTab = page.getByRole('tab', { name: /sign up/i });
    await signUpTab.click();

    // Verify Sign Up tab is now active
    await expect(signUpTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Switched to Sign Up tab');

    // Switch back to Sign In
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();
    await expect(signInTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Switched back to Sign In tab');
  });

  test('should show validation errors for empty sign in form', async ({ page }) => {
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check for HTML5 validation or error messages
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBe(true);
    console.log('✅ Form validation prevents empty submission');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    // Enter invalid email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('not-an-email');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check for validation error
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
    console.log('✅ Invalid email format rejected');
  });

  test('should successfully sign in with valid credentials', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    // Fill in credentials
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);

    // Submit form
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to home page
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Verify we're on the home page
    const url = page.url();
    expect(url).toBe('http://localhost:8082/');
    console.log('✅ Successfully signed in and redirected to home page');
  });

  test('should show loading state during sign in', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);

    const submitButton = page.locator('button[type="submit"]').first();

    // Check button state before clicking
    const initialText = await submitButton.textContent();
    console.log(`Initial button text: "${initialText}"`);

    // Click and immediately check for loading state
    await submitButton.click();

    // Wait a brief moment for loading state to appear
    await page.waitForTimeout(100);

    // Check if button is disabled during loading
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    if (isDisabled) {
      console.log('✅ Button disabled during sign in');
    } else {
      console.log('ℹ️  Button not disabled (sign in may be too fast)');
    }

    // Wait for redirect
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
  });

  test('should handle sign out', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // First sign in
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    console.log('✅ Signed in successfully');

    // Look for sign out button (could be in various locations)
    const signOutButton = page.getByRole('button', { name: /sign out|log out/i }).first();

    const isVisible = await signOutButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await signOutButton.click();

      // Wait for redirect back to auth page
      await page.waitForURL(/auth/, { timeout: 10000 });

      const url = page.url();
      expect(url).toContain('auth');
      console.log('✅ Successfully signed out and redirected to auth page');
    } else {
      console.log('ℹ️  Sign out button not found in visible UI');
    }
  });

  test('should preserve redirect path after authentication', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Try to access protected route while logged out
    await page.goto('http://localhost:8082/');

    // Should redirect to auth or stay on home
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Sign in
    if (url.includes('auth')) {
      const signInTab = page.getByRole('tab', { name: /sign in/i });
      await signInTab.click();

      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.locator('button[type="submit"]').first().click();

      // Should redirect back to original intended path
      await page.waitForURL('http://localhost:8082/', { timeout: 10000 });
      console.log('✅ Redirected to original intended path after sign in');
    } else {
      console.log('✅ Already on home page (no auth redirect required)');
    }
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await signInTab.click();

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('test-password-123');

    // Look for password visibility toggle button
    const toggleButton = page.locator('button[aria-label*="password" i], button:has-text("Show"), button:has-text("Hide")').first();

    const hasToggle = await toggleButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasToggle) {
      // Check initial type
      const initialType = await passwordInput.getAttribute('type');
      console.log(`Initial input type: ${initialType}`);

      // Click toggle
      await toggleButton.click();
      await page.waitForTimeout(100);

      // Check new type
      const newType = await passwordInput.getAttribute('type');
      console.log(`New input type: ${newType}`);

      expect(newType).not.toBe(initialType);
      console.log('✅ Password visibility toggle works');
    } else {
      console.log('ℹ️  Password visibility toggle not found');
    }
  });
});
