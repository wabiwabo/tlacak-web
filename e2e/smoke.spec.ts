import { test, expect } from '@playwright/test';

test('app shell loads and routes to the main page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Main page', { exact: true })).toBeVisible();
});

test('unknown routes render the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible();
});
