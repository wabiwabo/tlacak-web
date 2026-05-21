import { test, expect } from '@playwright/test';

test('unauthenticated visit redirects to the login page', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  await page.route('**/api/session', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

test('a successful login lands on the map shell', async ({ page }) => {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  let authenticated = false;
  await page.route('**/api/session', (route) => {
    if (route.request().method() === 'POST') {
      authenticated = true;
      return route.fulfill({ json: { id: 5, name: 'Pat', attributes: {} } });
    }
    return authenticated
      ? route.fulfill({ json: { id: 5, name: 'Pat', attributes: {} } })
      : route.fulfill({ status: 404, body: '' });
  });
  // The preview server has no backend, so every other `/api` call the
  // authenticated app makes on first paint must be stubbed or it 502s.
  for (const path of [
    'devices',
    'positions',
    'geofences',
    'groups',
    'drivers',
    'maintenance',
    'calendars',
  ]) {
    await page.route(`**/api/${path}`, (route) => route.fulfill({ json: [] }));
  }
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('pat@host.com');
  await page.getByLabel(/password/i).fill('secret');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});
