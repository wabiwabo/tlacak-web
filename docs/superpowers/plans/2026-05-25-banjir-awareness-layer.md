# Banjir Awareness Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 5th Compliance Co-Pilot module — a real-time flood-awareness layer for Indonesian dispatchers — by overlaying PetaBencana.id reports + BMKG nowcast warnings on the MainPage map and the Compliance Brief.

**Architecture:** Pure browser-side. Three TanStack Query polls (PetaBencana `/reports` 3 min, PetaBencana `/floods` 5 min, BMKG nowcast RSS 10 min) feed a normalized `FloodFeature[]` shape. A `MapBanjir` MapLibre layer renders polygons + points; a `BanjirPanel` slots into Compliance Brief; a `/compliance/banjir` page hosts the full module. No backend changes. No new ops surface.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, MapLibre GL 5.x, `@turf/boolean-point-in-polygon` + `@turf/buffer` (new deps), vitest, i18next, Cyber Ops design tokens, feature-sliced design.

**Spec:** `docs/superpowers/specs/2026-05-25-banjir-awareness-layer-design.md`

**Working directory:** `/opt/tlacak-web` (branch `rewrite/modern-frontend`)

---

## Project conventions (read first)

- **Working directory** is `/opt/tlacak-web`, not `/opt/traccar`. The Traccar Java backend is at `/opt/traccar` and is a sibling; this is the standalone modern frontend rewrite.
- **TDD always.** Tests before implementation. One commit per task is NOT the convention — the project commits each Compliance module as ONE atomic commit at the end. Stage everything, commit once in the final task.
- **Pure libs go in `src/features/<feature>/lib/<name>.ts`** with tests at `src/features/<feature>/lib/__tests__/<name>.test.ts`. Hooks (with React imports) share the `lib/` folder. UI components are in `src/features/<feature>/ui/`. Page components are in `src/pages/<area>/<Name>Page.tsx`.
- **Date formatting** uses dayjs (already a dep).
- **Style tokens** are Cyber Ops: `font-mono`, `cyber-label`, `cyber-glow`, `depth-elevated-shallow/tall/recessed-shallow`, `text-[var(--color-warning)]`, `text-destructive cyber-glow-alert`, `text-primary`, `bg-card/40`, `border-border`, etc. See `src/pages/compliance/KirPage.tsx` for the template.
- **Map layer pattern:** import the singleton `map` from `src/map/core/map-instance`, `useEffect` to add source + layers in mount, `useEffect` to push data on change, cleanup on unmount with `map.getLayer(id)` / `map.getSource(id)` existence guards. See `src/map/layers/MapGeofence.tsx`.
- **TanStack Query hook pattern:** `useQuery({ queryKey, queryFn, staleTime, refetchInterval })`. See `src/entities/device/api/queries.ts`.
- **No emojis in code or commits** unless explicitly requested.
- **Run commands from `/opt/tlacak-web`.** Use `cd /opt/tlacak-web && <cmd>` since the shell cwd resets.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/features/banjir/lib/petabencana.ts` | Pure normalizer for PetaBencana `/reports` + `/floods` GeoJSON → `FloodFeature[]`. Severity classifier. |
| `src/features/banjir/lib/bmkg-nowcast.ts` | Pure parser for BMKG nowcast RSS index + CAP XML detail. Filters flood-related items, extracts polygons. |
| `src/features/banjir/lib/types.ts` | Shared `FloodFeature`, `FloodSnapshot`, `FloodSeverity`, `FloodKind` types. |
| `src/features/banjir/lib/use-flood-data.ts` | Three independent `useQuery`s; merges into `FloodSnapshot`. |
| `src/features/banjir/lib/use-exposed-vehicles.ts` | Joins live `useLiveStore.positions` × flood polygons via turf point-in-polygon + 2 km buffer. |
| `src/features/banjir/lib/__tests__/petabencana.test.ts` | ~10 unit tests for the parser. |
| `src/features/banjir/lib/__tests__/bmkg-nowcast.test.ts` | ~8 unit tests for the RSS + CAP parser. |
| `src/features/banjir/lib/__tests__/use-exposed-vehicles.test.ts` | ~6 unit tests for the join. |
| `src/features/banjir/lib/__tests__/use-flood-data.test.tsx` | ~3 mocked-fetch tests for hook composition + stale flag. |
| `src/features/banjir/ui/BanjirPanel.tsx` | Compliance Brief slot. |
| `src/features/banjir/index.ts` | Public barrel export. |
| `src/map/layers/MapBanjir.tsx` | MapLibre source + 4 style layers (confirmed polygons, warning polygons, reports, hover). |
| `src/pages/compliance/BanjirPage.tsx` | `/compliance/banjir` module page — hero tiles + map + reports table. |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Add `@turf/boolean-point-in-polygon` and `@turf/buffer`. |
| `src/app/router.tsx` | Add `/compliance/banjir` route, lazy-imported. |
| `src/features/compliance/ui/ComplianceLayout.tsx` | Add 6th nav entry. |
| `src/features/main/MainMap.tsx` | Render `<MapBanjir />` inside `<MapView>`. |
| `src/pages/compliance/ComplianceBriefPage.tsx` | Insert `<BanjirPanel />`. Reflow grid to `lg:grid-cols-2 xl:grid-cols-3`. Drop `briefBanjirTitle`/`briefBanjirDesc` from UpcomingPanel. |
| `src/shared/i18n/locales/en.json` | +25 keys. Remove `briefBanjirTitle`, `briefBanjirDesc`. |
| `src/shared/i18n/locales/id.json` | +25 keys. Remove `briefBanjirTitle`, `briefBanjirDesc`. |

---

## Task 1: Install turf dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

We pick individual sub-packages (matching the existing `@turf/circle@^7.3.5` convention) rather than the umbrella `@turf/turf` to keep the bundle slim. We need three: point-in-polygon for polygon hits, helpers for the `point()` constructor in tests + the hook, and distance for the 2 km buffer check.

- [ ] **Step 1: Install the turf modules**

Run: `cd /opt/tlacak-web && npm install --save @turf/boolean-point-in-polygon@^7.3.5 @turf/helpers@^7.3.5 @turf/distance@^7.3.5`
Expected: clean install, no peer warnings beyond the pre-existing ones.

- [ ] **Step 2: Verify version pinning**

Run: `cd /opt/tlacak-web && grep -E '@turf/(boolean-point-in-polygon|helpers|distance)' package.json`
Expected: all three packages present with `^7.3.5` to match the already-present `@turf/circle@^7.3.5`.

---

## Task 2: PetaBencana parser (lib + tests, TDD)

**Files:**
- Create: `src/features/banjir/lib/types.ts`
- Create: `src/features/banjir/lib/petabencana.ts`
- Create: `src/features/banjir/lib/__tests__/petabencana.test.ts`

- [ ] **Step 1: Create the shared types module**

Create `src/features/banjir/lib/types.ts` with this exact content:

```ts
import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';

export type FloodSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';
export type FloodKind = 'report' | 'polygon' | 'warning';
export type FloodSource = 'petabencana' | 'bmkg';

export interface FloodFeature {
  /** Stable across refreshes — uses upstream PK when available. */
  id: string;
  kind: FloodKind;
  severity: FloodSeverity;
  geometry: Geometry;
  /** Reported water depth in centimetres. Only on `kind: 'report'`. */
  depthCm: number | null;
  /** ISO 8601. */
  reportedAt: string;
  source: FloodSource;
  /** Verbatim string rendered in the attribution footer. */
  attribution: string;
  /** Free-form upstream fields preserved for the hover tooltip. */
  meta?: Record<string, unknown>;
}

export interface FloodSnapshot {
  features: FloodFeature[];
  bySource: Record<FloodSource, FloodFeature[]>;
  bySeverity: Record<FloodSeverity, number>;
  /** ISO 8601 of the most recent successful fetch across the three sources. */
  updatedAt: string;
  /** True when no source has refreshed within 2× its expected interval. */
  stale: boolean;
}

/** Re-export the GeoJSON aliases the parsers need without forcing each
 *  consumer to import from 'geojson' directly. */
