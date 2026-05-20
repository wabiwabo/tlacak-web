# Foundation Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a running, testable app shell for the rewritten Traccar web frontend — the toolchain, theme system, data layer, i18n, routing skeleton, shared `<DataTable>`, and CI that every later subsystem builds on.

**Architecture:** New React 19 + TypeScript app under `src/`, organized as `app / pages / features / entities / shared / map` (hybrid feature+entities layering). Server state via TanStack Query, client state via Zustand. shadcn/ui + Tailwind CSS v4 for UI. The old JavaScript source is relocated to `legacy/` (excluded from build/lint/types) as a parity reference, to be deleted at cutover.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand v5, TanStack Table v8, React Router v7, react-i18next, openapi-typescript + openapi-fetch, Vitest + Testing Library, Playwright.

**Branch:** `rewrite/modern-frontend` (already created).

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `legacy/` | Old JS source, relocated for reference. Not built, not linted. |
| `index.html` | Entry HTML — keeps backend `${...}` placeholders, points at new entry. |
| `tsconfig.json`, `tsconfig.node.json` | TypeScript config, strict. |
| `vite.config.ts` | Vite config — React SWC, Tailwind, tsconfig paths, PWA, dev proxy. |
| `src/app/main.tsx` | App entry — mounts React root. |
| `src/app/App.tsx` | Root component — composes providers + router. |
| `src/app/providers.tsx` | `<AppProviders>` — Query, theme, i18n, error boundary. |
| `src/app/router.tsx` | React Router v7 route tree (skeleton). |
| `src/app/styles/global.css` | Tailwind import + `@theme` design tokens. |
| `src/shared/ui/` | shadcn/ui primitives + shared components. |
| `src/shared/ui/data-table/DataTable.tsx` | Generic table on TanStack Table. |
| `src/shared/lib/theme/` | Theme store, resolver, provider. |
| `src/shared/lib/ErrorBoundary.tsx` | React error boundary. |
| `src/shared/api/query-client.ts` | Configured TanStack `QueryClient`. |
| `src/shared/api/schema.d.ts` | Generated OpenAPI types (generated, committed). |
| `src/shared/api/client.ts` | Typed `apiClient` (openapi-fetch). |
| `src/shared/i18n/` | i18next setup, locale JSON, RTL helpers. |
| `src/pages/` | Placeholder route components. |
| `.github/workflows/ci.yml` | Lint + typecheck + test + e2e gate. |
| `e2e/` | Playwright tests. |

---

## Task 1: Project scaffold & legacy relocation

**Files:**
- Move: `src/` → `legacy/src/`, `eslint.config.js` → `legacy/eslint.config.js`, `vite.config.js` → `legacy/vite.config.js`
- Create: `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/app/main.tsx`, `src/app/App.tsx`
- Modify: `index.html`, `package.json`

- [ ] **Step 1: Relocate the old source out of the build path**

```bash
mkdir -p legacy
git mv src legacy/src
git mv eslint.config.js legacy/eslint.config.js
git mv vite.config.js legacy/vite.config.js
```

- [ ] **Step 2: Install new dependencies**

```bash
npm install react@^19 react-dom@^19 react-router-dom@^7 \
  @tanstack/react-query@^5 zustand@^5 @tanstack/react-table@^8 @tanstack/react-virtual@^3 \
  i18next@latest react-i18next@latest openapi-fetch@latest
npm install -D typescript @types/react @types/react-dom \
  @vitejs/plugin-react-swc vite-tsconfig-paths openapi-typescript@latest
```

Expected: installs succeed (`.npmrc` sets `legacy-peer-deps=true`).

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "e2e"],
  "exclude": ["legacy", "build", "node_modules"]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

Port the dev proxy and `build.outDir` from `legacy/vite.config.js`. PWA and the RTL static-copy are re-added in later tasks/plans.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api/socket': 'ws://localhost:8082',
      '/api': 'http://localhost:8082',
    },
  },
  build: { outDir: 'build' },
});
```

- [ ] **Step 6: Update `index.html`**

Keep the `${colorPrimary}`, `${description}`, `${title}` placeholders and the loader markup verbatim (backend Velocity substitutes them). Only change the entry script.

Change the script tag from `src="/src/index.jsx"` to:

```html
    <script type="module" src="/src/app/main.tsx" onerror="alert('Loading error.')"></script>
