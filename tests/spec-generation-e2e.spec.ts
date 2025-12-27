 
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Spec Generation E2E Flow', () => {
  test('should successfully generate a spec through the full flow', async ({ page }) => {
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
    console.log('✅ Step 1 complete: Logged in successfully');

    // Step 2: Navigate to spec input
    console.log('Step 2: Navigating to spec input...');
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();

    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      await page.waitForTimeout(1000);
    }
    console.log('✅ Step 2 complete: Navigated to input');

    // Step 3: Enter spec input
    console.log('Step 3: Entering spec request...');
    const specInput = page.locator('textarea, input[placeholder*="spec" i], input[placeholder*="describe" i], textarea[placeholder*="spec" i], textarea[placeholder*="describe" i]').first();

    await expect(specInput).toBeVisible({ timeout: 5000 });

    const testInput = 'Build a simple to-do list app with basic CRUD operations';
    await specInput.fill(testInput);
    await page.waitForTimeout(500);

    const inputValue = await specInput.inputValue();
    expect(inputValue).toContain('to-do list');
    console.log('✅ Step 3 complete: Spec input entered');

    // Step 4: Submit the spec request
    console.log('Step 4: Submitting spec request...');

    // Set up network listeners to capture the API call
    const apiCalls: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('multi-agent-spec')) {
        const status = response.status();
        console.log(`   📡 API Response: ${status}`);

        try {
          const body = await response.json();
          console.log(`   📦 Response body:`, JSON.stringify(body, null, 2));
          apiCalls.push({ status, body });
        } catch (e) {
          console.log(`   ⚠️  Could not parse response body`);
        }
      }
    });

    // Look for the "Generate My Specification" button
    const generateButton = page.locator('button:has-text("Generate My Specification")').first();

    // Scroll button into view
    await generateButton.scrollIntoViewIfNeeded({ timeout: 5000 });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log('   🔘 Generate button clicked');

    // Step 5: Confirm the dialog
    console.log('Step 5: Confirming spec generation...');

    // Wait for confirmation dialog to appear
    const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Confirmation dialog appeared');

    // Look for the "Confirm & Generate (FREE)" button in the dialog
    const confirmButton = page.locator('button:has-text("Confirm & Generate")').first();
    await expect(confirmButton).toBeVisible({ timeout: 3000 });
    await confirmButton.click();
    console.log('   ✅ Confirmed spec generation');

    // Step 6: Wait for API response (with generous timeout for AI processing)
    console.log('Step 6: Waiting for spec generation (may take up to 60 seconds)...');

    // Wait for at least one API call
    await page.waitForTimeout(5000);

    if (apiCalls.length === 0) {
      console.log('   ⚠️  No API calls detected yet, checking page state...');

      // Check for any error messages on the page
      const errorMessages = await page.locator('[class*="error"], [role="alert"]').all();
      if (errorMessages.length > 0) {
        for (const error of errorMessages) {
          const text = await error.textContent();
          console.log(`   ❌ Error on page: ${text}`);
        }
      }

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/spec-generation-state.png', fullPage: true });
      console.log('   📸 Screenshot saved to test-results/spec-generation-state.png');
    } else {
      console.log(`✅ Step 6 complete: Received ${apiCalls.length} API response(s)`);

      // Verify the response
      const firstCall = apiCalls[0];
      if (firstCall.status === 200) {
        console.log('   ✅ API call succeeded (200)');
      } else if (firstCall.status >= 400) {
        console.log(`   ❌ API call failed with status ${firstCall.status}`);
        console.log(`   Error: ${JSON.stringify(firstCall.body)}`);
      }
    }

    // Step 7: Verify spec generation UI
    console.log('Step 7: Verifying spec generation UI...');

    // Look for loading indicators, progress, or results
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="progress"]').first();
    const hasLoading = await loadingIndicators.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasLoading) {
      console.log('   ⏳ Loading indicator visible - spec generation in progress');
    }

    // Look for results or spec output
    const specOutput = page.locator('[class*="spec"], [class*="result"], [class*="output"]').first();
    const hasOutput = await specOutput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOutput) {
      const outputText = await specOutput.textContent();
      console.log(`   📄 Spec output visible (${outputText?.length} characters)`);
      console.log('✅ Step 7 complete: Spec generation UI working');
    } else {
      console.log('   ℹ️  No spec output visible yet (may still be processing)');
    }

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`✅ Login: Success`);
    console.log(`✅ Navigation: Success`);
    console.log(`✅ Input: Success`);
    console.log(`${apiCalls.length > 0 ? '✅' : '⚠️ '} API Calls: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      const successCalls = apiCalls.filter(c => c.status === 200).length;
      const errorCalls = apiCalls.filter(c => c.status >= 400).length;
      console.log(`   - Success: ${successCalls}`);
      console.log(`   - Errors: ${errorCalls}`);
    }
    console.log('==================\n');

    // Fail test if there were API errors
    if (apiCalls.some(c => c.status >= 400)) {
      throw new Error(`Spec generation failed with API errors. Check logs above.`);
    }

    // Succeed if at least one API call was made successfully
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});