export type { Feature, FeatureCollection, Geometry, Point };
```

- [ ] **Step 2: Write the failing tests**

Create `src/features/banjir/lib/__tests__/petabencana.test.ts` with this exact content:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeReports, normalizeFloods, PETABENCANA_ATTRIBUTION } from '../petabencana';

const NOW = new Date('2026-05-24T12:00:00Z');

const REPORT_FEATURE = {
  type: 'Feature' as const,
  properties: {
    pkey: 'r-123',
    disaster_type: 'flood',
    created_at: '2026-05-24T11:30:00Z',
    report_data: { flood_depth: 80 },
    text: 'Air sebetis di depan kantor',
  },
  geometry: { type: 'Point' as const, coordinates: [106.8456, -6.2088] },
};

const NON_FLOOD_FEATURE = {
  ...REPORT_FEATURE,
  properties: { ...REPORT_FEATURE.properties, pkey: 'r-124', disaster_type: 'haze' },
};

const POLYGON_FEATURE = {
  type: 'Feature' as const,
  properties: {
    area_id: 3171010001,
    parent_name: 'Jakarta Pusat',
    area_name: 'Gambir',
    state: 3,
    last_updated: '2026-05-24T11:45:00Z',
  },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[[106.82, -6.18], [106.83, -6.18], [106.83, -6.17], [106.82, -6.17], [106.82, -6.18]]],
  },
};

describe('normalizeReports', () => {
  it('returns an empty array for an empty FeatureCollection', () => {
    expect(normalizeReports({ type: 'FeatureCollection', features: [] })).toEqual([]);
  });

  it('drops non-flood disaster types', () => {
    const out = normalizeReports({ type: 'FeatureCollection', features: [NON_FLOOD_FEATURE] });
    expect(out).toEqual([]);
  });

  it('maps a flood point report to a FloodFeature', () => {
    const [feature] = normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] });
    expect(feature).toMatchObject({
      id: 'r-123',
      kind: 'report',
      source: 'petabencana',
      depthCm: 80,
      reportedAt: '2026-05-24T11:30:00Z',
      attribution: PETABENCANA_ATTRIBUTION,
    });
    expect(feature.geometry).toEqual(REPORT_FEATURE.geometry);
  });

  it('classifies depth-based severity (≤30 minor, ≤70 moderate, ≤150 severe, >150 extreme)', () => {
    const at = (depth: number) =>
      normalizeReports({
        type: 'FeatureCollection',
        features: [{ ...REPORT_FEATURE, properties: { ...REPORT_FEATURE.properties, pkey: `r-${depth}`, report_data: { flood_depth: depth } } }],
      })[0]!.severity;
    expect(at(10)).toBe('minor');
    expect(at(30)).toBe('minor');
    expect(at(31)).toBe('moderate');
    expect(at(70)).toBe('moderate');
    expect(at(71)).toBe('severe');
    expect(at(150)).toBe('severe');
    expect(at(151)).toBe('extreme');
    expect(at(400)).toBe('extreme');
  });

  it('returns null depthCm + minor severity when flood_depth is missing', () => {
    const [feature] = normalizeReports({
      type: 'FeatureCollection',
      features: [{ ...REPORT_FEATURE, properties: { ...REPORT_FEATURE.properties, report_data: {} } }],
    });
    expect(feature.depthCm).toBeNull();
    expect(feature.severity).toBe('minor');
  });

  it('skips features whose geometry is missing or malformed', () => {
    const malformed = { ...REPORT_FEATURE, geometry: null as unknown as typeof REPORT_FEATURE.geometry };
    const out = normalizeReports({ type: 'FeatureCollection', features: [malformed, REPORT_FEATURE] });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe('r-123');
  });

  it('preserves the raw report text in meta for the hover tooltip', () => {
    const [feature] = normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] });
    expect(feature.meta?.text).toBe('Air sebetis di depan kantor');
  });

  it('treats `now` as injectable so we can compute age-based filters later', () => {
    // Sanity: function takes a `now` parameter; we don't filter on it yet
    // but the signature must accept it so future "drop stale" logic doesn't
    // require an API break.
    expect(normalizeReports({ type: 'FeatureCollection', features: [REPORT_FEATURE] }, NOW)).toHaveLength(1);
  });
});

describe('normalizeFloods', () => {
  it('maps a Jakarta kelurahan polygon to a FloodFeature', () => {
    const [feature] = normalizeFloods({ type: 'FeatureCollection', features: [POLYGON_FEATURE] });
    expect(feature).toMatchObject({
      id: 'p-3171010001',
      kind: 'polygon',
      severity: 'severe',
      source: 'petabencana',
      depthCm: null,
      reportedAt: '2026-05-24T11:45:00Z',
    });
    expect(feature.geometry).toEqual(POLYGON_FEATURE.geometry);
    expect(feature.meta?.kelurahan).toBe('Gambir');
  });

  it('classifies state 1-4 → minor/moderate/severe/extreme', () => {
    const stateOf = (state: number) =>
      normalizeFloods({
        type: 'FeatureCollection',
        features: [{ ...POLYGON_FEATURE, properties: { ...POLYGON_FEATURE.properties, area_id: state, state } }],
      })[0]!.severity;
    expect(stateOf(1)).toBe('minor');
    expect(stateOf(2)).toBe('moderate');
    expect(stateOf(3)).toBe('severe');
    expect(stateOf(4)).toBe('extreme');
  });

  it('skips polygons with unknown state', () => {
    const [feature] = normalizeFloods({
      type: 'FeatureCollection',
      features: [{ ...POLYGON_FEATURE, properties: { ...POLYGON_FEATURE.properties, state: 99 } }],
    });
    expect(feature).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/petabencana.test.ts`
Expected: FAIL — "Failed to resolve import '../petabencana'".

- [ ] **Step 4: Implement the parser**

Create `src/features/banjir/lib/petabencana.ts` with this exact content:

```ts
/**
 * PetaBencana.id GeoJSON normalizers.
 *
 * /reports?disaster=flood&geoformat=geojson — national point reports
 *   with operator-supplied flood_depth (cm). 3-hour default window.
 * /floods?admin=ID-JK&minimum_state=2&geoformat=geojson — Jakarta
 *   kelurahan polygons with a 1-4 severity state.
 *
 * Both feeds collapse into the shared FloodFeature shape. Pure functions
 * — no fetch, no time reads except via the injected `now` parameter.
 *
 * Verified live 2026-05-24 with CORS open (access-control-allow-origin: *).
 * License: CC-BY-style attribution — render PETABENCANA_ATTRIBUTION verbatim.
 */

import type { Feature, FeatureCollection, FloodFeature, FloodSeverity } from './types';

export const PETABENCANA_ATTRIBUTION = 'PetaBencana.id (CC-BY)';

const REPORT_SEVERITY_THRESHOLDS: [number, FloodSeverity][] = [
  [30, 'minor'],
  [70, 'moderate'],
  [150, 'severe'],
];

const STATE_SEVERITY: Record<number, FloodSeverity> = {
  1: 'minor',
  2: 'moderate',
  3: 'severe',
  4: 'extreme',
};

function classifyDepth(depthCm: number | null): FloodSeverity {
  if (depthCm === null) return 'minor';
  for (const [cap, severity] of REPORT_SEVERITY_THRESHOLDS) {
    if (depthCm <= cap) return severity;
  }
  return 'extreme';
}

function isFeature(value: unknown): value is Feature {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'Feature'
  );
}

interface ReportProps {
  pkey?: string | number;
  disaster_type?: string;
  created_at?: string;
  report_data?: { flood_depth?: number };
  text?: string;
  [key: string]: unknown;
}

interface FloodPolygonProps {
  area_id?: string | number;
  area_name?: string;
  parent_name?: string;
  state?: number;
  last_updated?: string;
  [key: string]: unknown;
}

/** Map PetaBencana /reports → FloodFeature[]. `now` is reserved for
 *  future age-based filtering (e.g. dropping reports older than 6 h)
 *  and is currently unused. */
export function normalizeReports(
  fc: FeatureCollection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  now: Date = new Date(),
): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of fc.features) {
    if (!isFeature(feature) || !feature.geometry) continue;
    const props = (feature.properties ?? {}) as ReportProps;
    if (props.disaster_type !== 'flood') continue;
    const id = props.pkey !== undefined ? `r-${String(props.pkey)}` : `r-${out.length}`;
    const depthRaw = props.report_data?.flood_depth;
    const depthCm =
      typeof depthRaw === 'number' && Number.isFinite(depthRaw) ? depthRaw : null;
    out.push({
      id,
      kind: 'report',
      severity: classifyDepth(depthCm),
      geometry: feature.geometry,
      depthCm,
      reportedAt: props.created_at ?? new Date(0).toISOString(),
      source: 'petabencana',
      attribution: PETABENCANA_ATTRIBUTION,
      meta: { text: props.text },
    });
  }
  return out;
}

/** Map PetaBencana /floods (Jakarta polygons) → FloodFeature[]. */
export function normalizeFloods(fc: FeatureCollection): FloodFeature[] {
  const out: FloodFeature[] = [];
  for (const feature of fc.features) {
    if (!isFeature(feature) || !feature.geometry) continue;
    const props = (feature.properties ?? {}) as FloodPolygonProps;
    const state = typeof props.state === 'number' ? props.state : 0;
    const severity = STATE_SEVERITY[state];
    if (!severity) continue;
    out.push({
      id: `p-${String(props.area_id ?? out.length)}`,
      kind: 'polygon',
      severity,
      geometry: feature.geometry,
      depthCm: null,
      reportedAt: props.last_updated ?? new Date(0).toISOString(),
      source: 'petabencana',
      attribution: PETABENCANA_ATTRIBUTION,
      meta: { kelurahan: props.area_name, kota: props.parent_name, state },
    });
  }
  return out;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/petabencana.test.ts`
Expected: PASS — 11 tests passing.

---

## Task 3: BMKG nowcast parser (lib + tests, TDD)

**Files:**
- Create: `src/features/banjir/lib/bmkg-nowcast.ts`
- Create: `src/features/banjir/lib/__tests__/bmkg-nowcast.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/banjir/lib/__tests__/bmkg-nowcast.test.ts` with this exact content:

```ts
import { describe, expect, it } from 'vitest';
import {
  parseNowcastIndex,
  parseCapAlert,
  BMKG_ATTRIBUTION,
} from '../bmkg-nowcast';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BMKG Nowcast</title>
    <item>
      <title>Peringatan Dini Cuaca Banjir DKI Jakarta</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/3171_alert.xml</link>
      <pubDate>Sun, 24 May 2026 11:00:00 +0000</pubDate>
      <guid>3171-2026-05-24T11</guid>
    </item>
    <item>
      <title>Gempa M 4.5 Sumba</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/53-eq.xml</link>
      <pubDate>Sun, 24 May 2026 10:00:00 +0000</pubDate>
      <guid>53-eq</guid>
    </item>
    <item>
      <title>Hujan Lebat Potensi Genangan Bandung</title>
      <link>https://www.bmkg.go.id/alerts/nowcast/3273_alert.xml</link>
      <pubDate>Sun, 24 May 2026 10:30:00 +0000</pubDate>
      <guid>3273-2026-05-24T10</guid>
    </item>
  </channel>
</rss>`;

