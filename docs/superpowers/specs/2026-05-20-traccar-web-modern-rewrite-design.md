# traccar-web — Modern Rewrite Design

- **Date:** 2026-05-20
- **Status:** Approved (brainstorming)
- **Scope:** Full big-bang rewrite of the Traccar web frontend (`traccar-web`)

## 1. Goal & Motivation

Rewrite the Traccar web UI from scratch to address four drivers, all in scope:

1. **Maintainability** — the current codebase is hard to extend: large files, no tests, no types, manual data layer.
2. **UX / visual** — the current look feels dated.
3. **Modern foundation** — adopt TypeScript and modern patterns for future velocity.
4. **Performance** — smaller bundles, faster load, responsive map/lists.

The rewrite is a **big-bang cutover**: the new app replaces the old one wholesale in a single release. There is no incremental in-production migration.

## 2. Scope

**In scope:** A 1:1 feature-parity rewrite of the entire existing application — all 60+ routes and features — with a new technology stack and a new visual design. Only the stack and appearance change; behaviour is preserved.

**Explicitly deferred (YAGNI):** New features beyond current parity. The user selected full 1:1 parity, so new features are a separate milestone *after* a successful cutover, built on the new stable, tested base. This keeps the spec a single verifiable unit.

## 3. Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + **TypeScript (strict)** | |
| Build | Vite 8 + SWC | Kept — already modern |
| UI | **shadcn/ui + Tailwind CSS v4** | Copy-paste components, not a dependency |
| Server state | **TanStack Query v5** | Caching, dedup, refetch |
| Client state | **Zustand** | Small store per domain |
| Routing | **React Router v7** (data router) | Kept — modern, low migration risk |
| Map | **MapLibre GL** | Kept — product core, library-agnostic |
| Charts | Recharts | Kept |
| Tables | TanStack Table + TanStack Virtual | Backs the shared `<DataTable>` |
| Testing | Vitest + Testing Library + Playwright | |
| Lint | ESLint flat config + Prettier | `react-hooks/exhaustive-deps` turned **ON** |
| PWA | vite-plugin-pwa | Kept |
| API types | `openapi-typescript` + `openapi-fetch` | Generated from backend `openapi.yaml` |

**Typed API client:** The backend ships an `openapi.yaml`. A typed client is generated from it, so API types stay in sync with the backend and replace all untyped manual `fetch` calls.

## 4. Architecture

Hybrid architecture — feature folders plus a thin domain `entities` layer:

```
src/
  app/        Entry, providers, router, global config
  pages/      Thin route components (one per route, lazy-loaded)
  features/   User-facing flows: device-management, reporting,
              geofence-editing, auth, settings, ...
  entities/   Domain models + TanStack Query hooks + types:
              device, position, geofence, group, driver,
              user, event, calendar, maintenance, notification
  shared/     UI kit (shadcn), api client, lib/util, hooks, i18n
  map/        MapLibre wrappers & layers (large, cohesive subsystem)
```

**Dependency rule:** `pages → features → entities → shared`. `map/` is consumed by features/pages. The direction is enforced by ESLint `import-x` — cross-feature imports are rejected automatically.

Each entity owns its types and query hooks (e.g. `entities/device/` exposes `useDevices()`, `useDevice(id)`, `useUpdateDevice()`), reused across dozens of pages without duplication.

**Rationale:** Traccar's defining trait is a small set of domain entities reused across 60+ pages. A dedicated `entities/` layer pays off here. Full Feature-Sliced Design was rejected as unnecessary ceremony for simple settings CRUD pages; flat feature folders were rejected for lacking a home for shared domain models.

## 5. Data Flow

- **Server data** → TanStack Query. Query/mutation hooks live in `entities/*/api`. Caching eliminates redundant cross-page fetches.
- **Real-time** → WebSocket `/api/socket` feeds a dedicated Zustand store for live positions and events; updates are throttled (replacing the old `throttleMiddleware`). Socket events invalidate or patch the TanStack Query cache where relevant.
- **UI / client state** → Zustand stores: selected device, map viewport, filters, open panels.
- **Session / auth** → `/api/session`, a query plus a Zustand session store.

