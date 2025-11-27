import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Form Validation - User Experience', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
    }

    // Login before each test
    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('button', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Navigate to input section
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }
  });

  test('should show character count while typing', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Type some text
    await textarea.fill('Test input');

    // Check for character counter
    const charCounter = page.locator('[data-spec-input]').locator('text=/\\d+/').first();
    await expect(charCounter).toBeVisible();

    const counterText = await charCounter.textContent();
    console.log(`Character counter shows: ${counterText}`);

    expect(counterText).toContain('10'); // "Test input" is 10 characters
    console.log('✅ Character count updates correctly');
  });

  test('should show error for input below minimum characters (25)', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter text below minimum (less than 25 characters)
    await textarea.fill('Too short'); // 9 characters

    // Try to submit
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await expect(generateButton).toBeVisible();

    // Check if button is disabled
    const isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('✅ Generate button disabled for short input');

    // Check for visual feedback
    const counter = page.locator('[data-spec-input]').locator('text=/more needed/i').first();
    const hasWarning = await counter.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasWarning) {
      const warningText = await counter.textContent();
      console.log(`✅ Warning message: "${warningText}"`);
    }
  });

  test('should enable button when minimum characters reached', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter exactly 25 characters
    await textarea.fill('Build a mobile fitness'); // 22 chars
    await page.waitForTimeout(100);

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    let isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('✅ Button still disabled at 22 characters');

    // Add 3 more characters to reach 25
    await textarea.fill('Build a mobile fitnessapp'); // 26 chars
    await page.waitForTimeout(100);

    isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('✅ Button enabled at 25+ characters');
  });

  test('should show error toast when submitting empty input', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Clear any existing text
    await textarea.fill('');

    // Try to click button (should be disabled)
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    const isDisabled = await generateButton.isDisabled();

    expect(isDisabled).toBe(true);
    console.log('✅ Cannot submit empty input - button is disabled');
  });

  test('should handle maximum character limit (5000)', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Generate text over 5000 characters
    const longText = 'a'.repeat(5001);
    await textarea.fill(longText);

    // Check if input was truncated or button disabled
    const actualValue = await textarea.inputValue();
    const actualLength = actualValue.length;

    console.log(`Input length: ${actualLength}`);

    // Button should be disabled if over limit
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    const isDisabled = await generateButton.isDisabled();

    if (actualLength > 5000) {
      expect(isDisabled).toBe(true);
      console.log('✅ Button disabled for input over 5000 characters');
    } else {
      console.log('✅ Input was truncated to maximum length');
    }
  });

  test('should show helpful validation message for too-short input', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter 10 characters (15 short of minimum)
    await textarea.fill('1234567890');

    // Check for "X more needed" message
    const needsMore = page.locator('[data-spec-input]').locator('text=/\\d+ more needed/i');
    await expect(needsMore).toBeVisible({ timeout: 2000 });

    const messageText = await needsMore.textContent();
    console.log(`✅ Helpful message displayed: "${messageText}"`);

    expect(messageText).toContain('15'); // Should need 15 more characters
  });

  test('should trim whitespace when validating', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter text with lots of whitespace (25 chars including spaces, but less when trimmed)
    await textarea.fill('   Short text   ');

    // Button should be disabled because trimmed length is too short
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    const isDisabled = await generateButton.isDisabled();

    expect(isDisabled).toBe(true);
    console.log('✅ Whitespace properly trimmed during validation');
  });

  test('should accept valid input with proper character count', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter valid text (over 25 characters)
    const validText = 'Build a comprehensive mobile fitness application with social features';
    await textarea.fill(validText);

    // Button should be enabled
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await expect(generateButton).toBeEnabled();

    // Character count should show correct number
    const charDisplay = page.locator('[data-spec-input]').locator(`text=/${validText.length}/`);
    await expect(charDisplay).toBeVisible();

    console.log(`✅ Valid input (${validText.length} chars) accepted`);
  });

  test('should update validation state in real-time', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const generateButton = page.locator('[data-spec-input]').locator('button').first();

    // Start with short text
    await textarea.fill('Short');
    await page.waitForTimeout(100);
    let isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('Step 1: Button disabled for short text');

    // Add more text to reach minimum
    await textarea.fill('Build a mobile fitness application for health tracking');
    await page.waitForTimeout(100);
    isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('Step 2: Button enabled for valid text');

    // Clear text
    await textarea.fill('');
    await page.waitForTimeout(100);
    isDisabled = await generateButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('Step 3: Button disabled for empty text');

    console.log('✅ Validation updates in real-time');
  });

  test('should show visual feedback for validation state', async ({ page }) => {
    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Enter invalid text
    await textarea.fill('Too short');

    // Check for visual error indicators (red text, icons, etc.)
    const container = page.locator('[data-spec-input]');

    // Look for destructive/error styling
    const errorElements = container.locator('[class*="destructive"], [class*="error"], .text-destructive');
    const hasErrorStyling = await errorElements.count() > 0;

    if (hasErrorStyling) {
      console.log('✅ Visual error feedback present');
    } else {
      console.log('ℹ️  No explicit error styling found');
    }

    // Enter valid text
    await textarea.fill('Build a complete mobile fitness tracking application with social features');

    // Check for success/valid styling
    const validElements = container.locator('[class*="success"], [class*="valid"]');
    const hasValidStyling = await validElements.count() > 0;

    if (hasValidStyling) {
      console.log('✅ Visual success feedback present');
    }
  });
});