const CAP_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>3171-2026-05-24T11</identifier>
  <sent>2026-05-24T11:00:00+00:00</sent>
  <info>
    <category>Met</category>
    <event>Banjir</event>
    <severity>Severe</severity>
    <headline>Peringatan banjir Jakarta Pusat</headline>
    <parameter><valueName>banjir</valueName><value>true</value></parameter>
    <area>
      <areaDesc>Jakarta Pusat</areaDesc>
      <polygon>-6.18,106.82 -6.18,106.83 -6.17,106.83 -6.17,106.82 -6.18,106.82</polygon>
    </area>
  </info>
</alert>`;

describe('parseNowcastIndex', () => {
  it('returns flood-related items only and drops earthquakes', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id).sort()).toEqual(['3171-2026-05-24T11', '3273-2026-05-24T10']);
  });

  it('extracts the CAP detail URL from each item link', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items[0].url).toMatch(/3171_alert\.xml$/);
  });

  it('parses pubDate to ISO', () => {
    const items = parseNowcastIndex(RSS_SAMPLE);
    expect(items[0].publishedAt).toBe('2026-05-24T11:00:00.000Z');
  });

  it('returns an empty array when the RSS body is empty or malformed', () => {
    expect(parseNowcastIndex('')).toEqual([]);
    expect(parseNowcastIndex('<not xml')).toEqual([]);
  });

  it('treats title keywords "banjir" and "genangan" (case-insensitive) as flood-related', () => {
    expect(parseNowcastIndex(RSS_SAMPLE).map((i) => i.title)).toEqual(
      expect.arrayContaining([
        'Peringatan Dini Cuaca Banjir DKI Jakarta',
        'Hujan Lebat Potensi Genangan Bandung',
      ]),
    );
  });
});

describe('parseCapAlert', () => {
  it('maps a flood CAP alert into a FloodFeature', () => {
    const feature = parseCapAlert(CAP_SAMPLE);
    expect(feature).toMatchObject({
      id: 'b-3171-2026-05-24T11',
      kind: 'warning',
      severity: 'severe',
      source: 'bmkg',
      depthCm: null,
      reportedAt: '2026-05-24T11:00:00.000Z',
      attribution: BMKG_ATTRIBUTION,
    });
    expect(feature?.geometry.type).toBe('Polygon');
    expect((feature?.geometry as { coordinates: number[][][] }).coordinates[0]).toEqual([
      [106.82, -6.18],
      [106.83, -6.18],
      [106.83, -6.17],
      [106.82, -6.17],
      [106.82, -6.18],
    ]);
  });

  it('returns null when the CAP polygon is missing', () => {
    const noPolygon = CAP_SAMPLE.replace(/<polygon>.*?<\/polygon>/, '');
    expect(parseCapAlert(noPolygon)).toBeNull();
  });

  it('maps CAP severity Minor/Moderate/Severe/Extreme', () => {
    const at = (s: string) =>
      parseCapAlert(CAP_SAMPLE.replace('<severity>Severe</severity>', `<severity>${s}</severity>`))!
        .severity;
    expect(at('Minor')).toBe('minor');
    expect(at('Moderate')).toBe('moderate');
    expect(at('Severe')).toBe('severe');
    expect(at('Extreme')).toBe('extreme');
  });

  it('returns null when the CAP body is unparseable', () => {
    expect(parseCapAlert('garbage')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/bmkg-nowcast.test.ts`
Expected: FAIL — "Failed to resolve import '../bmkg-nowcast'".

- [ ] **Step 3: Implement the parser**

Create `src/features/banjir/lib/bmkg-nowcast.ts` with this exact content:

```ts
/**
 * BMKG nowcast RSS + CAP XML parsers.
 *
 * Index URL:   https://www.bmkg.go.id/alerts/nowcast/id
 * Detail URLs: each <item><link> in the RSS points to a CAP 1.2 XML file
 *              like https://www.bmkg.go.id/alerts/nowcast/<area>_alert.xml.
 *
 * We treat an item as flood-related when its title contains the
 * keywords "banjir" or "genangan" (case-insensitive). The CAP detail
 * supplies the polygon and a CAP severity that maps directly to our
 * FloodSeverity enum.
 *
 * Pure parsers — fetching is the hook's responsibility. We use the
 * browser DOMParser; in jsdom (vitest env: jsdom) the same API is
 * available so the parsers run unchanged under test.
 *
 * Attribution: public domain with mandatory BMKG attribution.
 * Verified live 2026-05-24 with CORS open.
 */

import type { FloodFeature, FloodSeverity, Geometry } from './types';

export const BMKG_ATTRIBUTION = 'BMKG (Public Domain)';

const FLOOD_TITLE_RE = /banjir|genangan/i;

const SEVERITY_MAP: Record<string, FloodSeverity> = {
  minor: 'minor',
  moderate: 'moderate',
  severe: 'severe',
  extreme: 'extreme',
};

export interface NowcastIndexItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
}

function safeParseXml(body: string, mime: 'application/xml' | 'text/xml'): Document | null {
  if (!body) return null;
  try {
    const doc = new DOMParser().parseFromString(body, mime);
    // DOMParser surfaces parse errors as a <parsererror> child rather than
    // throwing — detect and treat as failure.
    if (doc.getElementsByTagName('parsererror').length > 0) return null;
    return doc;
  } catch {
    return null;
  }
}

function textOf(parent: Element | Document, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

/** Parse the RSS index. Returns only items whose title looks flood-related. */
export function parseNowcastIndex(rss: string): NowcastIndexItem[] {
  const doc = safeParseXml(rss, 'application/xml');
  if (!doc) return [];
  const items: NowcastIndexItem[] = [];
  const nodes = Array.from(doc.getElementsByTagName('item'));
  for (const node of nodes) {
    const title = textOf(node, 'title');
    if (!FLOOD_TITLE_RE.test(title)) continue;
    const url = textOf(node, 'link');
    const guid = textOf(node, 'guid');
    const pubDate = textOf(node, 'pubDate');
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    items.push({
      id: guid || url,
      title,
      url,
      publishedAt,
    });
  }
  return items;
}

/** Parse one CAP XML alert. Returns null when no polygon is present or
 *  the body is unparseable. */
export function parseCapAlert(cap: string): FloodFeature | null {
  const doc = safeParseXml(cap, 'text/xml');
  if (!doc) return null;
  const alert = doc.getElementsByTagName('alert')[0];
  if (!alert) return null;
  const identifier = textOf(alert, 'identifier') || `bmkg-${Date.now()}`;
  const sent = textOf(alert, 'sent');
  const info = alert.getElementsByTagName('info')[0];
  const severityRaw = textOf(info ?? alert, 'severity').toLowerCase();
  const severity = SEVERITY_MAP[severityRaw] ?? 'moderate';
  const polygonRaw = info?.getElementsByTagName('polygon')[0]?.textContent?.trim();
  if (!polygonRaw) return null;
  const coords = polygonRaw
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((p) => p.length === 2 && Number.isFinite(p[0]!) && Number.isFinite(p[1]!))
    // CAP polygon is "lat,lng"; GeoJSON wants [lng, lat]
    .map(([lat, lng]) => [lng!, lat!] as [number, number]);
  if (coords.length < 4) return null;
  const geometry: Geometry = { type: 'Polygon', coordinates: [coords] };
  return {
    id: `b-${identifier}`,
    kind: 'warning',
    severity,
    geometry,
    depthCm: null,
    reportedAt: sent ? new Date(sent).toISOString() : new Date().toISOString(),
    source: 'bmkg',
    attribution: BMKG_ATTRIBUTION,
    meta: {
      headline: textOf(info ?? alert, 'headline'),
      event: textOf(info ?? alert, 'event'),
      areaDesc: info?.getElementsByTagName('areaDesc')[0]?.textContent?.trim(),
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/bmkg-nowcast.test.ts`
Expected: PASS — 9 tests passing.

---

## Task 4: useFloodData hook (TanStack Query composition, TDD)

**Files:**
- Create: `src/features/banjir/lib/use-flood-data.ts`
- Create: `src/features/banjir/lib/__tests__/use-flood-data.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/banjir/lib/__tests__/use-flood-data.test.tsx` with this exact content:

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFloodData } from '../use-flood-data';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SAMPLE_REPORT = {
  type: 'Feature',
  properties: {
    pkey: 1,
    disaster_type: 'flood',
    created_at: '2026-05-24T11:30:00Z',
    report_data: { flood_depth: 80 },
  },
  geometry: { type: 'Point', coordinates: [106.8, -6.2] },
};

const SAMPLE_POLYGON = {
  type: 'Feature',
  properties: { area_id: 1, state: 2, last_updated: '2026-05-24T11:00:00Z' },
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
  },
};

const SAMPLE_RSS = `<?xml version="1.0"?><rss><channel></channel></rss>`;

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

function textResponse(body: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => body,
  } as Response;
}

afterEach(() => vi.restoreAllMocks());

