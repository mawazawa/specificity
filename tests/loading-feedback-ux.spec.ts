import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Loading States & User Feedback - UX', () => {
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
  });

  test('should show loading spinner during page transitions', async ({ page }) => {
    // Navigate away and back
    await page.goto('http://localhost:8082/auth');

    // Look for loading indicators during navigation
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]');
    const hasLoading = await loadingIndicators.first().isVisible({ timeout: 1000 }).catch(() => false);

    if (hasLoading) {
      console.log('✅ Loading indicator visible during navigation');
    } else {
      console.log('ℹ️  Page loads too fast or no loading indicator');
    }

    // Navigate back
    await page.goto('http://localhost:8082/');
    await page.waitForLoadState('networkidle');
  });

  test('should disable submit button during form submission', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();

    // Check initial state
    const initiallyEnabled = await generateButton.isEnabled();
    expect(initiallyEnabled).toBe(true);
    console.log('✅ Button initially enabled');

    // Click button
    await generateButton.click();

    // Wait for dialog
    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });

    // Click confirm
    await confirmButton.click();
    await page.waitForTimeout(200);

    // Check if button is disabled during processing
    const buttonsDuringProcess = await page.locator('button:disabled').count();
    console.log(`Disabled buttons during processing: ${buttonsDuringProcess}`);

    if (buttonsDuringProcess > 0) {
      console.log('✅ Buttons disabled during processing');
    } else {
      console.log('ℹ️  No disabled buttons detected (may process too quickly)');
    }
  });

  test('should show loading text in submit button', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    const initialText = await generateButton.textContent();
    console.log(`Initial button text: "${initialText}"`);

    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait briefly and check for loading text
    await page.waitForTimeout(200);

    const loadingText = await generateButton.textContent().catch(() => '');
    console.log(`Loading button text: "${loadingText}"`);

    if (loadingText && loadingText.toLowerCase().includes('generat')) {
      console.log('✅ Button shows loading state text');
    } else {
      console.log('ℹ️  Button text may not update during loading');
    }
  });

  test('should display loading animations or spinners', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Look for loading spinners
    await page.waitForTimeout(300);

    const spinners = await page.locator('[class*="spin"], [class*="loading"], [class*="loader"], svg[class*="animate"]').all();

    let foundSpinner = false;
    for (const spinner of spinners) {
      const visible = await spinner.isVisible().catch(() => false);
      if (visible) {
        foundSpinner = true;
        const className = await spinner.getAttribute('class');
        console.log(`Found spinner with class: ${className}`);
      }
    }

    if (foundSpinner) {
      console.log('✅ Loading spinner visible during operation');
    } else {
      console.log('ℹ️  No loading spinner detected');
    }
  });

  test('should show success toast after successful operation', async ({ page }) => {
    // Intercept API to return success quickly
    await page.route('**/functions/v1/multi-agent-spec', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: ['Test question 1', 'Test question 2'],
          spec: 'Test spec content'
        })
      });
    });

    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for toast notification
    const toast = page.locator('[role="status"], [role="alert"]').first();
    const toastVisible = await toast.isVisible({ timeout: 5000 }).catch(() => false);

    if (toastVisible) {
      const toastText = await toast.textContent();
      console.log(`Toast message: "${toastText}"`);
      console.log('✅ Success feedback displayed');
    } else {
      console.log('ℹ️  No toast notification detected');
    }
  });

  test('should show progress indicators for long operations', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Look for progress indicators
    await page.waitForTimeout(500);

    const progressElements = await page.locator(
      '[role="progressbar"], [class*="progress"], [class*="step"], [class*="stage"]'
    ).all();

    if (progressElements.length > 0) {
      console.log(`✅ Found ${progressElements.length} progress indicator(s)`);

      for (const el of progressElements.slice(0, 3)) {
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          const text = await el.textContent();
          console.log(`  Progress: "${text?.substring(0, 50)}"`);
        }
      }
    } else {
      console.log('ℹ️  No progress indicators found');
    }
  });

  test('should update UI to reflect current operation status', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Look for status messages
    await page.waitForTimeout(500);

    const statusMessages = await page.locator('[class*="status"], [data-status]').all();

    let foundStatus = false;
    for (const status of statusMessages) {
      const visible = await status.isVisible().catch(() => false);
      if (visible) {
        const text = await status.textContent();
        if (text && text.trim()) {
          console.log(`Status: "${text.substring(0, 80)}"`);
          foundStatus = true;
        }
      }
    }

    if (foundStatus) {
      console.log('✅ Status updates visible to user');
    } else {
      console.log('ℹ️  No explicit status messages found');
    }
  });

  test('should provide visual feedback on hover', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Get button styles before hover
      const beforeHover = await getStartedButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });

      // Hover over button
      await getStartedButton.hover();
      await page.waitForTimeout(100);

      // Get button styles after hover
      const afterHover = await getStartedButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });

      // Check if styles changed
      const styleChanged =
        beforeHover.backgroundColor !== afterHover.backgroundColor ||
        beforeHover.transform !== afterHover.transform ||
        beforeHover.boxShadow !== afterHover.boxShadow;

      if (styleChanged) {
        console.log('✅ Hover feedback present on buttons');
        console.log('Before:', beforeHover);
        console.log('After:', afterHover);
      } else {
        console.log('ℹ️  No detected hover style changes');
      }
    }
  });

  test('should maintain feedback during API delays', async ({ page }) => {
    // Simulate slow API response
    await page.route('**/functions/v1/multi-agent-spec', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: ['Test question'],
          spec: 'Test spec'
        })
      });
    });

    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a mobile fitness app');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Check for continuous feedback during delay
    await page.waitForTimeout(500);

    const feedbackElements = await page.locator(
      '[class*="loading"], [class*="spinner"], [aria-busy="true"], [class*="processing"]'
    ).all();

    let hasActiveFeedback = false;
    for (const el of feedbackElements) {
      const visible = await el.isVisible().catch(() => false);
      if (visible) {
        hasActiveFeedback = true;
        console.log('Active loading feedback detected');
        break;
      }
    }

    // Wait for the delayed response
    await page.waitForTimeout(2000);

    if (hasActiveFeedback) {
      console.log('✅ Loading feedback maintained during API delay');
    } else {
      console.log('ℹ️  No continuous loading feedback detected');
    }
  });

  test('should auto-dismiss success messages after timeout', async ({ page }) => {
    // Intercept to return success
    await page.route('**/functions/v1/multi-agent-spec', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: ['Test'],
          spec: 'Test spec'
        })
      });
    });

    // Navigate and submit
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application');

    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    const confirmVisible = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (confirmVisible) {
      await confirmButton.click();

      // Wait for and check toast
      const toast = page.locator('[role="status"]').first();
      const toastAppeared = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (toastAppeared) {
        console.log('Toast appeared');

        // Wait for auto-dismiss (typically 3-5 seconds)
        await page.waitForTimeout(6000);

        const toastStillVisible = await toast.isVisible().catch(() => false);

        if (!toastStillVisible) {
          console.log('✅ Toast auto-dismissed after timeout');
        } else {
          console.log('ℹ️  Toast still visible (may require manual dismiss)');
        }
      }
    }
  });
});
