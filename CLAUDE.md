# CLAUDE.md (traccar-web)

This file provides guidance to Claude Code (claude.ai/code) when working in the `traccar-web` submodule. The parent repo's `CLAUDE.md` covers the Java backend; this file covers only the frontend.

## Project

Traccar web UI — currently undergoing a **big-bang rewrite** on the `rewrite/modern-frontend` branch. `master` still ships the legacy app (plain JavaScript, MUI, Redux Toolkit). The new stack is **TypeScript (strict) + React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui + TanStack Query v5 + Zustand v5 + React Router v7**. ESM, npm.

Lives as a git submodule under the Java backend repo; pulled in only during release CI on the backend side.

## Legacy code

The old source has been moved to the `legacy/` directory as a parity reference. It is **not built, not linted, and excluded from TypeScript checking**. It will be deleted at cutover. Do not edit files under `legacy/`; read them only as a reference for feature parity.

## Dev & build

- `npm start` — Vite dev server on `:3000`. Proxies `/api` → `http://localhost:8082` and `/api/socket` → `ws://localhost:8082`. **The Java backend must be running**, or auth/data requests 404.
- `npm run build` — production build into `build/`.
- `npm run lint` — ESLint (flat config, TypeScript-aware).
- `npm run lint:fix` — auto-fix lint + Prettier violations.
- `npm run typecheck` — `tsc --noEmit`.
- `npm test` — Vitest (unit + component tests, jsdom).
- `npm run e2e` — Playwright end-to-end tests.
- `npm run api:generate` — regenerate `src/shared/api/schema.d.ts` from the vendored `openapi.yaml` snapshot using `openapi-typescript`.
- `npm run generate-pwa-assets` — regenerate PWA icons from `public/logo.svg`. Only run when the logo changes.

## CI

`.github/workflows/ci.yml` runs on push/PR: `lint` → `typecheck` → `test` → `e2e` (Playwright with Chromium). All four gates must pass. Node 20.

## Architecture

Hybrid feature/entities layering under `src/`:

- `app/` — entry point (`main.tsx`), root providers (`providers.tsx`), router (`router.tsx`), global styles.
- `pages/` — top-level route components (`LoginPage`, `MainPage`, `NotFoundPage`).
- `shared/` — cross-cutting infrastructure:
  - `shared/api/` — typed API client (`client.ts` built with `openapi-fetch`; `schema.d.ts` is generated, do not edit by hand; `query-client.ts` — TanStack Query factory).
  - `shared/ui/` — shadcn/ui component library (button, card, data-table, etc.).
  - `shared/lib/` — small utilities (`cn.ts` for Tailwind class merging, `ErrorBoundary.tsx`).
  - `shared/i18n/` — `react-i18next` setup, locale files, RTL helper.
- `features/`, `entities/`, `map/` — **not yet created**; planned for later subsystem phases. Add them as subsystem work starts.

Path alias: `@/*` → `src/*` (configured in `tsconfig.json` and `vite.config.ts`).

shadcn/ui config lives in `components.json`; new components go to `src/shared/ui/`.

## State & data fetching

**TanStack Query v5** is the primary server-state layer. **Zustand v5** for lightweight client-side state. Redux Toolkit remains in `package.json` (transitional — the legacy app still uses it; remove after cutover). Do not add new Redux slices. Do not add React Context for server state.

## API client

`src/shared/api/client.ts` exports `apiClient` (an `openapi-fetch` instance typed against the generated `paths` from `schema.d.ts`). Base URL is `/api`. Always use `apiClient` for new API calls — do not fall back to raw `fetch`.

`schema.d.ts` is generated; **never edit it by hand**. Regenerate with `npm run api:generate` after updating `openapi.yaml`.

## Linting & formatting

ESLint flat config (`eslint.config.js`), `typescript-eslint` recommended, Prettier integrated. Notable rules:

- `react-hooks/exhaustive-deps` is **`error`** — fix missing deps, do not suppress.
- `import-x/no-cycle` is **`error`** — do not create circular imports between modules.
- `legacy/**` and `src/shared/api/schema.d.ts` are excluded from linting.
- Prettier: **single quotes**, **100-char line width** (inherited from the legacy config; verify in `.prettierrc` if added).

## TypeScript

Strict mode is fully enabled, including `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters`. `verbatimModuleSyntax` is on — use `import type` for type-only imports. The `legacy/` tree is excluded from `tsconfig.json`.

## Template substitution — DO NOT "fix" the placeholders

`index.html` contains literal placeholders: `${colorPrimary}`, `${description}`, `${title}`. They are **not** Vite template variables. The Java backend substitutes them at request time via Velocity templating. Leaving them as literal strings in the build output is correct and intentional. Do not replace them with hardcoded values.

## NativeInterface (mobile WebView bridge)

The bridge for iOS/Android native apps embedding the web UI currently lives in `legacy/src/` (see `NativeInterface.js`). It detects `window.webkit.messageHandlers.appInterface` (iOS) or `window.appInterface` (Android) and posts messages like `login|<token>`. The native side calls back via window globals: `handleLoginToken`, `updateNotificationToken`, `handleNativeNotification`. These globals are a **versioned protocol with the mobile apps** — don't rename, remove, or change their signatures without coordinating with the mobile teams. When the auth subsystem is ported to the new stack, preserve the same interface exactly.

## Gotchas

- `.npmrc` sets `legacy-peer-deps=true`. This suppresses peer-dep conflicts. If `npm install` succeeds despite warnings, re-run with `--strict-peer-deps` to audit the real state.
- MUI (`@mui/material`) and MapLibre (`maplibre-gl`) remain in `package.json` as transitional dependencies carried from the legacy app; they will be removed at cutover. Do not use them in new code under `src/`.
- `vite.config.ts` does **not** yet wire up the `vite-plugin-pwa` PWA manifest — the `${colorPrimary}` / `${title}` / `${description}` substitution therefore applies only to `index.html` for now.
- Vite static-copies `node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js` into the build root for RTL text support (legacy carry-over). If a build emits that file unexpectedly, this is why.