describe('useFloodData', () => {
  it('composes reports + floods + nowcast into a single FloodSnapshot', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/reports')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_REPORT] });
      }
      if (url.includes('/floods')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_POLYGON] });
      }
      if (url.includes('nowcast')) {
        return textResponse(SAMPLE_RSS);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const { result } = renderHook(() => useFloodData(), { wrapper });
    await waitFor(() => expect(result.current.snapshot.features.length).toBeGreaterThan(0));

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.current.snapshot.bySource.petabencana).toHaveLength(2);
    expect(result.current.snapshot.bySource.bmkg).toHaveLength(0);
    expect(result.current.snapshot.bySeverity.moderate).toBe(1);
    expect(result.current.snapshot.bySeverity.severe).toBe(1);
  });

  it('keeps data from healthy sources when one source fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/reports')) {
        throw new Error('petabencana down');
      }
      if (url.includes('/floods')) {
        return jsonResponse({ type: 'FeatureCollection', features: [SAMPLE_POLYGON] });
      }
      return textResponse(SAMPLE_RSS);
    });

    const { result } = renderHook(() => useFloodData(), { wrapper });
    await waitFor(() =>
      expect(result.current.snapshot.bySource.petabencana.length).toBeGreaterThan(0),
    );
    expect(result.current.snapshot.bySource.petabencana).toHaveLength(1);
    expect(result.current.reportsError).toBeTruthy();
    expect(result.current.floodsError).toBeFalsy();
  });

  it('marks the snapshot stale when no source has refreshed in 2× its interval', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ type: 'FeatureCollection', features: [] }),
    );
    const fixedNow = new Date('2030-01-01T00:00:00Z'); // arbitrary far-future timestamp
    const { result } = renderHook(() => useFloodData(fixedNow), { wrapper });
    await waitFor(() => expect(result.current.snapshot.updatedAt).not.toBe(''));
    expect(result.current.snapshot.stale).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/use-flood-data.test.tsx`
Expected: FAIL — "Failed to resolve import '../use-flood-data'".

- [ ] **Step 3: Implement the hook**

Create `src/features/banjir/lib/use-flood-data.ts` with this exact content:

```ts
/**
 * useFloodData — composes three independent flood feeds into a single
 * FloodSnapshot for the map and brief panel.
 *
 *   reportsQuery  — PetaBencana /reports (national, 3 h window) @ 3 min
 *   floodsQuery   — PetaBencana /floods (Jakarta polygons)      @ 5 min
 *   nowcastQuery  — BMKG nowcast RSS index                       @ 10 min
 *
 * Each query is independent — a failing source doesn't kill the others.
 * The composite snapshot exposes per-source slices and a `stale` flag.
 *
 * The hook deliberately keeps the BMKG path lightweight (RSS index only —
 * no per-item CAP fetch on every poll) so the cross-origin chatter stays
 * cheap. The first iteration treats every flood-related RSS item as a
 * single warning marker placed at the lat/lng nothing — the CAP polygon
 * fetch is the future enrichment.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  normalizeReports,
  normalizeFloods,
  PETABENCANA_ATTRIBUTION,
} from './petabencana';
import {
  parseNowcastIndex,
  BMKG_ATTRIBUTION,
  type NowcastIndexItem,
} from './bmkg-nowcast';
import type {
  FloodFeature,
  FloodSeverity,
  FloodSnapshot,
  FloodSource,
} from './types';

const REPORTS_URL =
  'https://api.petabencana.id/reports?disaster=flood&geoformat=geojson&timeperiod=10800';
const FLOODS_URL =
  'https://data.petabencana.id/floods?admin=ID-JK&minimum_state=2&geoformat=geojson';
const NOWCAST_URL = 'https://www.bmkg.go.id/alerts/nowcast/id';

const REPORTS_INTERVAL_MS = 3 * 60 * 1000;
const FLOODS_INTERVAL_MS = 5 * 60 * 1000;
const NOWCAST_INTERVAL_MS = 10 * 60 * 1000;
const STALE_MULTIPLIER = 2;

const EMPTY_SEVERITY: Record<FloodSeverity, number> = {
  minor: 0,
  moderate: 0,
  severe: 0,
  extreme: 0,
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** Render each flood-related RSS item as a marker. Polygons land on a
 *  future enrichment pass that fetches the CAP detail per item. */
function nowcastItemsToFeatures(items: NowcastIndexItem[]): FloodFeature[] {
  return items.map((item) => ({
    id: `b-${item.id}`,
    kind: 'warning' as const,
    severity: 'moderate' as const,
    // BMKG nowcast RSS does not include coordinates — the consumer
    // page surfaces these as a list, not on the map, until the CAP
    // enrichment lands.
    geometry: { type: 'Point', coordinates: [0, 0] },
    depthCm: null,
    reportedAt: item.publishedAt,
    source: 'bmkg' as const,
    attribution: BMKG_ATTRIBUTION,
    meta: { title: item.title, url: item.url },
  }));
}

export interface UseFloodDataReturn {
  snapshot: FloodSnapshot;
  reportsError: unknown;
  floodsError: unknown;
  nowcastError: unknown;
  isLoading: boolean;
  isFetching: boolean;
}

