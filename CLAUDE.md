# CLAUDE.md (traccar-web)

This file provides guidance to Claude Code (claude.ai/code) when working in the `traccar-web` submodule. The parent repo's `CLAUDE.md` covers the Java backend; this file covers only the frontend.

## Project

Traccar web UI. **React 19** + **Vite 8** + **Material-UI 9** + **MapLibre GL** + **Redux Toolkit**. Plain JavaScript (JSX), ESM, npm. Lives as a git submodule under the Java backend repo; pulled in only during release CI on the backend side.

## Dev & build

- `npm run start` — Vite dev server on `:3000`. Proxies `/api` → `localhost:8082` and `/api/socket` → `ws://localhost:8082`. **The Java backend must be running**, or auth/data requests 404.
- `npm run build` — production build into `build/`. Self-contained; no backend needed.
- `npm run lint` — ESLint (flat config). **The only CI gate** (`.github/workflows/lint.yml`).
- `npm run lint:fix` — auto-fix lint + Prettier violations.
- `npm run generate-pwa-assets` — regenerate PWA icons from `public/logo.svg`. Only run when the logo changes.

## Linting & formatting

ESLint flat config (`eslint.config.js`). Prettier integrated via `eslint-plugin-prettier`: **single quotes**, **100-char line width**. Several rules deliberately relaxed:
- `react-hooks/exhaustive-deps` off — don't add exhaustive deps as a default refactor.
- `@eslint-react/no-array-index-key` off.
- `@eslint-react/set-state-in-effect` off.

No test runner. `npm run lint` is the verification. If asked "are the tests passing," answer that there are no tests — don't claim a pass that doesn't exist.

## State management

**Redux Toolkit**. Slices live in `src/store/`: `session`, `devices`, `events`, `geofences`, `groups`, `drivers`, `maintenances`, `calendars`, `motion`, `errors`. Custom `throttleMiddleware` for high-frequency updates (positions, etc.). Add to existing slices rather than introducing Context or new state libraries.

## Architecture

Feature-folder layout under `src/`:
- `main/` — primary app shell, map view, device list.
- `settings/`, `reports/`, `login/`, `other/` — feature areas.
- `map/` — MapLibre wrappers and layers.
- `common/components/`, `common/util/` — shared components and helpers.

Routing: React Router v7 in `Navigation.jsx` (30+ routes covering login/register/main/reports/settings).

API: raw `fetch` against `/api/*` (proxied in dev, same-origin in prod). No OpenAPI codegen and no typed API client — pattern is `fetch` + `await response.json()` + Redux thunk. Session-based auth via `/api/session`. Real-time updates via WebSocket at `/api/socket`.

## Template substitution — DO NOT "fix" the placeholders

`index.html` and the PWA manifest (`vite.config.js → VitePWA → manifest`) contain literal placeholders like `${colorPrimary}`, `${title}`, `${description}`. They are **not** Vite template variables. The Java backend substitutes them at request time via Velocity templating. Leaving them as literal strings in the build output is correct and intentional. Do not replace them with hardcoded values.

## NativeInterface (mobile WebView bridge)

`src/common/components/NativeInterface.js` is the bridge for iOS/Android native apps embedding the web UI. It detects `window.webkit.messageHandlers.appInterface` (iOS) or `window.appInterface` (Android) and posts messages like `login|<token>`. The native side calls back via window globals: `handleLoginToken`, `updateNotificationToken`, `handleNativeNotification`. These globals are a versioned protocol with the mobile apps — **don't rename, remove, or change their signatures** without coordinating with the mobile teams.

## Gotchas

- `.npmrc` sets `legacy-peer-deps=true`. This suppresses peer-dep conflicts. If `npm install` succeeds despite a warning, treat unknown major-version bumps as suspect — re-run with `--strict-peer-deps` if you want the truth.
- No TypeScript. Don't propose migrating piecemeal — it's a project-wide decision, not a per-file refactor.
- Vite static-copies `node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js` into the build root for RTL text support. If a build adds it and you didn't expect that file, this is why.
- PWA / Workbox is active. `workbox.navigateFallbackDenylist: [/^\/api/]` means `/api/*` is never served from cache. Cache invalidation in dev sometimes lags — hard-reload (`Cmd/Ctrl+Shift+R`) when in doubt.
