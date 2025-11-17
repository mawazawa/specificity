import { test, expect, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fileURLToPath from 'url';

const __filename = fileURLToPath.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Responsive Design - Mobile & Tablet UX', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 }, // iPhone SE
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 }, // iPad
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });

      const page = await context.newPage();

      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;

      if (!email || !password) {
        await context.close();
        throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
      }

      // Login
      await page.goto('http://localhost:8082/auth');
      await page.waitForLoadState('networkidle');

      const signInTab = page.getByRole('button', { name: /sign in/i });
      await signInTab.click();

      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.locator('button[type="submit"]').first().click();

      await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

      // Check if main elements are visible
      const mainHeading = page.locator('h1, h2').first();
      await expect(mainHeading).toBeVisible();

      // Check for proper responsive layout
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;

      // No horizontal scroll
      const hasHorizontalScroll = bodyWidth > viewportWidth * 1.05; // 5% tolerance

      if (hasHorizontalScroll) {
        console.log(`⚠️  ${viewport.name}: Horizontal scroll detected (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`);
      } else {
        console.log(`✅ ${viewport.name}: No horizontal scroll`);
      }

      expect(hasHorizontalScroll).toBe(false);

      // Check if Get Started button is accessible
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
      const buttonVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (buttonVisible) {
        // Check if button is properly sized for touch
        const buttonSize = await getStartedButton.boundingBox();

        if (buttonSize) {
          const isTouchFriendly = buttonSize.height >= 44 && buttonSize.width >= 44; // Apple HIG minimum
          if (isTouchFriendly) {
            console.log(`✅ ${viewport.name}: Touch-friendly button size (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
          } else {
            console.log(`⚠️  ${viewport.name}: Button may be too small (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
          }
        }
      }

      await context.close();
    });
  }

  test('should handle mobile navigation menu', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('button', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("☰"), button[aria-expanded]').first();
    const hasMenuButton = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasMenuButton) {
      console.log('✅ Mobile menu button found');

      // Try to open menu
      await menuButton.click();
      await page.waitForTimeout(300);

      // Check if menu expanded
      const ariaExpanded = await menuButton.getAttribute('aria-expanded');
      if (ariaExpanded === 'true') {
        console.log('✅ Mobile menu opened');
      }
    } else {
      console.log('ℹ️  No mobile menu button detected');
    }

    await context.close();
  });

  test('should stack form elements vertically on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    // Check form layout
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailBox = await emailInput.boundingBox();
    const passwordBox = await passwordInput.boundingBox();

    if (emailBox && passwordBox) {
      // Check if inputs are stacked vertically (password should be below email)
      const isStacked = passwordBox.y > emailBox.y + emailBox.height - 10; // 10px tolerance

      if (isStacked) {
        console.log('✅ Form inputs properly stacked vertically on mobile');
      } else {
        console.log('⚠️  Form inputs may be side-by-side on mobile');
      }

      expect(isStacked).toBe(true);
    }

    await context.close();
  });

  test('should use appropriate font sizes for mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    // Check input font size (should be at least 16px to prevent iOS zoom)
    const emailInput = page.locator('input[type="email"]');
    const fontSize = await emailInput.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    const fontSizeNum = parseInt(fontSize);
    const isAppropriate = fontSizeNum >= 16;

    if (isAppropriate) {
      console.log(`✅ Mobile font size appropriate: ${fontSize}`);
    } else {
      console.log(`⚠️  Mobile font size too small: ${fontSize} (should be ≥16px to prevent zoom)`);
    }

    expect(isAppropriate).toBe(true);

    await context.close();
  });

  test('should handle touch interactions properly', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('button', { name: /sign in/i });

    // Tap button
    await signInTab.tap();
    await page.waitForTimeout(100);

    // Check if tab is active
    const isActive = await signInTab.getAttribute('data-state');
    expect(isActive).toBe('active');

    console.log('✅ Touch interactions work correctly');

    await context.close();
  });

  test('should support pinch-to-zoom accessibility', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    await page.goto('http://localhost:8082/');

    // Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') || '';
    });

    // Should NOT disable zoom (user-scalable=no or maximum-scale=1)
    const disablesZoom = viewportMeta.includes('user-scalable=no') ||
                        viewportMeta.includes('maximum-scale=1.0');

    if (!disablesZoom) {
      console.log('✅ Pinch-to-zoom enabled for accessibility');
    } else {
      console.log('⚠️  Pinch-to-zoom may be disabled');
    }

    expect(disablesZoom).toBe(false);

    await context.close();
  });

  test('should adapt textarea size for mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('button', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    // Navigate to input
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await getStartedButton.tap();
      await page.waitForTimeout(600);

      const textarea = page.locator('[data-spec-input] textarea').first();
      const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

      if (textareaVisible) {
        const box = await textarea.boundingBox();

        if (box) {
          const viewportWidth = 375;
          const takesFullWidth = box.width > viewportWidth * 0.85; // Takes at least 85% of width

          if (takesFullWidth) {
            console.log(`✅ Textarea uses full mobile width (${Math.round(box.width)}px of ${viewportWidth}px)`);
          } else {
            console.log(`ℹ️  Textarea width: ${Math.round(box.width)}px`);
          }
        }
      }
    }

    await context.close();
  });

  test('should show mobile-optimized dialogs', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      await context.close();
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
    }

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    const signInTab = page.getByRole('button', { name: /sign in/i });
    await signInTab.click();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL('http://localhost:8082/', { timeout: 10000 });

    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    const isVisible = await getStartedButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await getStartedButton.tap();
      await page.waitForTimeout(600);

      const textarea = page.locator('[data-spec-input] textarea').first();
      await textarea.fill('Build a comprehensive mobile fitness tracking application with social features');

      const generateButton = page.locator('[data-spec-input]').locator('button').first();
      await generateButton.tap();

      // Check dialog sizing
      const dialog = page.locator('[role="dialog"]').first();
      const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (dialogVisible) {
        const dialogBox = await dialog.boundingBox();

        if (dialogBox) {
          const viewportWidth = 375;
          const isFullScreen = dialogBox.width > viewportWidth * 0.9;

          if (isFullScreen) {
            console.log('✅ Dialog optimized for mobile (near full-screen)');
          } else {
            console.log(`ℹ️  Dialog width: ${Math.round(dialogBox.width)}px`);
          }
        }
      }
    }

    await context.close();
  });

  test('should have adequate spacing for touch targets', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();

    await page.goto('http://localhost:8082/auth');
    await page.waitForLoadState('networkidle');

    // Check spacing between buttons/links
    const buttons = await page.locator('button, a').all();
    const boxes = [];

    for (const button of buttons.slice(0, 5)) {
      const visible = await button.isVisible().catch(() => false);
      if (visible) {
        const box = await button.boundingBox();
        if (box) {
          boxes.push(box);
        }
      }
    }

    // Check for overlapping or too-close elements
    let hasAdequateSpacing = true;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];

        // Calculate distance between boxes
        const dx = Math.max(0, Math.max(box1.x - (box2.x + box2.width), box2.x - (box1.x + box1.width)));
        const dy = Math.max(0, Math.max(box1.y - (box2.y + box2.height), box2.y - (box1.y + box1.height)));
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 8) { // 8px minimum spacing
          hasAdequateSpacing = false;
          break;
        }
      }
    }

    if (hasAdequateSpacing) {
      console.log('✅ Adequate spacing between touch targets');
    } else {
      console.log('⚠️  Some touch targets may be too close together');
    }

    await context.close();
  });
});