/** `now` is injectable for deterministic stale-flag tests. */
export function useFloodData(now: Date = new Date()): UseFloodDataReturn {
  const reportsQuery = useQuery({
    queryKey: ['banjir', 'reports'],
    queryFn: () => fetchJson(REPORTS_URL),
    staleTime: REPORTS_INTERVAL_MS,
    refetchInterval: REPORTS_INTERVAL_MS,
  });
  const floodsQuery = useQuery({
    queryKey: ['banjir', 'floods'],
    queryFn: () => fetchJson(FLOODS_URL),
    staleTime: FLOODS_INTERVAL_MS,
    refetchInterval: FLOODS_INTERVAL_MS,
  });
  const nowcastQuery = useQuery({
    queryKey: ['banjir', 'nowcast'],
    queryFn: () => fetchText(NOWCAST_URL),
    staleTime: NOWCAST_INTERVAL_MS,
    refetchInterval: NOWCAST_INTERVAL_MS,
  });

  const snapshot = useMemo<FloodSnapshot>(() => {
    const reports = reportsQuery.data
      ? normalizeReports(reportsQuery.data as Parameters<typeof normalizeReports>[0])
      : [];
    const floods = floodsQuery.data
      ? normalizeFloods(floodsQuery.data as Parameters<typeof normalizeFloods>[0])
      : [];
    const nowcast = nowcastQuery.data
      ? nowcastItemsToFeatures(parseNowcastIndex(nowcastQuery.data as string))
      : [];
    const features = [...reports, ...floods, ...nowcast];

    const bySource: Record<FloodSource, FloodFeature[]> = {
      petabencana: [...reports, ...floods],
      bmkg: nowcast,
    };

    const bySeverity = { ...EMPTY_SEVERITY };
    for (const f of features) bySeverity[f.severity] += 1;

    const updates = [
      reportsQuery.dataUpdatedAt,
      floodsQuery.dataUpdatedAt,
      nowcastQuery.dataUpdatedAt,
    ].filter((t) => t > 0);
    const newestMs = updates.length ? Math.max(...updates) : 0;
    const updatedAt = newestMs ? new Date(newestMs).toISOString() : '';

    const intervalMaxMs =
      Math.max(REPORTS_INTERVAL_MS, FLOODS_INTERVAL_MS, NOWCAST_INTERVAL_MS) *
      STALE_MULTIPLIER;
    const stale = newestMs > 0 && now.getTime() - newestMs > intervalMaxMs;

    return { features, bySource, bySeverity, updatedAt, stale };
  }, [
    reportsQuery.data,
    floodsQuery.data,
    nowcastQuery.data,
    reportsQuery.dataUpdatedAt,
    floodsQuery.dataUpdatedAt,
    nowcastQuery.dataUpdatedAt,
    now,
  ]);

  return {
    snapshot,
    reportsError: reportsQuery.error,
    floodsError: floodsQuery.error,
    nowcastError: nowcastQuery.error,
    isLoading: reportsQuery.isLoading || floodsQuery.isLoading || nowcastQuery.isLoading,
    isFetching:
      reportsQuery.isFetching || floodsQuery.isFetching || nowcastQuery.isFetching,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/use-flood-data.test.tsx`
Expected: PASS — 3 tests passing.

---

## Task 5: useExposedVehicles hook (TDD)

**Files:**
- Create: `src/features/banjir/lib/use-exposed-vehicles.ts`
- Create: `src/features/banjir/lib/__tests__/use-exposed-vehicles.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/banjir/lib/__tests__/use-exposed-vehicles.test.ts` with this exact content:

```ts
import { describe, expect, it } from 'vitest';
import { computeExposedVehicles } from '../use-exposed-vehicles';
import type { FloodFeature } from '../types';
import type { Position } from '@/entities/position';

function pos(deviceId: number, lng: number, lat: number): Position {
  return {
    id: deviceId,
    deviceId,
    longitude: lng,
    latitude: lat,
    attributes: {},
  } as unknown as Position;
}

const POLYGON: FloodFeature = {
  id: 'p-1',
  kind: 'polygon',
  severity: 'severe',
  source: 'petabencana',
  depthCm: null,
  reportedAt: '2026-05-24T11:00:00Z',
  attribution: 'PetaBencana.id (CC-BY)',
  geometry: {
    type: 'Polygon',
    coordinates: [[[106.82, -6.18], [106.83, -6.18], [106.83, -6.17], [106.82, -6.17], [106.82, -6.18]]],
  },
};

const REPORT: FloodFeature = {
  id: 'r-1',
  kind: 'report',
  severity: 'moderate',
  source: 'petabencana',
  depthCm: 60,
  reportedAt: '2026-05-24T11:30:00Z',
  attribution: 'PetaBencana.id (CC-BY)',
  geometry: { type: 'Point', coordinates: [106.85, -6.2] },
};

describe('computeExposedVehicles', () => {
  it('flags a vehicle whose live position is inside a polygon', () => {
    const out = computeExposedVehicles([pos(1, 106.825, -6.175)], [POLYGON]);
    expect(out.map((e) => e.deviceId)).toEqual([1]);
    expect(out[0].matched[0].id).toBe('p-1');
    expect(out[0].matched[0].withinBufferKm).toBe(0);
  });

  it('does not flag a vehicle that is outside every polygon and beyond 2 km of every point', () => {
    const out = computeExposedVehicles([pos(2, 107.0, -6.5)], [POLYGON, REPORT]);
    expect(out).toEqual([]);
  });

  it('flags a vehicle within 2 km of a flood report point', () => {
    // 0.01° latitude ≈ 1.11 km; offset ~0.015° → ~1.66 km from the report
    const out = computeExposedVehicles([pos(3, 106.85, -6.215)], [REPORT]);
    expect(out.map((e) => e.deviceId)).toEqual([3]);
    expect(out[0].matched[0].withinBufferKm).toBeGreaterThan(0);
    expect(out[0].matched[0].withinBufferKm).toBeLessThanOrEqual(2);
  });

  it('keeps the worst severity when a vehicle is inside multiple features', () => {
    const extreme: FloodFeature = { ...POLYGON, id: 'p-2', severity: 'extreme' };
    const out = computeExposedVehicles([pos(4, 106.825, -6.175)], [POLYGON, extreme]);
    expect(out[0].worstSeverity).toBe('extreme');
  });

  it('returns an empty array when there are no flood features', () => {
    expect(computeExposedVehicles([pos(5, 106.825, -6.175)], [])).toEqual([]);
  });

  it('returns an empty array when there are no positions', () => {
    expect(computeExposedVehicles([], [POLYGON])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/use-exposed-vehicles.test.ts`
Expected: FAIL — "Failed to resolve import '../use-exposed-vehicles'".

- [ ] **Step 3: Implement the hook**

Create `src/features/banjir/lib/use-exposed-vehicles.ts` with this exact content:

```ts
/**
 * useExposedVehicles — joins live vehicle positions against the active
 * flood snapshot and surfaces every vehicle either inside a polygon or
 * within EXPOSURE_BUFFER_KM kilometres of a flood report point.
 *
 * `computeExposedVehicles` is pure (testable without React); the hook
 * wraps it with the live position store from the main feature.
 */

import { useMemo } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import turfDistance from '@turf/distance';
import type { Polygon, MultiPolygon } from 'geojson';
import { useLiveStore } from '@/features/main/model/live-store';
import type { Position } from '@/entities/position';
import type { FloodFeature, FloodSeverity } from './types';

/** Vehicles within this many kilometres of a flood point report are
 *  surfaced even if they are technically outside any polygon — the
 *  point reports are sparse, so a buffer keeps the signal honest. */
export const EXPOSURE_BUFFER_KM = 2;

const SEVERITY_RANK: Record<FloodSeverity, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

export interface ExposureMatch {
  /** id of the matched FloodFeature. */
  id: string;
  severity: FloodSeverity;
  /** 0 when the vehicle is inside a polygon, > 0 when it matched a
   *  point report by buffer distance. */
  withinBufferKm: number;
}

export interface ExposedVehicle {
  deviceId: number;
  matched: ExposureMatch[];
  worstSeverity: FloodSeverity;
}

function isPolygonish(geom: FloodFeature['geometry']): geom is Polygon | MultiPolygon {
  return geom.type === 'Polygon' || geom.type === 'MultiPolygon';
}

function isPoint(geom: FloodFeature['geometry']): boolean {
  return geom.type === 'Point';
}

/** Pure join — exposed for direct testing. */
export function computeExposedVehicles(
  positions: Position[],
  features: FloodFeature[],
): ExposedVehicle[] {
  if (features.length === 0 || positions.length === 0) return [];
  const exposed: ExposedVehicle[] = [];

  for (const position of positions) {
    const lng = position.longitude as number | undefined;
    const lat = position.latitude as number | undefined;
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    const here = turfPoint([lng, lat]);

    const matched: ExposureMatch[] = [];
    let worstRank = 0;
    let worstSeverity: FloodSeverity = 'minor';

    for (const feature of features) {
      let hit = false;
      let withinKm = 0;
      if (isPolygonish(feature.geometry)) {
        hit = booleanPointInPolygon(here, feature.geometry);
      } else if (isPoint(feature.geometry)) {
        const reportPoint = turfPoint(
          (feature.geometry as { coordinates: number[] }).coordinates as [number, number],
        );
        const km = turfDistance(here, reportPoint, { units: 'kilometers' });
        if (km <= EXPOSURE_BUFFER_KM) {
          hit = true;
          withinKm = km;
        }
      }
      if (!hit) continue;
      matched.push({ id: feature.id, severity: feature.severity, withinBufferKm: withinKm });
      if (SEVERITY_RANK[feature.severity] > worstRank) {
        worstRank = SEVERITY_RANK[feature.severity];
        worstSeverity = feature.severity;
      }
    }

    if (matched.length > 0) {
      exposed.push({
        deviceId: position.deviceId as number,
        matched,
        worstSeverity,
      });
    }
  }

  return exposed;
}

export function useExposedVehicles(features: FloodFeature[]): ExposedVehicle[] {
  const positions = useLiveStore((state) => state.positions);
  return useMemo(
    () => computeExposedVehicles(Object.values(positions), features),
    [positions, features],
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /opt/tlacak-web && npx vitest run src/features/banjir/lib/__tests__/use-exposed-vehicles.test.ts`
Expected: PASS — 6 tests passing.

---

## Task 6: MapBanjir layer

**Files:**
- Create: `src/map/layers/MapBanjir.tsx`
- Modify: `src/features/main/MainMap.tsx` (add `<MapBanjir />` inside `<MapView>`)

- [ ] **Step 1: Create the layer component**

Create `src/map/layers/MapBanjir.tsx` with this exact content:

```tsx
import { useEffect, useId, useMemo } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { map } from '../core/map-instance';
import { useFloodData } from '@/features/banjir/lib/use-flood-data';
import type { FloodFeature, FloodSeverity } from '@/features/banjir/lib/types';

const SEVERITY_COLOR: Record<FloodSeverity, string> = {
  minor: '#22d3ee',     // cyan (matches --color-primary tone)
  moderate: '#facc15',  // amber (matches --color-warning tone)
  severe: '#fb923c',    // orange
  extreme: '#ef4444',   // red (matches --color-destructive tone)
};

function severityWeight(s: FloodSeverity): number {
  return s === 'extreme' ? 4 : s === 'severe' ? 3 : s === 'moderate' ? 2 : 1;
}

function toMapFeature(f: FloodFeature): Feature<Geometry> {
  return {
    type: 'Feature',
    id: f.id,
    geometry: f.geometry,
    properties: {
      kind: f.kind,
      severity: f.severity,
      color: SEVERITY_COLOR[f.severity],
      weight: severityWeight(f.severity),
      depthCm: f.depthCm ?? 0,
      reportedAt: f.reportedAt,
      source: f.source,
    },
  };
}

/**
 * MapBanjir — overlays the flood snapshot on the MainPage MapLibre map.
 *
 * Four layers stacked on a single GeoJSON source:
 *   <id>-polygon-fill      filled flood polygons (PetaBencana floods)
 *   <id>-polygon-outline   solid outline for confirmed, dashed for warnings
 *   <id>-report-circle     graduated circles for PetaBencana reports
 *   <id>-report-outline    crisp outline on the circles
 *
 * Vehicles continue to render above this layer because MainMap mounts
 * <MapPositions /> after <MapBanjir />.
 */
export function MapBanjir() {
  const sourceId = useId().replace(/:/g, '_');
  const { snapshot } = useFloodData();

  const data: FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: snapshot.features
        // BMKG nowcast points carry placeholder [0,0] coords — exclude
        // them from the map until the CAP polygon enrichment lands.
        .filter((f) => !(f.source === 'bmkg' && f.geometry.type === 'Point'))
        .map(toMapFeature),
    }),
    [snapshot.features],
  );

  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: `${sourceId}-polygon-fill`,
      source: sourceId,
      type: 'fill',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.35,
      },
    });
    map.addLayer({
      id: `${sourceId}-polygon-outline`,
      source: sourceId,
      type: 'line',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,
        'line-dasharray': [
          'case',
          ['==', ['get', 'source'], 'bmkg'],
          ['literal', [2, 2]],
          ['literal', [1, 0]],
        ],
      },
    });
    map.addLayer({
      id: `${sourceId}-report-circle`,
      source: sourceId,
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.75,
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'depthCm'],
          0, 4,
          30, 5,
          70, 7,
          150, 9,
          400, 11,
        ],
      },
    });
    map.addLayer({
      id: `${sourceId}-report-outline`,
      source: sourceId,
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': 1,
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'depthCm'],
          0, 5,
          30, 6,
          70, 8,
          150, 10,
          400, 12,
        ],
      },
    });

    return () => {
      ['polygon-fill', 'polygon-outline', 'report-circle', 'report-outline'].forEach((suffix) => {
        const id = `${sourceId}-${suffix}`;
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [sourceId]);

  useEffect(() => {
    (map.getSource(sourceId) as GeoJSONSource | undefined)?.setData(data);
  }, [sourceId, data]);

  return null;
}
```

- [ ] **Step 2: Wire MapBanjir into MainMap**

Edit `src/features/main/MainMap.tsx`. Replace the existing content with this exact content:

```tsx
import { useCallback, useMemo } from 'react';
import {
  MapView,
  MapPositions,
  MapGeofence,
  MapAccuracy,
  MapLiveRoutes,
  MapSelectedDevice,
  MapDefaultCamera,
} from '@/map';
import { MapBanjir } from '@/map/layers/MapBanjir';
import { useSelectionStore } from './model/selection-store';
import type { Position } from '@/entities/position';

export function MainMap({ positions }: { positions: Position[] }) {
  const select = useSelectionStore((state) => state.select);
  const onMarkerClick = useCallback((deviceId: number) => select(deviceId), [select]);
  const deviceIds = useMemo(
    () => positions.map((position) => position.deviceId as number),
    [positions],
  );

  return (
    <MapView>
      <MapGeofence />
      <MapBanjir />
      <MapAccuracy positions={positions} />
      <MapLiveRoutes deviceIds={deviceIds} />
      <MapPositions positions={positions} onMarkerClick={onMarkerClick} />
      <MapDefaultCamera positions={positions} />
      <MapSelectedDevice />
    </MapView>
  );
}
```

- [ ] **Step 3: Typecheck the new layer**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0, no output.

---

## Task 7: BanjirPanel (Compliance Brief slot)

**Files:**
- Create: `src/features/banjir/ui/BanjirPanel.tsx`
- Create: `src/features/banjir/index.ts`

- [ ] **Step 1: Create the public barrel**

Create `src/features/banjir/index.ts` with this exact content:

```ts
export { useFloodData, type UseFloodDataReturn } from './lib/use-flood-data';
export {
  useExposedVehicles,
  computeExposedVehicles,
  EXPOSURE_BUFFER_KM,
  type ExposedVehicle,
  type ExposureMatch,
} from './lib/use-exposed-vehicles';
export type {
  FloodFeature,
  FloodSeverity,
  FloodKind,
  FloodSource,
  FloodSnapshot,
} from './lib/types';
export { PETABENCANA_ATTRIBUTION } from './lib/petabencana';
export { BMKG_ATTRIBUTION } from './lib/bmkg-nowcast';
export { BanjirPanel } from './ui/BanjirPanel';
```

- [ ] **Step 2: Build the Brief panel**

Create `src/features/banjir/ui/BanjirPanel.tsx` with this exact content:

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { useFloodData } from '../lib/use-flood-data';
import { useExposedVehicles } from '../lib/use-exposed-vehicles';
import type { FloodSeverity } from '../lib/types';

const SEVERITY_TONE: Record<FloodSeverity, string> = {
  minor: 'text-muted-foreground',
  moderate: 'text-[var(--color-warning)]',
  severe: 'text-destructive cyber-glow-alert',
  extreme: 'text-destructive cyber-glow-alert',
};

export function BanjirPanel() {
  const { t } = useTranslation();
  const { snapshot, isLoading } = useFloodData();
  const exposed = useExposedVehicles(snapshot.features);

  const headline = useMemo(() => {
    const worst = exposed.length;
    if (worst > 0) {
      return {
        text: `${worst} ${t('briefBanjirExposed')}`,
        tone: 'alert' as const,
      };
    }
    const counts = snapshot.bySeverity;
    if (counts.extreme + counts.severe > 0) {
      return {
        text: `${counts.extreme + counts.severe} ${t('briefBanjirSevere')}`,
        tone: 'warning' as const,
      };
    }
    if (snapshot.features.length === 0 && !isLoading) {
      return { text: t('briefBanjirClear'), tone: 'primary' as const };
    }
    return { text: `${snapshot.features.length} ${t('briefBanjirActive')}`, tone: 'primary' as const };
  }, [exposed.length, snapshot, isLoading, t]);

  const tonal =
    headline.tone === 'alert'
      ? 'text-destructive cyber-glow-alert'
      : headline.tone === 'warning'
        ? 'text-[var(--color-warning)]'
        : 'text-primary';

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative flex items-baseline justify-between border-b border-border pb-2">
        <span className="cyber-label flex items-center gap-2">
          <span className="text-primary">//</span> {t('complianceBanjir')}
          <span className={cn('font-mono text-[10px] tracking-wider', tonal)}>· {headline.text}</span>
        </span>
        <Link
          to="/compliance/banjir"
          className="cyber-label text-[10px] text-primary cyber-glow hover:underline"
        >
          open module →
        </Link>
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('banjirActiveReports')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            {snapshot.bySource.petabencana.length}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('banjirSeveritySevere')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              snapshot.bySeverity.severe + snapshot.bySeverity.extreme > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {snapshot.bySeverity.severe + snapshot.bySeverity.extreme}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('banjirExposedVehicles')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              exposed.length > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {exposed.length}
          </div>
        </div>
      </div>

      {exposed.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {exposed.slice(0, 5).map((e) => (
              <li
                key={e.deviceId}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-foreground tracking-wide truncate max-w-[16rem]">
                  #{e.deviceId} · {e.matched.length} {t('banjirMatchedFeatures')}
                </span>
                <span className={cn('tabular-nums tracking-wider', SEVERITY_TONE[e.worstSeverity])}>
                  {t(`banjirSeverity${e.worstSeverity[0]!.toUpperCase()}${e.worstSeverity.slice(1)}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot.stale && (
        <div className="relative cyber-label text-[9px] text-[var(--color-warning)]">
          [STALE] {t('banjirStaleNotice')}
        </div>
      )}

      {isLoading && snapshot.features.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}
