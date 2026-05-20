---
name: frontend-verify
description: Run the traccar-web verification (ESLint flat config + Vite build) and report failures concisely. Use before committing, before opening a PR, or when the user asks "does the frontend lint / build / verify".
---

# frontend-verify

Run the verification gate for the traccar-web frontend and surface failures concisely.

## Commands

```
npm run lint
npm run build
```

`npm run lint` is the CI gate (`.github/workflows/lint.yml` runs only this). `npm run build` is not in CI but catches issues lint misses (missing imports under tree-shaking, asset-resolution failures, etc.). Run both for full verification; lint alone if the user is iterating fast.

There is **no test runner** in this project. Don't run `npm test` or claim test results — there are none. If a future commit adds tests, update this skill.

Run from `/opt/traccar/traccar-web`. If your cwd is elsewhere, `cd` there first or invoke npm with `--prefix /opt/traccar/traccar-web` — don't try to set up the project anywhere else.

## Reporting

After the run, output:

- **PASS** — one line: "Frontend green: lint + build clean."
- **FAIL** — show:
  - Which stage failed (lint / build).
  - For lint failures: file:line:column and the rule name verbatim. ESLint output looks like `src/foo/Bar.jsx:42:12  error  Unexpected value  @eslint-react/no-array-index-key`. Show the first 3-5 and a count if more.
  - For build failures: the Rollup/Vite error verbatim (typically "Failed to resolve import", "Could not load", or syntax errors). Include the originating file.
  - Don't dump the whole npm output. ESLint summaries (`✖ 7 problems (3 errors, 4 warnings)`) are useful — paste those.

Keep the report under ~20 lines.

## Common quick re-runs

These are for tight iteration loops on a known violation. The pre-commit / pre-PR gate is the pair above — these alone don't substitute for verification.

- Auto-fix lint + Prettier: `npm run lint:fix`. Re-run `npm run lint` after to confirm clean.
- Lint a single file: `npx eslint src/path/to/file.jsx`.
- Production build only: `npm run build`.

## Gotchas

- The dev server (`npm run start`) needs the Java backend on `:8082`. Don't try to "verify" by starting the dev server — that's for interactive work, not the gate.
- `npm install` first if `node_modules/` is missing or `package-lock.json` changed. Use `npm ci` for clean reproducible installs (matches CI).
- `legacy-peer-deps=true` is set in `.npmrc`; a "successful" `npm install` after a major bump might be masking a peer-dep break. If lint or build fail after a dependency change, suspect this first.
- Build emits the `${colorPrimary}`/`${title}` placeholders literally in the manifest — that's correct, not a build failure. The Java backend substitutes them at request time.
