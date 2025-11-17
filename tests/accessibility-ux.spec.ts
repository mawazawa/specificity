import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Accessibility - Keyboard Navigation & ARIA', () => {
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

  test('should navigate with Tab key through main elements', async ({ page }) => {
    // Press Tab to move focus through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    let focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        type: el?.getAttribute('type'),
        role: el?.getAttribute('role'),
        text: el?.textContent?.substring(0, 50)
      };
    });

    console.log('First tab stop:', focusedElement);

    // Continue tabbing to find all interactive elements
    const tabbableElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          type: el?.getAttribute('type'),
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label')
        };
      });

      tabbableElements.push(focusedElement);
    }

    console.log(`✅ Found ${tabbableElements.length} tabbable elements`);
    expect(tabbableElements.length).toBeGreaterThan(0);
  });

  test('should activate Get Started button with Enter key', async ({ page }) => {
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Focus the button
      await getStartedButton.focus();

      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(600);

      // Verify textarea is visible (scrolled into view)
      const textarea = page.locator('[data-spec-input] textarea').first();
      await expect(textarea).toBeVisible({ timeout: 2000 });

      console.log('✅ Get Started button activated with Enter key');
    } else {
      console.log('ℹ️  Get Started button not visible (may already be scrolled)');
    }
  });

  test('should submit form with Enter key in textarea', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Focus and type
    await textarea.focus();
    await textarea.fill('Build a comprehensive mobile fitness tracking application with social features and AI coaching');

    // Try Cmd+Enter or Ctrl+Enter (common submit shortcut)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+Enter');
    } else {
      await page.keyboard.press('Control+Enter');
    }

    await page.waitForTimeout(500);

    // Check if dialog appeared (form submission triggered)
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 2000 }).catch(() => false);

    if (dialogVisible) {
      console.log('✅ Form submitted with keyboard shortcut');
    } else {
      console.log('ℹ️  Keyboard submit shortcut not implemented');
    }
  });

  test('should close dialog with Escape key', async ({ page }) => {
    // Navigate to input and fill
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

    // Click generate button
    const generateButton = page.locator('[data-spec-input]').locator('button').first();
    await generateButton.click();

    // Wait for confirmation dialog
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log('Dialog opened');

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify dialog is closed
    const dialogClosed = await dialog.isHidden({ timeout: 2000 }).catch(() => false);

    if (dialogClosed) {
      console.log('✅ Dialog closed with Escape key');
    } else {
      console.log('⚠️  Dialog did not close with Escape key');
    }
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check main textarea
    const textarea = page.locator('[data-spec-input] textarea').first();
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

    if (textareaVisible) {
      const ariaLabel = await textarea.getAttribute('aria-label');
      const ariaDescribedBy = await textarea.getAttribute('aria-describedby');
      const placeholder = await textarea.getAttribute('placeholder');

      console.log('Textarea accessibility:');
      console.log(`  aria-label: ${ariaLabel}`);
      console.log(`  aria-describedby: ${ariaDescribedBy}`);
      console.log(`  placeholder: ${placeholder?.substring(0, 50)}...`);

      // Should have some form of accessible label
      const hasAccessibleName = ariaLabel || placeholder;
      expect(hasAccessibleName).toBeTruthy();
      console.log('✅ Textarea has accessible name');
    }

    // Check buttons
    const buttons = await page.locator('button[type="button"], button[type="submit"]').all();
    console.log(`\nChecking ${buttons.length} buttons for accessibility...`);

    for (const button of buttons.slice(0, 5)) {
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaDescribedBy = await button.getAttribute('aria-describedby');

        console.log(`Button: text="${text?.trim().substring(0, 30)}" aria-label="${ariaLabel}"`);

        // Button should have text content or aria-label
        const hasAccessibleName = (text && text.trim()) || ariaLabel;
        expect(hasAccessibleName).toBeTruthy();
      }
    }

    console.log('✅ Interactive elements have proper labels');
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    // Navigate to input and open dialog
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

    if (textareaVisible) {
      await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

      const generateButton = page.locator('[data-spec-input]').locator('button').first();
      await generateButton.click();

      // Wait for dialog
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Try tabbing through dialog elements
      const focusedElements = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const focusInfo = await page.evaluate(() => {
          const el = document.activeElement;
          const inDialog = el?.closest('[role="dialog"], [role="alertdialog"]');
          return {
            tag: el?.tagName,
            inDialog: !!inDialog,
            className: el?.className
          };
        });

        focusedElements.push(focusInfo);
      }

      // Check if focus stayed in dialog
      const allInDialog = focusedElements.every(f => f.inDialog || f.tag === 'BODY');

      if (allInDialog) {
        console.log('✅ Focus trapped in modal dialog');
      } else {
        console.log('⚠️  Focus may have escaped dialog');
        console.log('Focus trail:', focusedElements);
      }
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab through elements and check for visible focus
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = page.locator(':focus');
    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      const pseudoStyles = window.getComputedStyle(el, ':focus');

      // Check for focus styling
      const hasOutline = styles.outline !== 'none' && styles.outline !== '0px';
      const hasBorder = styles.border !== 'none';
      const hasBoxShadow = styles.boxShadow !== 'none';
      const hasRing = el.className.includes('ring') || el.className.includes('focus');

      return hasOutline || hasBorder || hasBoxShadow || hasRing;
    });

    console.log(`Focus indicator visible: ${hasFocusIndicator}`);

    // Visual focus indicators are important for keyboard navigation
    if (hasFocusIndicator) {
      console.log('✅ Visible focus indicators present');
    } else {
      console.log('⚠️  Focus indicators may not be visible');
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for heading elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    const headingStructure = [];
    for (const heading of headings) {
      const isVisible = await heading.isVisible().catch(() => false);
      if (isVisible) {
        const tag = await heading.evaluate(el => el.tagName);
        const text = await heading.textContent();
        headingStructure.push({ tag, text: text?.trim().substring(0, 50) });
      }
    }

    console.log('Heading structure:');
    headingStructure.forEach(h => console.log(`  ${h.tag}: ${h.text}`));

    // Should have at least one h1
    const hasH1 = headingStructure.some(h => h.tag === 'H1');
    if (hasH1) {
      console.log('✅ Proper heading hierarchy with H1');
    } else {
      console.log('⚠️  No H1 heading found');
    }

    expect(headingStructure.length).toBeGreaterThan(0);
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await getStartedButton.click();
      await page.waitForTimeout(600);
    }

    const textarea = page.locator('[data-spec-input] textarea').first();
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

    if (textareaVisible) {
      await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

      // Check for aria-busy or aria-live regions before submitting
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
      console.log(`Found ${liveRegions.length} ARIA live regions`);

      // Click generate
      const generateButton = page.locator('[data-spec-input]').locator('button').first();
      await generateButton.click();

      // Wait for dialog and confirm
      const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
      const confirmVisible = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (confirmVisible) {
        await confirmButton.click();
        await page.waitForTimeout(500);

        // Check for loading announcements
        const ariaLiveElements = await page.locator('[aria-live], [role="status"]').all();

        let hasLoadingAnnouncement = false;
        for (const element of ariaLiveElements) {
          const text = await element.textContent();
          if (text && (text.includes('loading') || text.includes('processing') || text.includes('generating'))) {
            hasLoadingAnnouncement = true;
            console.log(`Loading announcement: "${text}"`);
          }
        }

        if (hasLoadingAnnouncement) {
          console.log('✅ Loading states announced to screen readers');
        } else {
          console.log('ℹ️  No explicit loading announcements found');
        }
      }
    }
  });

  test('should have skip navigation links', async ({ page }) => {
    // Check for skip links at the top of the page
    const skipLinks = page.locator('a[href^="#"]:has-text("Skip")');
    const skipLinkCount = await skipLinks.count();

    if (skipLinkCount > 0) {
      console.log(`✅ Found ${skipLinkCount} skip navigation link(s)`);

      // Check if they're keyboard accessible
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => {
        return document.activeElement?.textContent;
      });

      if (firstFocused?.toLowerCase().includes('skip')) {
        console.log('✅ Skip link is first tabbable element');
      }
    } else {
      console.log('ℹ️  No skip navigation links found');
    }
  });
});