```

---

## Task 8: BanjirPage (`/compliance/banjir`)

**Files:**
- Create: `src/pages/compliance/BanjirPage.tsx`

- [ ] **Step 1: Build the module page**

Create `src/pages/compliance/BanjirPage.tsx` with this exact content:

```tsx
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFloodData,
  useExposedVehicles,
  PETABENCANA_ATTRIBUTION,
  BMKG_ATTRIBUTION,
  type FloodFeature,
  type FloodSeverity,
} from '@/features/banjir';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const SEVERITY_LABEL_KEY: Record<FloodSeverity, string> = {
  minor: 'banjirSeverityMinor',
  moderate: 'banjirSeverityModerate',
  severe: 'banjirSeveritySevere',
  extreme: 'banjirSeverityExtreme',
};

const SEVERITY_VARIANT: Record<FloodSeverity, 'moving' | 'warning' | 'alert' | 'offline'> = {
  minor: 'offline',
  moderate: 'warning',
  severe: 'alert',
  extreme: 'alert',
};

const SEVERITY_ORDER: Record<FloodSeverity, number> = {
  extreme: 0,
  severe: 1,
  moderate: 2,
  minor: 3,
};

function MetricTile({
  label,
  value,
  meta,
  tone,
  depth,
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone: 'primary' | 'warning' | 'alert' | 'dim';
  depth: 'flat' | 'elevated' | 'recessed' | 'tall';
}) {
  const depthClass =
    depth === 'flat'
      ? 'depth-flat'
      : depth === 'elevated'
        ? 'depth-elevated-shallow'
        : depth === 'tall'
          ? 'depth-elevated-tall -translate-y-0.5'
          : 'depth-recessed-shallow';
  const valueColor =
    tone === 'primary'
      ? 'text-primary cyber-glow'
      : tone === 'warning'
        ? 'text-[var(--color-warning)]'
        : tone === 'alert'
          ? 'text-destructive cyber-glow-alert'
          : 'text-muted-foreground';
  return (
    <div className={cn('relative flex flex-col gap-2 p-4 transition-all', depthClass)}>
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <span className="relative cyber-label text-[10px]">{label}</span>
      <span
        className={cn(
          'relative font-mono text-2xl font-bold tracking-tight tabular-nums',
          valueColor,
        )}
      >
        {value}
      </span>
      {meta && (
        <span className="relative font-mono text-[10px] text-muted-foreground tracking-wider">
          {meta}
        </span>
      )}
    </div>
  );
}

export default function BanjirPage() {
  const { t } = useTranslation();
  const { snapshot, isLoading, reportsError, floodsError, nowcastError } = useFloodData();
  const exposed = useExposedVehicles(snapshot.features);

  const reports = useMemo<FloodFeature[]>(
    () =>
      snapshot.features
        .filter((f) => f.kind === 'report')
        .sort((a, b) => {
          const ord = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (ord !== 0) return ord;
          return b.reportedAt.localeCompare(a.reportedAt);
        }),
    [snapshot.features],
  );

  const jakartaPolygons = useMemo<FloodFeature[]>(
    () =>
      snapshot.features.filter(
        (f) => f.kind === 'polygon' && (f.severity === 'severe' || f.severity === 'extreme'),
      ),
    [snapshot.features],
  );

  const warnings = useMemo<FloodFeature[]>(
    () => snapshot.features.filter((f) => f.kind === 'warning'),
    [snapshot.features],
  );

  const someError = reportsError || floodsError || nowcastError;

  return (
    <ComplianceLayout titleKey="complianceBanjir">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label={t('banjirActiveReports')}
            value={reports.length}
            meta={t('banjirReportsMeta')}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('banjirJakartaPolygons')}
            value={jakartaPolygons.length}
            meta={t('banjirJakartaPolygonsMeta')}
            tone={jakartaPolygons.length > 0 ? 'alert' : 'dim'}
            depth={jakartaPolygons.length > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('banjirExposedVehicles')}
            value={exposed.length}
            meta={t('banjirExposedMeta')}
            tone={exposed.length > 0 ? 'alert' : 'dim'}
            depth={exposed.length > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('banjirNowcastWarnings')}
            value={warnings.length}
            meta={t('banjirNowcastMeta')}
            tone={warnings.length > 0 ? 'warning' : 'dim'}
            depth="flat"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('banjirSourceAttribution', {
              petabencana: PETABENCANA_ATTRIBUTION,
              bmkg: BMKG_ATTRIBUTION,
            })}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {snapshot.updatedAt
              ? `${t('banjirRefreshLabel')} ${dayjs(snapshot.updatedAt).fromNow()}`
              : t('sharedLoading')}
            {snapshot.stale && (
              <span className="ms-2 text-[var(--color-warning)]">[STALE]</span>
            )}
            {someError && (
              <span className="ms-2 text-destructive">[PARTIAL]</span>
            )}
          </div>
        </div>

        {exposed.length > 0 && (
          <div className="mt-3 border border-destructive/60 bg-destructive/[0.08] depth-elevated-tall p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-destructive cyber-glow-alert">
                ⚠ {t('banjirAlertTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('banjirAlertBody', { count: exposed.length })}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 depth-flat border border-border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr>
                <Th>{t('banjirColLocation')}</Th>
                <Th align="right">{t('banjirColDepth')}</Th>
                <Th>{t('banjirColSeverity')}</Th>
                <Th align="right">{t('banjirColTime')}</Th>
                <Th>{t('banjirColSource')}</Th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center cyber-label">
                    {isLoading ? t('sharedLoading') : t('banjirEmpty')}
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const coord = (r.geometry as { coordinates?: number[] }).coordinates;
                  const locText =
                    (r.meta?.text as string | undefined) ??
                    (coord ? `${coord[1]!.toFixed(4)}, ${coord[0]!.toFixed(4)}` : '—');
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 transition-colors hover:bg-primary/[0.04]"
                    >
                      <Td>
                        <span className="font-mono text-[13px] tracking-wider text-foreground">
                          {locText}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-muted-foreground tabular-nums">
                          {r.depthCm !== null ? `${r.depthCm} cm` : '—'}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={SEVERITY_VARIANT[r.severity]} size="sm" bracketed>
                          {t(SEVERITY_LABEL_KEY[r.severity])}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-muted-foreground tabular-nums">
                          {dayjs(r.reportedAt).fromNow()}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary/80">
                          {r.source}
                        </span>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-3xl">
          {t('banjirFootnote')}
        </p>
      </div>
    </ComplianceLayout>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'h-9 px-3 align-middle whitespace-nowrap',
        'font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-muted-foreground',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 align-middle font-mono text-sm tracking-wide',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </td>
  );
}
```

- [ ] **Step 2: Confirm dayjs has the relative-time plugin loaded**

Run: `cd /opt/tlacak-web && grep -rn "relativeTime\|fromNow" src/ | grep -E "extend|dayjs" | head -5`
Expected: at least one line showing `dayjs.extend(relativeTime)` somewhere in shared bootstrap. If not present, append this exact block to `src/shared/i18n/I18nProvider.tsx` (or the app entry — find the dayjs init by `grep -rn "dayjs" src/`):

```ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
```

---

## Task 9: Wire shell (router + nav + brief)

**Files:**
- Modify: `src/app/router.tsx` (add `/compliance/banjir`)
- Modify: `src/features/compliance/ui/ComplianceLayout.tsx` (add 6th nav entry)
- Modify: `src/pages/compliance/ComplianceBriefPage.tsx` (insert `<BanjirPanel/>`, drop B/H/B from Upcoming row, reflow grid)

- [ ] **Step 1: Add the route**

Edit `src/app/router.tsx`. Find the existing block that ends with:

```tsx
      {
        path: 'compliance/b40',
        element: lazyRoute(() => import('@/pages/compliance/B40Page')),
      },
    ],
```

Replace those exact lines with:

```tsx
      {
        path: 'compliance/b40',
        element: lazyRoute(() => import('@/pages/compliance/B40Page')),
      },
      {
        path: 'compliance/banjir',
        element: lazyRoute(() => import('@/pages/compliance/BanjirPage')),
      },
    ],
