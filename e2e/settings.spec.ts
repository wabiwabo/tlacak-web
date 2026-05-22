import { test, expect, type Page } from '@playwright/test';

// Stub the API surface the authenticated app needs on first paint.
// No backend runs during E2E; see map.spec.ts for the full rationale.
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

test('settings/preferences renders the preferences page', async ({ page }) => {
  await stubAuthenticatedSession(page);
  await page.goto('/settings/preferences');
  // SettingsLayout renders an h1 heading with the translated titleKey "sharedPreferences"
  await expect(page.getByRole('heading', { name: /preferences/i })).toBeVisible();
  // The SettingsMenu sidebar navigation link for Preferences is present
  await expect(page.getByRole('link', { name: /preferences/i }).first()).toBeVisible();
});

test('settings/devices renders the devices list route', async ({ page }) => {
  await stubAuthenticatedSession(page);
  await page.goto('/settings/devices');
  // SettingsListPage renders an h1 heading using the "deviceTitle" translation key
  await expect(page.getByRole('heading', { name: /device/i })).toBeVisible();
});