## 6. Must-Preserve Constraints

From `traccar-web/CLAUDE.md` — these are non-negotiable:

1. **Template placeholders** `${colorPrimary}`, `${title}`, `${description}` in `index.html` and the PWA manifest are substituted by the backend via Velocity at request time. They must remain literal strings — never hardcoded.
2. **NativeInterface bridge** — detection of `appInterface` (iOS/Android) plus the window globals `handleLoginToken`, `updateNotificationToken`, `handleNativeNotification`. This is a versioned protocol with the mobile apps; it must be rebuilt with identical signatures.
3. **i18n — 61 languages** in `src/resources/l10n` must all be migrated. RTL supported from day one.
4. **API contract is fixed** — the backend is a separate repo; no API changes. Dev proxy: `/api` → `:8082`, `/api/socket` → ws.

## 7. Theming & Internationalization

- Tailwind CSS variables; **light + dark** themes both built.
- Default theme **follows the OS** (`prefers-color-scheme`); manual override is persisted.
- Visual direction: **Compact Pro** — dense spacing scale, smaller text, dense tables, for power users managing large fleets.
- White-label primary colour is honoured — the backend `${colorPrimary}` is injected as a CSS variable.
- **RTL** via Tailwind logical properties and the `dir` attribute; `stylis-plugin-rtl` is dropped.

## 8. Key Shared Component

**`<DataTable>`** — built on TanStack Table with sorting and virtualization (TanStack Virtual). shadcn/ui has no DataGrid, so this is designed early and reused by every list/report page.

## 9. Performance

- Route-based code splitting (`React.lazy` + Suspense) — small initial bundle.
- Manual chunks for `map/` and charts.
- Virtualized lists and tables.
- TanStack Query caching removes redundant fetches.

## 10. Testing Strategy

| Tier | Tooling | Coverage |
|------|---------|----------|
| Unit | Vitest | Utils, formatters, hooks, Zustand stores, query logic |
| Component | Vitest + Testing Library | Shared UI kit, complex feature components (e.g. `<DataTable>`) |
| E2E | Playwright | Critical flows: login, map + device list, create/edit device, run a report, edit geofence |
| CI | GitHub Actions | `lint` + `typecheck` + unit/component + E2E — replaces the current lint-only gate |

## 11. Cutover Strategy

- Built in the `traccar-web` repo on a long-lived dedicated branch. The new `src/` replaces the old one; old code remains in git history for reference.
- **Parity checklist:** every one of the 60+ routes/features is enumerated as an explicit acceptance criterion — the primary safety net alongside tests.
- Cutover: when parity is reached **and** all tests are green → merge the branch → a single release.
- Template placeholders and the NativeInterface bridge are verified specifically before cutover (highest silent-regression risk).

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Big-bang rewrite without a safety net | Layered tests + per-route parity checklist |
| shadcn/ui has no DataGrid | `<DataTable>` on TanStack Table, designed early |
| RTL / 61-language regressions | RTL from day one, smoke test an RTL language |
| Mobile bridge breaks silently | Identical signatures preserved + pre-cutover verification |

## 13. Decisions Log

| Decision | Choice |
|----------|--------|
| Motivation | All four (maintainability, UX, modern stack, performance) |
| Feature scope | Full 1:1 parity; new features deferred |
| Language | TypeScript (strict) |
| Component library | shadcn/ui + Tailwind |
| State & data | TanStack Query + Zustand |
| Testing | Layered: unit + component + E2E |
| Visual direction | Compact Pro (dense, power-user) |
| Default theme | Follow system (light + dark both built) |
| Architecture | Hybrid: feature folders + entities layer |
| Cutover | Big-bang, single release |