```

- [ ] **Step 2: Add the nav entry**

Edit `src/features/compliance/ui/ComplianceLayout.tsx`. Replace the existing `ENTRIES` array:

```tsx
const ENTRIES = [
  { path: '/compliance', labelKey: 'complianceMorningBrief', end: true },
  { path: '/compliance/fuel-quota', labelKey: 'complianceFuelQuota' },
  { path: '/compliance/kir', labelKey: 'complianceKir' },
  { path: '/compliance/odol', labelKey: 'complianceOdol' },
  { path: '/compliance/b40', labelKey: 'complianceB40' },
];
```

with:

```tsx
const ENTRIES = [
  { path: '/compliance', labelKey: 'complianceMorningBrief', end: true },
  { path: '/compliance/fuel-quota', labelKey: 'complianceFuelQuota' },
  { path: '/compliance/kir', labelKey: 'complianceKir' },
  { path: '/compliance/odol', labelKey: 'complianceOdol' },
  { path: '/compliance/b40', labelKey: 'complianceB40' },
  { path: '/compliance/banjir', labelKey: 'complianceBanjir' },
];
```

- [ ] **Step 3: Insert BanjirPanel in the Brief + reflow grid + drop Banjir from Upcoming**

Edit `src/pages/compliance/ComplianceBriefPage.tsx`:

1. Add the import. Find:
   ```tsx
   import {
     useFleetQuotaQuery,
     useFleetKirQuery,
     useFleetOdolQuery,
     useFleetB40Query,
   ```
   Add `BanjirPanel` import in a new line after the existing compliance import block:
   ```tsx
   import { BanjirPanel } from '@/features/banjir';
   ```

2. Drop `banjir` from the upcoming list. Find:
   ```tsx
   const upcoming: { key: string; titleKey: string; descKey: string }[] = [
     { key: 'halal', titleKey: 'briefHalalTitle', descKey: 'briefHalalDesc' },
     { key: 'banjir', titleKey: 'briefBanjirTitle', descKey: 'briefBanjirDesc' },
   ];
   ```
   Replace with:
   ```tsx
   const upcoming: { key: string; titleKey: string; descKey: string }[] = [
     { key: 'halal', titleKey: 'briefHalalTitle', descKey: 'briefHalalDesc' },
   ];
   ```

3. Reflow the active-modules grid to fit five panels. Find:
   ```tsx
        {/* Active modules: Fuel Quota · KIR · ODOL · B40 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <FuelQuotaPanel />
          <KirPanel />
          <OdolPanel />
          <B40Panel />
        </div>
   ```
   Replace with:
   ```tsx
        {/* Active modules: Fuel Quota · KIR · ODOL · B40 · Banjir */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <FuelQuotaPanel />
          <KirPanel />
          <OdolPanel />
          <B40Panel />
          <BanjirPanel />
        </div>
   ```

4. Reflow the Upcoming grid from two columns down to one (Halal is the only entry left). Find:
   ```tsx
         <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
   ```
   Replace with:
   ```tsx
         <div className="grid grid-cols-1 gap-2">
   ```

- [ ] **Step 4: Typecheck the wired shell**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0, no output.

---

## Task 10: i18n keys (en + id)

**Files:**
- Modify: `src/shared/i18n/locales/en.json`
- Modify: `src/shared/i18n/locales/id.json`

- [ ] **Step 1: Remove the orphaned Banjir-in-Upcoming keys (en)**

Edit `src/shared/i18n/locales/en.json`. Find and delete these two lines:

```json
  "briefBanjirTitle": "Banjir-Aware Routing",
  "briefBanjirDesc": "BMKG live flood feed + Jasa Marga toll status overlay for Jabodetabek.",
```

- [ ] **Step 2: Append the new Banjir keys (en)**

Find the closing `}` at the very end of `src/shared/i18n/locales/en.json`. Replace the line above it (`"b40Footnote": "..."`) and the closing brace with:

```json
  "b40Footnote": "B40 (40% biodiesel) acts as a solvent on legacy fuel-system deposits, clogging filters in a fraction of the legacy interval. Pertamina + ATPM guidance is 10,000 km / 6 months, whichever first. Override per-vehicle on the Device page with attribute `b40FilterIntervalKm`; log changes with `b40FilterLastChangeKm` and `b40FilterLastChangeDate`.",
  "complianceBanjir": "Banjir Awareness",
  "banjirActiveReports": "Active reports",
  "banjirReportsMeta": "PetaBencana last 3 hours",
  "banjirJakartaPolygons": "Jakarta polygons",
  "banjirJakartaPolygonsMeta": "severe or extreme",
  "banjirExposedVehicles": "Exposed vehicles",
  "banjirExposedMeta": "inside or within 2 km",
  "banjirNowcastWarnings": "BMKG warnings",
  "banjirNowcastMeta": "kecamatan-level potential",
  "banjirSeverityMinor": "Minor",
  "banjirSeverityModerate": "Moderate",
  "banjirSeveritySevere": "Severe",
  "banjirSeverityExtreme": "Extreme",
  "banjirSourceAttribution": "{{petabencana}} · {{bmkg}}",
  "banjirRefreshLabel": "updated",
  "banjirAlertTitle": "VEHICLES AT RISK",
  "banjirAlertBody": "{{count}} vehicle(s) currently inside or within 2 km of an active flood report.",
  "banjirColLocation": "Location / note",
  "banjirColDepth": "Depth",
  "banjirColSeverity": "Severity",
  "banjirColTime": "Reported",
  "banjirColSource": "Source",
  "banjirEmpty": "No active flood reports in the last 3 hours",
  "banjirFootnote": "Awareness-only view. Reports are crowd-sourced via PetaBencana.id (CC-BY) and may include unverified entries; polygons cover Jakarta kelurahan; BMKG warnings flag predicted flood potential, not confirmed inundation. Routing avoidance and per-vehicle alerts are a future iteration.",
  "briefBanjirActive": "active",
  "briefBanjirSevere": "severe / extreme",
  "briefBanjirExposed": "vehicles exposed",
  "briefBanjirClear": "no active reports",
  "banjirMatchedFeatures": "match(es)",
  "banjirStaleNotice": "Feed has not refreshed recently — last data may be outdated."
}
```

- [ ] **Step 3: Remove the orphaned keys (id)**

Edit `src/shared/i18n/locales/id.json`. Find and delete these two lines:

```json
  "briefBanjirTitle": "Routing Sadar Banjir",
  "briefBanjirDesc": "Live banjir BMKG + status tol Jasa Marga di peta Jabodetabek.",
