import { test, expect } from '@playwright/test';

test('user can join existing family with valid family code', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
    }
  });

  // Navigate to register page
  await page.goto('/auth/register');

  const timestamp = Date.now();
  const userData = {
    name: `Test User ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    password: 'testpass123',
    familyCode: 'A0GX31' // Use known valid family code from database
  };

  console.log('Testing family joining with data:', { ...userData, password: '[HIDDEN]' });

  // Fill out registration form with valid family code
  await page.fill('input[placeholder="Sir Galahad"]', userData.name);
  await page.fill('input[placeholder="hero@example.com"]', userData.email);
  await page.fill('input[placeholder="••••••••"]', userData.password);
  await page.fill('input[placeholder="BraveKnights123"]', userData.familyCode);

  console.log('Submitting registration form...');
  await page.click('button[type="submit"]');

  // Wait for successful registration and redirect to character creation
  console.log('Waiting for redirect to character creation...');
  await page.waitForURL(/.*\/character\/create/, { timeout: 15000 });

  // Verify we're on character creation page
  await expect(page.getByText('Create Your Hero').first()).toBeVisible({ timeout: 10000 });

  console.log('✅ Successfully joined family and reached character creation');
});