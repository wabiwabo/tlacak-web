import { test, expect, type Page } from '@playwright/test';

async function stubAuthenticatedSession(page: Page) {
  await page.route('**/api/server', (route) =>
    route.fulfill({ json: { id: 1, registration: true, attributes: {} } }),
  );
  await page.route('**/api/session', (route) =>
    route.fulfill({ json: { id: 5, name: 'Tester', email: 'tester@host.com', attributes: {} } }),
  );
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
}

test('reports menu navigates between report tabs', async ({ page }) => {
  await stubAuthenticatedSession(page);
  await page.goto('/reports/combined');
  await expect(page.getByRole('heading', { name: /combined/i })).toBeVisible();

  await page.getByRole('link', { name: /trips/i }).click();
  await expect(page).toHaveURL(/\/reports\/trips/);
  await expect(page.getByRole('button', { name: /show/i })).toBeVisible();
});