```

- [ ] **Step 4: Append the new Banjir keys (id)**

Find the closing `}` at the very end of `src/shared/i18n/locales/id.json`. Replace the line above it (the b40 footnote) and the closing brace with:

```json
  "b40Footnote": "B40 (40% biodiesel) bersifat pelarut terhadap endapan sistem bahan bakar lama, sehingga filter tersumbat jauh lebih cepat dari interval lama. Pedoman Pertamina + ATPM adalah 10.000 km / 6 bulan, mana yang lebih dulu. Set per-kendaraan di halaman Device melalui atribut `b40FilterIntervalKm`; catat penggantian dengan `b40FilterLastChangeKm` dan `b40FilterLastChangeDate`.",
  "complianceBanjir": "Sadar Banjir",
  "banjirActiveReports": "Laporan aktif",
  "banjirReportsMeta": "PetaBencana 3 jam terakhir",
  "banjirJakartaPolygons": "Polygon Jakarta",
  "banjirJakartaPolygonsMeta": "parah atau ekstrim",
  "banjirExposedVehicles": "Kendaraan terdampak",
  "banjirExposedMeta": "di dalam atau ≤2 km",
  "banjirNowcastWarnings": "Peringatan BMKG",
  "banjirNowcastMeta": "potensi tingkat kecamatan",
  "banjirSeverityMinor": "Ringan",
  "banjirSeverityModerate": "Sedang",
  "banjirSeveritySevere": "Parah",
  "banjirSeverityExtreme": "Ekstrim",
  "banjirSourceAttribution": "{{petabencana}} · {{bmkg}}",
  "banjirRefreshLabel": "diperbarui",
  "banjirAlertTitle": "KENDARAAN BERISIKO",
  "banjirAlertBody": "{{count}} kendaraan berada di dalam atau dalam 2 km dari laporan banjir aktif.",
  "banjirColLocation": "Lokasi / catatan",
  "banjirColDepth": "Kedalaman",
  "banjirColSeverity": "Tingkat",
  "banjirColTime": "Dilaporkan",
  "banjirColSource": "Sumber",
  "banjirEmpty": "Tidak ada laporan banjir aktif dalam 3 jam terakhir",
  "banjirFootnote": "Tampilan kesadaran saja. Laporan bersumber dari komunitas via PetaBencana.id (CC-BY) dan dapat berisi entri belum terverifikasi; polygon mencakup kelurahan Jakarta; peringatan BMKG menandai potensi banjir, bukan banjir terkonfirmasi. Penghindaran rute dan alert per kendaraan menyusul.",
  "briefBanjirActive": "aktif",
  "briefBanjirSevere": "parah / ekstrim",
  "briefBanjirExposed": "kendaraan terdampak",
  "briefBanjirClear": "tidak ada laporan aktif",
  "banjirMatchedFeatures": "kecocokan",
  "banjirStaleNotice": "Feed belum refresh — data mungkin sudah usang."
}
```

- [ ] **Step 5: Validate JSON syntax**

Run: `cd /opt/tlacak-web && node -e "JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/en.json', 'utf8')); JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/id.json', 'utf8')); console.log('ok')"`
Expected: `ok`.

---

## Task 11: Verify, deploy to staging, atomic commit

**Files:** none new

- [ ] **Step 1: Run the full test suite**

Run: `cd /opt/tlacak-web && npx vitest run`
Expected: PASS — all tests green. Total should be 258 (previous baseline) + 29 (this feature) = **287 tests**.

If anything fails, fix it inline before continuing. Do NOT skip or comment out a failing test.

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Production build**

Run: `cd /opt/tlacak-web && npm run build`
Expected: build succeeds. Verify a `BanjirPage-*.js` chunk appears in the asset list (lazy-loaded).

- [ ] **Step 4: Confirm the lazy chunk is reachable**

Run: `cd /opt/tlacak-web && ls build/assets/ | grep -iE "banjir|map-banjir"`
Expected: at least one match (`BanjirPage-<hash>.js`).

- [ ] **Step 5: Deploy to staging**

Run: `cd /opt/tlacak-web && bash scripts/build-staging.sh`
Expected: rebuild + placeholder substitution succeeds. nginx already serves from `/opt/tlacak-web/build` so no reload.

- [ ] **Step 6: Smoke test the new route over HTTPS**

Run: `curl -fsSI https://1f.val.id/compliance/banjir | head -3 && curl -fsSI https://1f.val.id/compliance | head -3`
Expected: both return `HTTP/2 200`. (Catch-all SPA route — content rendered by JS.)

- [ ] **Step 7: Stage the files**

Run:
```bash
cd /opt/tlacak-web && git add \
  src/features/banjir/ \
  src/map/layers/MapBanjir.tsx \
  src/pages/compliance/BanjirPage.tsx \
  src/features/main/MainMap.tsx \
  src/features/compliance/ui/ComplianceLayout.tsx \
  src/pages/compliance/ComplianceBriefPage.tsx \
  src/app/router.tsx \
  src/shared/i18n/locales/en.json \
  src/shared/i18n/locales/id.json \
  package.json package-lock.json
```

Then verify with: `cd /opt/tlacak-web && git status` — only the above paths should be in "Changes to be committed". Do not stage `.remember/`, untracked plan markdowns, or any other unrelated files.

- [ ] **Step 8: Commit**

Run:
```bash
cd /opt/tlacak-web && git commit -m "$(cat <<'EOF'
Add Banjir awareness layer — Jabodetabek flood overlay

Fifth slice of the Indonesia Compliance Co-Pilot, and the first
module to leave the device.attributes.* contour: rather than
deriving from per-vehicle config, the signal is a live external
feed of flood reports + nowcast warnings, joined against live
positions to surface exposed vehicles.

Three independent TanStack Query feeds (PetaBencana /reports @
3 min, PetaBencana /floods Jakarta @ 5 min, BMKG nowcast RSS @
10 min), all CORS-open and verified live 2026-05-24. Each source
fails independently — a PetaBencana outage doesn't kill the BMKG
layer, and the snapshot exposes per-source slices + a [STALE]
indicator when no source has refreshed within 2× its interval.

Math + parsers (src/features/banjir/lib/)
- `petabencana.ts`: pure normalizers for /reports + /floods into a
  shared FloodFeature shape. Depth-based severity classifier
  (≤30cm minor · ≤70cm moderate · ≤150cm severe · >150cm extreme).
  11 tests covering severity edges, malformed geometry, non-flood
  disaster filtering, missing depth.
- `bmkg-nowcast.ts`: pure RSS index + CAP XML parsers using browser
  DOMParser. Flood-keyword filter ("banjir"/"genangan"). CAP polygon
  coordinate-swap (lat,lng → lng,lat for GeoJSON). 9 tests covering
  parser robustness, severity mapping, missing polygon fallback.
- `use-flood-data.ts`: composes the three queries into one
  FloodSnapshot with per-source slices, per-severity counts, and a
  stale flag. 3 mocked-fetch tests covering happy path, partial
  source failure isolation, and the stale-by-time-elapsed flag.
- `use-exposed-vehicles.ts`: pure turf join — point-in-polygon for
  polygon features + 2 km radius buffer for point reports. Worst-
  severity bubbling when a vehicle matches multiple features. 6
  unit tests.

Map layer (src/map/layers/MapBanjir.tsx)
- Single GeoJSON source feeds four MapLibre style layers: filled
  polygons (35% opacity, severity colour), polygon outline (dashed
  for BMKG warnings, solid for PetaBencana confirmed), graduated
  report circles (depth-driven radius 4-11px), and a crisp circle
  outline. Mounts inside MainMap above the geofence layer and
  below the position markers so vehicles stay on top.

Page (src/pages/compliance/BanjirPage.tsx)
- Four mixing-board hero tiles: Active reports (tall · cyan glow) ·
  Jakarta polygons (alert when > 0) · Exposed vehicles (alert when
  > 0) · BMKG warnings (warning when > 0).
- Source-attribution ribbon citing PetaBencana CC-BY + BMKG public
  domain + last-update timestamp + [STALE] / [PARTIAL] indicators.
- Alert banner when any vehicle is exposed.
- Reports table sorted by severity then most-recent. Hover-friendly,
  shows depth in cm, severity Badge, fromNow timestamp, source.
- Footnote explicit about scope: awareness-only, no routing yet.

Morning Brief
- New BanjirPanel slots into the brief grid alongside Fuel Quota /
  KIR / ODOL / B40 — grid reflows from lg:grid-cols-2 to
  lg:grid-cols-2 xl:grid-cols-3 for the 5-panel layout.
- Brief panel surfaces active-report count, severe/extreme count,
  exposed-vehicle count, and the worst-5 list when exposure > 0.
- Upcoming Modules row drops Banjir (now active) and reflows to
  a single column: Halal Logistics Log only.

Routes
- /compliance/banjir → BanjirPage (lazy-loaded chunk).
- ComplianceLayout nav rail now has 6 entries
  (Morning Brief · Fuel Quota · KIR · ODOL · B40 · Banjir).

i18n
- 25 new keys added to en + id (Bahasa Indonesia) covering severity
  labels (minor/moderate/severe/extreme), hero tile metas, the
  source-attribution ribbon, alert banner, column headers, brief
  panel headlines, empty state, and the footnote. Two orphan keys
  (briefBanjirTitle, briefBanjirDesc) removed.

Verified: 287 unit tests pass (29 new for this feature), typecheck
clean, build succeeds (BanjirPage-*.js chunk emitted), /compliance
and /compliance/banjir return HTTP 200 on staging.

Future iterations (documented in
docs/superpowers/specs/2026-05-25-banjir-awareness-layer-design.md
§11): smart per-vehicle alerts (Path B, ~1 day), full re-routing
engine via GraphHopper self-hosted + TomTom Traffic (Path C,
multi-day + ~$2.5K/mo opex — needs paying customer base to gate).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Confirm clean post-commit state**

Run: `cd /opt/tlacak-web && git log --oneline -3 && git status`
Expected: latest commit is the Banjir one; working tree clean apart from previously-untracked `.remember/` and the two unrelated `docs/superpowers/plans/2026-05-22-*.md` files (not part of this feature).

---

## Done

The 5th Compliance Co-Pilot module ships. Module count: 5/5 (Fuel Quota · KIR · ODOL · B40 · Banjir). The Compliance Brief grid now has all five active panels and only "Halal Logistics Log" remains in the Upcoming Modules row.
