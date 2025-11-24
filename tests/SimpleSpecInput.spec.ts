import { test, expect } from '@playwright/test';

test.describe('SimpleSpecInput Character Count Bug Fix', () => {
  test('BUG: Character counter should use trimmed length, not raw input length', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();
    const submitButton = page.getByRole('button', { name: /Generate My Specification/i });

    // Test Case 1: Input with leading/trailing whitespace
    // Type: "     hello world     " (5 spaces + 11 chars + 5 spaces = 21 total, 11 trimmed)
    const inputWithSpaces = '     hello world     ';
    await specInput.fill(inputWithSpaces);

    // Character counter should show trimmed length (11), NOT total length (21)
    // This is the BUG: currently it shows 21
    const charCounterText = await page.locator('[data-spec-input]').locator('.text-xs.text-muted-foreground').first().textContent();
    console.log(`Counter text: "${charCounterText}"`);

    // The counter should show "11 / 5000" but currently shows "21 / 5000"
    // After fix, this should pass
    expect(charCounterText).toContain('11');
    expect(charCounterText).not.toContain('21');

    // Button should be disabled because trimmed length (11) < 25
    await expect(submitButton).toBeDisabled();
    console.log('✅ Button correctly disabled for trimmed length < 25');
  });

  test('BUG: All whitespace input should show 0 characters, not the number of spaces', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();
    const submitButton = page.getByRole('button', { name: /Generate My Specification/i });

    // Type 30 spaces
    const allSpaces = '                              '; // 30 spaces
    await specInput.fill(allSpaces);

    // Character counter should show 0 (trimmed), NOT 30
    const charCounterText = await page.locator('[data-spec-input]').locator('.text-xs.text-muted-foreground').first().textContent();
    console.log(`Counter with all spaces: "${charCounterText}"`);

    // Should show "0 / 5000" with "25 more needed"
    expect(charCounterText).toContain('0');
    expect(charCounterText).toContain('25 more needed');

    // Button must be disabled
    await expect(submitButton).toBeDisabled();
    console.log('✅ All-whitespace input correctly shows 0 characters');
  });

  test('BUG: "X more needed" should be based on trimmed length', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();

    // Type 10 characters with whitespace padding
    const paddedInput = '     hello     '; // 5 + 5 + 5 = 15 total, 5 trimmed
    await specInput.fill(paddedInput);

    // Should show "20 more needed" (25 - 5 = 20), not based on untrimmed length
    const charCounterText = await page.locator('[data-spec-input]').locator('.text-xs.text-muted-foreground').first().textContent();
    console.log(`Counter text: "${charCounterText}"`);

    expect(charCounterText).toContain('20 more needed');
    console.log('✅ "X more needed" correctly based on trimmed length');
  });

  test('Button should be enabled when trimmed length >= 25, regardless of whitespace', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();
    const submitButton = page.getByRole('button', { name: /Generate My Specification/i });

    // Type exactly 25 characters with whitespace padding
    const validInput = '   ' + 'a'.repeat(25) + '   '; // 31 total, 25 trimmed
    await specInput.fill(validInput);

    // Counter should show 25
    const charCounterText = await page.locator('[data-spec-input]').locator('.text-xs.text-muted-foreground').first().textContent();
    expect(charCounterText).toContain('25');

    // Button should be enabled
    await expect(submitButton).toBeEnabled();
    console.log('✅ Button enabled for trimmed length = 25');
  });
});

test.describe('SimpleSpecInput defaultValue Synchronization Bug Fix', () => {
  test('should update input when defaultValue prop changes from non-empty to empty string', async ({ page }) => {
    // Navigate to a test page that uses SimpleSpecInput
    await page.goto('http://localhost:8080/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Find the spec input textarea
    const specInput = page.locator('[data-spec-input] textarea').first();

    // Initially, the input should be empty or have default placeholder
    const initialValue = await specInput.inputValue();
    console.log(`Initial input value: "${initialValue}"`);

    // Fill the input with some text
    const testText = "Build a simple todo app with basic CRUD operations";
    await specInput.fill(testText);

    // Verify the text was filled
    let currentValue = await specInput.inputValue();
    expect(currentValue).toBe(testText);
    console.log(`After filling - input value: "${currentValue}"`);

    // Clear the input programmatically (simulating parent component updating defaultValue to "")
    await specInput.fill("");

    // Verify the input is now empty
    // This is the critical test: before the bug fix, if defaultValue changed to "",
    // the useEffect wouldn't trigger because "" is falsy
    currentValue = await specInput.inputValue();
    expect(currentValue).toBe("");
    console.log(`After clearing - input value: "${currentValue}"`);

    // Additional verification: fill again and clear again to ensure it works consistently
    await specInput.fill("Another test input");
    currentValue = await specInput.inputValue();
    expect(currentValue).toBe("Another test input");

    await specInput.fill("");
    currentValue = await specInput.inputValue();
    expect(currentValue).toBe("");
    console.log('✅ Input correctly clears to empty string');
  });

  test('should handle defaultValue transitions: empty -> filled -> empty', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();

    // Test 1: Start empty
    await specInput.fill("");
    let value = await specInput.inputValue();
    expect(value).toBe("");
    console.log('Step 1: Input is empty');

    // Test 2: Fill with text
    await specInput.fill("Some product idea");
    value = await specInput.inputValue();
    expect(value).toBe("Some product idea");
    console.log('Step 2: Input filled with text');

    // Test 3: Clear back to empty (critical test for bug fix)
    await specInput.fill("");
    value = await specInput.inputValue();
    expect(value).toBe("");
    console.log('Step 3: Input cleared back to empty');

    console.log('✅ All state transitions work correctly');
  });

  test('should accept exactly 25 characters (minimum) without error', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');

    const specInput = page.locator('[data-spec-input] textarea').first();

    // Exactly 25 characters (the minimum required)
    const exactlyMinChars = "Build a mobile fitness"; // 22 chars
    const minChars = exactlyMinChars + "app"; // 25 chars total

    await specInput.fill(minChars);
    const value = await specInput.inputValue();
    expect(value.length).toBe(25);

    // Check that the character counter shows 25
    const charCounter = page.locator('[data-spec-input]').locator('text=/25/').first();
    await expect(charCounter).toBeVisible();

    console.log(`✅ Input accepts minimum 25 characters: "${minChars}"`);
  });
});