```

- [ ] **Step 7: Create `src/app/App.tsx`**

```tsx
export default function App() {
  return <div className="root">Traccar — rewrite shell</div>;
}
```

- [ ] **Step 8: Create `src/app/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found');
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Add `typecheck` script to `package.json`**

In the `scripts` block add:

```json
    "typecheck": "tsc -p tsconfig.json",
```

- [ ] **Step 10: Verify the app boots and typechecks**

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `npm run build`
Expected: build succeeds, `build/` produced.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Scaffold TypeScript app, relocate legacy source"
```

---

## Task 2: Tailwind CSS v4 & theme tokens

**Files:**
- Create: `src/app/styles/global.css`
- Modify: `vite.config.ts`, `src/app/main.tsx`

- [ ] **Step 1: Install Tailwind v4**

```bash
npm install -D tailwindcss@^4 @tailwindcss/vite@^4
```

- [ ] **Step 2: Register the Tailwind plugin in `vite.config.ts`**

Add the import and plugin:

```ts
import tailwindcss from '@tailwindcss/vite';
// ...
  plugins: [react(), tailwindcss(), tsconfigPaths()],
```

- [ ] **Step 3: Create `src/app/styles/global.css`**

Class-based dark mode (`.dark` on `<html>`). Tokens use CSS variables so the backend's `${colorPrimary}` can override `--color-primary` later via injected CSS.

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: #1d4ed8;
  --color-primary-foreground: #ffffff;
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
  --radius-card: 0.5rem;
  --spacing-row: 0.375rem;
}

.dark {
  --color-background: #0b1220;
  --color-foreground: #e2e8f0;
  --color-muted: #162032;
  --color-muted-foreground: #94a3b8;
  --color-border: #1e293b;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 4: Import the stylesheet in `src/app/main.tsx`**

Add as the first import:

```tsx
import './styles/global.css';
```

- [ ] **Step 5: Verify Tailwind compiles**

Edit `src/app/App.tsx` to use a utility class, then build:

```tsx
export default function App() {
  return <div className="root p-row text-muted-foreground">Traccar — rewrite shell</div>;
}
```

Run: `npm run build`
Expected: build succeeds, no unknown-utility errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add Tailwind v4 and theme design tokens"
```

---

## Task 3: ESLint & Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`
- Modify: `package.json`

- [ ] **Step 1: Install lint/format tooling**

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks \
  eslint-plugin-import-x eslint-config-prettier eslint-plugin-prettier prettier globals
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "singleQuote": true,
  "printWidth": 100
}
```

- [ ] **Step 3: Create `eslint.config.js`**

Note: `react-hooks/exhaustive-deps` is **on** (a deliberate change from the legacy config). `legacy/` is ignored.

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import importX from 'eslint-plugin-import-x';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['legacy/**', 'build/**', 'src/shared/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks, 'import-x': importX },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      'import-x/no-cycle': 'error',
    },
  },
  prettierRecommended,
);
```

- [ ] **Step 4: Update `lint` scripts in `package.json`**

```json
    "lint": "eslint .",
    "lint:fix": "eslint --fix ."
```

- [ ] **Step 5: Verify lint passes**

Run: `npm run lint`
Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add ESLint flat config and Prettier (exhaustive-deps on)"
```

---

## Task 4: Vitest & Testing Library setup

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/shared/lib/__tests__/sanity.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install test tooling**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add `test` scripts to `package.json`**

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 5: Write a sanity test — `src/shared/lib/__tests__/sanity.test.ts`**

```ts
import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the test**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Vitest and Testing Library setup"
```

---

## Task 5: Theme system (store, resolver, provider)

**Files:**
- Create: `src/shared/lib/theme/resolve-theme.ts`, `src/shared/lib/theme/theme-store.ts`, `src/shared/lib/theme/ThemeProvider.tsx`
- Test: `src/shared/lib/theme/__tests__/resolve-theme.test.ts`, `src/shared/lib/theme/__tests__/ThemeProvider.test.tsx`

- [ ] **Step 1: Write the failing test — `__tests__/resolve-theme.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../resolve-theme';

