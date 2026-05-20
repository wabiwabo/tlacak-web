import { test, expect } from '@playwright/test';

test('unauthenticated visit to / redirects to the login page', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  await page.route('**/api/session', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test('unknown routes render the not-found page', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  await page.goto('/does-not-exist');
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible();
});
