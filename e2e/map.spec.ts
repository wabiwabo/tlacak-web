import { test, expect } from '@playwright/test';

// The Playwright web server runs `vite preview`, which proxies every `/api/*`
// request to a backend that is not running here. Any unstubbed `/api` call
// therefore 502s, and some of those surface as uncaught page errors. This
// smoke test stubs the whole `/api` surface the authenticated app touches on
// first paint so the protected route resolves to the main page with no
// backend. The WebSocket (`/api/socket`) is left unconnected — the live
// socket controller handles a failed connection gracefully.
test('main page renders the map shell and device toolbar', async ({ page }) => {
  await page.route('**/api/server', (route) => route.fulfill({ json: { id: 1, attributes: {} } }));
  await page.route('**/api/session', (route) =>
    route.fulfill({ json: { id: 1, name: 'Tester', attributes: {} } }),
  );
  await page.route('**/api/devices', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/positions', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/geofences', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/groups', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/drivers', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/maintenance', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/calendars', (route) => route.fulfill({ json: [] }));

  await page.goto('/');
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});