describe('resolveTheme', () => {
  it('returns the explicit mode when not system', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system preference when mode is system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/shared/lib/theme`
Expected: FAIL — cannot resolve `../resolve-theme`.

- [ ] **Step 3: Implement `src/shared/lib/theme/resolve-theme.ts`**

```ts
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): ResolvedTheme {
  if (mode === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return mode;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/theme`
Expected: PASS.

- [ ] **Step 5: Create the theme store — `src/shared/lib/theme/theme-store.ts`**

`mode` is persisted to `localStorage`; the OS preference is never persisted.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from './resolve-theme';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'traccar-theme' },
  ),
);
```

- [ ] **Step 6: Write the failing test — `__tests__/ThemeProvider.test.tsx`**

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { useThemeStore } from '../theme-store';

beforeEach(() => {
  useThemeStore.setState({ mode: 'dark' });
  document.documentElement.classList.remove('dark');
});

describe('ThemeProvider', () => {
  it('applies the dark class to <html> when mode is dark', () => {
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class when mode is light', () => {
    useThemeStore.setState({ mode: 'light' });
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run src/shared/lib/theme`
Expected: FAIL — cannot resolve `../ThemeProvider`.

- [ ] **Step 8: Implement `src/shared/lib/theme/ThemeProvider.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { resolveTheme } from './resolve-theme';
import { useThemeStore } from './theme-store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(mode, systemPrefersDark);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [mode, systemPrefersDark]);

  return children;
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/shared/lib/theme`
Expected: PASS — all theme tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add theme system: store, resolver, provider"
```

---

## Task 6: shadcn/ui base primitives

**Files:**
- Create: `components.json`, `src/shared/ui/button.tsx`, `src/shared/ui/card.tsx`, `src/shared/lib/cn.ts`
- Modify: `package.json` (shadcn adds dependencies)

- [ ] **Step 1: Create the `cn` class-merge helper — `src/shared/lib/cn.ts`**

```bash
npm install clsx tailwind-merge
```

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `components.json` for the shadcn CLI**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/styles/global.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/shared/lib/cn",
    "ui": "@/shared/ui"
  }
}
```

- [ ] **Step 3: Add the `button` and `card` primitives**

```bash
npx shadcn@latest add button card --yes
```

Expected: creates `src/shared/ui/button.tsx` and `src/shared/ui/card.tsx`.

- [ ] **Step 4: Write a component test — `src/shared/ui/__tests__/button.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run src/shared/ui`
Expected: PASS.

- [ ] **Step 6: Verify lint and typecheck still pass**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add shadcn/ui base primitives and cn helper"
```

---

## Task 7: App shell — error boundary, loader, providers

**Files:**
- Create: `src/shared/lib/ErrorBoundary.tsx`, `src/shared/ui/Loader.tsx`, `src/app/providers.tsx`
- Test: `src/shared/lib/__tests__/ErrorBoundary.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test — `__tests__/ErrorBoundary.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders fallback text when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <span>ok</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/shared/lib/__tests__/ErrorBoundary.test.tsx`
Expected: FAIL — cannot resolve `../ErrorBoundary`.

- [ ] **Step 3: Implement `src/shared/lib/ErrorBoundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <div className="p-row">Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/lib/__tests__/ErrorBoundary.test.tsx`
Expected: PASS.

- [ ] **Step 5: Create `src/shared/ui/Loader.tsx`**

```tsx
export function Loader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex h-full w-full items-center justify-center text-muted-foreground"
    >
      Loading…
    </div>
  );
}
```

- [ ] **Step 6: Create `src/app/providers.tsx`**

`QueryClientProvider` and i18n are wired in Tasks 8 and 10 — this task establishes the composition point with the theme + error boundary only.

```tsx
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary';
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 7: Update `src/app/App.tsx` to use the providers**

```tsx
import { AppProviders } from './providers';

export default function App() {
  return (
    <AppProviders>
      <div className="root p-row">Traccar — rewrite shell</div>
    </AppProviders>
  );
}
```

- [ ] **Step 8: Verify build, lint, typecheck, tests**

Run: `npm run build && npm run lint && npm run typecheck && npm test`
Expected: all exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add app shell: error boundary, loader, provider composition"
```

---

## Task 8: TanStack Query client

**Files:**
- Create: `src/shared/api/query-client.ts`
- Test: `src/shared/api/__tests__/query-client.test.ts`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Write the failing test — `__tests__/query-client.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '../query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient', () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('disables refetch-on-window-focus by default', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/shared/api`
Expected: FAIL — cannot resolve `../query-client`.

- [ ] **Step 3: Implement `src/shared/api/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/api`
Expected: PASS.

- [ ] **Step 5: Wire `QueryClientProvider` into `src/app/providers.tsx`**

```tsx
import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary';
import { ThemeProvider } from '@/shared/lib/theme/ThemeProvider';
import { createQueryClient } from '@/shared/api/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 6: Verify typecheck and tests**

Run: `npm run typecheck && npm test`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add TanStack Query client and provider"
```

---

## Task 9: Typed API client from OpenAPI

**Files:**
- Create: `openapi.yaml` (vendored copy), `src/shared/api/client.ts`, `src/shared/api/schema.d.ts` (generated)
- Test: `src/shared/api/__tests__/client.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Vendor the backend OpenAPI spec**

The spec lives in the backend repo. Copy it into this repo as a committed snapshot:

```bash
cp ../openapi.yaml ./openapi.yaml
```

Expected: `openapi.yaml` exists at the repo root.

- [ ] **Step 2: Add the codegen script to `package.json`**

```json
    "api:generate": "openapi-typescript ./openapi.yaml -o ./src/shared/api/schema.d.ts"
```

- [ ] **Step 3: Generate the types**

Run: `npm run api:generate`
Expected: `src/shared/api/schema.d.ts` is created and exports a `paths` type.

- [ ] **Step 4: Implement `src/shared/api/client.ts`**

```ts
import createClient from 'openapi-fetch';
import type { paths } from './schema';

export const apiClient = createClient<paths>({ baseUrl: '/' });
```

- [ ] **Step 5: Write the test — `__tests__/client.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { apiClient } from '../client';

describe('apiClient', () => {
  it('exposes typed request methods', () => {
    expect(typeof apiClient.GET).toBe('function');
    expect(typeof apiClient.POST).toBe('function');
  });
});
```

- [ ] **Step 6: Run the test and typecheck**

Run: `npx vitest run src/shared/api && npm run typecheck`
Expected: PASS and typecheck exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add typed API client generated from OpenAPI spec"
```

---

## Task 10: Internationalization (i18next + 61 locales + RTL)

**Files:**
- Create: `src/shared/i18n/rtl.ts`, `src/shared/i18n/index.ts`, `src/shared/i18n/I18nProvider.tsx`
- Copy: `legacy/src/resources/l10n/*.json` → `src/shared/i18n/locales/`
- Test: `src/shared/i18n/__tests__/rtl.test.ts`, `src/shared/i18n/__tests__/i18n.test.ts`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Copy the 61 locale files**

```bash
mkdir -p src/shared/i18n/locales
cp legacy/src/resources/l10n/*.json src/shared/i18n/locales/
```

Expected: 61 JSON files in `src/shared/i18n/locales/`.

- [ ] **Step 2: Write the failing test — `__tests__/rtl.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { isRtlLanguage, directionFor } from '../rtl';

describe('rtl helpers', () => {
  it('detects RTL languages', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('fa')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
  });

  it('treats other languages as LTR', () => {
    expect(isRtlLanguage('en')).toBe(false);
    expect(isRtlLanguage('id')).toBe(false);
  });

  it('maps a language to a direction string', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/shared/i18n`
Expected: FAIL — cannot resolve `../rtl`.

- [ ] **Step 4: Implement `src/shared/i18n/rtl.ts`**

```ts
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

export function isRtlLanguage(language: string): boolean {
  const base = language.split('-')[0]?.toLowerCase() ?? '';
  return RTL_LANGUAGES.has(base);
}

export function directionFor(language: string): 'rtl' | 'ltr' {
  return isRtlLanguage(language) ? 'rtl' : 'ltr';
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/shared/i18n`
Expected: PASS.

- [ ] **Step 6: Install the language detector**

```bash
npm install i18next-browser-languagedetector
```

- [ ] **Step 7: Implement `src/shared/i18n/index.ts`**

Locale JSON files are flat key→string maps, which i18next consumes directly under the `translation` namespace.

```ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const modules = import.meta.glob('./locales/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;

const resources = Object.fromEntries(
  Object.entries(modules).map(([path, translation]) => {
    const code = path.replace('./locales/', '').replace('.json', '');
    return [code, { translation }];
  }),
);

export const i18n = i18next.createInstance();

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

- [ ] **Step 8: Write the test — `__tests__/i18n.test.ts`**

```ts
import { describe, expect, it, beforeAll } from 'vitest';
import { i18n, i18nReady } from '../index';

describe('i18n', () => {
  beforeAll(async () => {
    await i18nReady;
  });

  it('loads English translations', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('sharedSave')).toBe('Save');
  });

  it('loads the Arabic locale', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('sharedSave')).not.toBe('sharedSave');
  });
});
```

- [ ] **Step 9: Run the test**

Run: `npx vitest run src/shared/i18n`
Expected: PASS — all i18n tests pass.

- [ ] **Step 10: Implement `src/shared/i18n/I18nProvider.tsx`**

Sets the `<html>` `lang` and `dir` attributes on language change.

```tsx
import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './index';
import { directionFor } from './rtl';

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = (language: string) => {
      document.documentElement.lang = language;
      document.documentElement.dir = directionFor(language);
    };
    apply(i18n.language || 'en');
    i18n.on('languageChanged', apply);
    return () => i18n.off('languageChanged', apply);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

- [ ] **Step 11: Wire `I18nProvider` into `src/app/providers.tsx`**

Add the import and nest it inside `ThemeProvider`:

```tsx
import { I18nProvider } from '@/shared/i18n/I18nProvider';
```

Change the `ThemeProvider` body to:

```tsx
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
```

- [ ] **Step 12: Verify build, typecheck, tests**

Run: `npm run build && npm run typecheck && npm test`
Expected: all exit 0.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Add i18n: react-i18next, 61 locales, RTL direction handling"
```

---

## Task 11: Router skeleton

**Files:**
- Create: `src/pages/MainPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/NotFoundPage.tsx`, `src/app/router.tsx`
- Test: `src/app/__tests__/router.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create placeholder pages**

`src/pages/MainPage.tsx`:

```tsx
export default function MainPage() {
  return <div className="p-row">Main page</div>;
}
```

`src/pages/LoginPage.tsx`:

```tsx
export default function LoginPage() {
  return <div className="p-row">Login page</div>;
}
```

`src/pages/NotFoundPage.tsx`:

```tsx
export default function NotFoundPage() {
  return <div className="p-row">Page not found</div>;
}
```

- [ ] **Step 2: Create `src/app/router.tsx`**

Routes are lazy-loaded so each page becomes its own chunk. Later subsystems extend `children`.

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Loader } from '@/shared/ui/Loader';

function lazyRoute(loader: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

const routes: RouteObject[] = [
  { path: '/', element: lazyRoute(() => import('@/pages/MainPage')) },
  { path: '/login', element: lazyRoute(() => import('@/pages/LoginPage')) },
  { path: '*', element: lazyRoute(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
```

- [ ] **Step 3: Update `src/app/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
```

- [ ] **Step 4: Write the test — `src/app/__tests__/router.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

describe('router', () => {
  it('renders the login page at /login', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/login',
          element: (
            <Suspense fallback="loading">
              {(() => {
                const C = lazy(() => import('@/pages/LoginPage'));
                return <C />;
              })()}
            </Suspense>
          ),
        },
      ],
      { initialEntries: ['/login'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run src/app`
Expected: PASS.

- [ ] **Step 6: Verify build and typecheck**

Run: `npm run build && npm run typecheck`
Expected: both exit 0; build output shows separate page chunks.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add React Router skeleton with lazy-loaded pages"
```

---

## Task 12: Shared `<DataTable>` on TanStack Table

**Files:**
- Create: `src/shared/ui/data-table/DataTable.tsx`
- Test: `src/shared/ui/data-table/__tests__/DataTable.test.tsx`

- [ ] **Step 1: Write the failing test — `__tests__/DataTable.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';

interface Row {
  name: string;
  status: string;
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

const data: Row[] = [
  { name: 'Truck B', status: 'online' },
  { name: 'Truck A', status: 'offline' },
];

describe('DataTable', () => {
  it('renders headers and every row', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Truck A')).toBeInTheDocument();
    expect(screen.getByText('Truck B')).toBeInTheDocument();
  });

  it('sorts by a column when its header is clicked', async () => {
    render(<DataTable columns={columns} data={data} />);
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Truck A');
  });

  it('renders an empty state when there are no rows', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/shared/ui/data-table`
Expected: FAIL — cannot resolve `../DataTable`.

- [ ] **Step 3: Implement `src/shared/ui/data-table/DataTable.tsx`**

```tsx
import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return <div className="p-row text-muted-foreground">No data</div>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id} className="border-b border-border">
            {group.headers.map((header) => (
              <th key={header.id} className="px-row py-row text-left font-medium">
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </button>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b border-border">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-row py-row">
                {flexRender(cell.column.columnDef.cell ?? cell.column.columnDef.header, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/shared/ui/data-table`
Expected: PASS — all three DataTable tests pass.

- [ ] **Step 5: Verify lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add shared DataTable component on TanStack Table"
```

> **Note:** Row virtualization (`@tanstack/react-virtual`) is layered onto `DataTable` in the Reports subsystem plan, where large datasets first appear. The dependency is already installed.

---

## Task 13: Playwright E2E setup

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

Playwright builds and serves the app itself; no backend is required for the smoke test.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npx vite preview --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 3: Add the E2E script to `package.json`**

```json
    "e2e": "playwright test"
```

- [ ] **Step 4: Ignore Playwright artifacts — append to `.gitignore`**

```
/test-results
/playwright-report
```

- [ ] **Step 5: Write the smoke test — `e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('app shell loads and routes to the main page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Main page')).toBeVisible();
});

test('unknown routes render the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByText('Page not found')).toBeVisible();
});
```

- [ ] **Step 6: Run the E2E suite**

Run: `npm run e2e`
Expected: PASS — 2 tests passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Playwright E2E setup and shell smoke test"
```

---

## Task 14: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [master, rewrite/modern-frontend]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2: Verify the full gate locally**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`
Expected: every command exits 0.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Add CI workflow: lint, typecheck, unit and e2e tests"
```

---

## Self-Review

**Spec coverage** (against `2026-05-20-traccar-web-modern-rewrite-design.md`):

- §3 Stack — React 19/TS (T1), Vite (T1), Tailwind v4 + shadcn (T2, T6), TanStack Query (T8), Zustand (T5 store), React Router v7 (T11), TanStack Table (T12), Vitest + Testing Library (T4), Playwright (T13), ESLint with `exhaustive-deps` on (T3), typed API client from `openapi.yaml` (T9). ✅
- §4 Architecture — `app / pages / features / entities / shared / map` layout established; `import-x/no-cycle` enforces boundaries (T3). `features/`, `entities/`, `map/` are created on demand by later plans. ✅
- §5 Data flow — Query client (T8); Zustand base (T5). WebSocket/live store is the Map subsystem plan. ✅
- §6 Constraints — `index.html` placeholders preserved (T1); i18n 61 locales migrated (T10). NativeInterface bridge is the Auth subsystem plan. ✅
- §7 Theming & i18n — light/dark/system theme (T2, T5); RTL via `dir` + logical handling (T10). ✅
- §8 `<DataTable>` (T12). §9 Performance — route code splitting (T11). ✅
- §10 Testing — unit/component (T4–T12), E2E (T13), CI gate (T14). ✅

**Out of Foundation scope (later plans):** NativeInterface bridge, auth flows, MapLibre subsystem, live-position store, settings/report pages, DataTable virtualization, PWA re-integration, removal of obsolete legacy dependencies.

**Placeholder scan:** No TBD/TODO; every code step contains complete content. ✅

**Type consistency:** `ThemeMode`/`ResolvedTheme` (T5) reused consistently; `createQueryClient` (T8), `apiClient` (T9), `i18n`/`i18nReady` (T10), `router` (T11), `DataTable` (T12) names are consistent across tasks and provider wiring. ✅

---

## Execution Handoff

See the parent process for the chosen execution approach.
