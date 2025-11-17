#!/usr/bin/env node

/**
 * Validation script to verify the test command is properly configured
 * This script validates the fix for the bug where npm test was configured
 * to skip tests instead of running Playwright
 */

import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateTestScript() {
  console.log('🔍 Validating test script configuration...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Verify package.json configuration
  console.log('Test 1: Checking package.json test script...');
  try {
    const packageJson = JSON.parse(await readFile('./package.json', 'utf-8'));
    const testScript = packageJson.scripts.test;
    
    if (testScript === 'playwright test') {
      console.log('✅ PASS: Test script correctly configured as "playwright test"');
    } else if (testScript.includes('echo') && testScript.includes('No tests configured yet')) {
      console.log('❌ FAIL: Test script still contains placeholder message');
      console.log(`   Found: "${testScript}"`);
      allTestsPassed = false;
    } else {
      console.log(`⚠️  WARNING: Unexpected test script: "${testScript}"`);
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read package.json');
    console.log(`   Error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 2: Verify Playwright is executable
  console.log('\nTest 2: Checking Playwright installation...');
  try {
    const { stdout } = await execAsync('npm run test -- --version');
    const versionMatch = stdout.match(/Version (\d+\.\d+\.\d+)/);
    
    if (versionMatch) {
      console.log(`✅ PASS: Playwright is installed (${versionMatch[0]})`);
    } else {
      console.log('❌ FAIL: Could not determine Playwright version');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not execute Playwright');
    console.log(`   Error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: Verify test files exist
  console.log('\nTest 3: Checking for test files...');
  try {
    const { stdout } = await execAsync('find tests -name "*.spec.ts" | wc -l');
    const testFileCount = parseInt(stdout.trim());
    
    if (testFileCount >= 10) {
      console.log(`✅ PASS: Found ${testFileCount} test files`);
    } else if (testFileCount > 0) {
      console.log(`⚠️  WARNING: Only ${testFileCount} test files found (expected 10+)`);
    } else {
      console.log('❌ FAIL: No test files found');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not count test files');
    console.log(`   Error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Verify Playwright config exists
  console.log('\nTest 4: Checking Playwright configuration...');
  try {
    const configContent = await readFile('./playwright.config.ts', 'utf-8');
    
    if (configContent.includes('defineConfig') && configContent.includes('testDir')) {
      console.log('✅ PASS: Playwright config file is valid');
    } else {
      console.log('❌ FAIL: Playwright config appears invalid');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read playwright.config.ts');
    console.log(`   Error: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Final result
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('✅ ALL VALIDATION TESTS PASSED');
    console.log('\nThe test script bug has been successfully fixed!');
    console.log('You can now run tests with: npm test');
    process.exit(0);
  } else {
    console.log('❌ SOME VALIDATION TESTS FAILED');
    console.log('\nPlease review the failures above.');
    process.exit(1);
  }
}

// Run validation
validateTestScript().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});

