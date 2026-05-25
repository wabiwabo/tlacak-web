# Banjir Awareness Layer — Design

**Status:** Approved, ready for plan
**Date:** 2026-05-25
**Author:** Fariz + Claude (Opus 4.7)
**Implements:** Compliance Co-Pilot — 5th module (after Fuel Quota, KIR, ODOL, B40)
**Scope tier:** Path A of three (awareness only). Path B (alerts) and Path C (full re-routing engine) documented in §11 as future.

---

## 1. Motivation

Jabodetabek floods 5-15 times/year. A truck caught in a flooded toll-road approach loses the shipment, the cargo, and often the engine. No fleet tracking app in the Indonesian market — TransTRACK, McEasy, Cartrack ID, GPSku — surfaces a live flood layer today. This ships a real-time flood-awareness view as the dispatcher's first signal, on top of the existing Cyber Ops MainPage map and the Compliance Co-Pilot Brief.

Path A (this spec) is **awareness only**: dispatchers see flood polygons + reports + warnings on the map and in their Morning Brief. They still decide what to do. Path B adds alerting; Path C adds an actual avoid-the-flood routing engine. Each path is a valid stopping point — we ship A first because (a) it's a real diferensiator standalone, (b) it has zero recurring cost, and (c) it builds the data foundation B and C will need.

## 2. Scope

**In scope:**
- Flood report overlay on the existing MainPage map (`MapBanjir` layer alongside `MapGeofence` etc.)
- A dedicated `/compliance/banjir` page with mixing-board hero, full-screen map, and a recent-reports table
- A `BanjirPanel` slot in the Compliance Morning Brief
- Three data sources: PetaBencana reports (national), PetaBencana floods (Jakarta polygons), BMKG nowcast warnings (national kecamatan)
- Read-only — no posting, no routing, no alerts
- Bahasa Indonesia + English i18n

**Out of scope (now):**
- Real-time alerts when a vehicle enters a flood polygon (Path B)
- Re-routing or route-avoidance logic (Path C)
- PetaBencana `/floodgauges` (Jakarta sensors) — deferred to a follow-up; sensor UX needs its own treatment (waterlevel charts, alert thresholds)
- DKI DSDA / BPBD water-level page scraping — fragile (BPBD returns 403 to bots; DSDA uses undocumented internal AJAX). Skip until we have a measured operator demand
- Jasa Marga toll status — no public API exists; needs B2B partnership

## 3. Data sources (verified 2026-05-24)

### 3.1 PetaBencana.id — primary
Open data, no API key, CORS-enabled for GET (verified: `access-control-allow-origin: *` on `/reports`). Attribution required (CC-BY-style). Indonesian gov/civic platform, actively maintained (latest org commits Jan 2026).

| Endpoint | Returns | Refresh | Notes |
|---|---|---|---|
| `https://api.petabencana.id/reports?disaster=flood&geoformat=geojson&timeperiod=10800` | National point reports (last 3h), GeoJSON FeatureCollection with `depth` (cm), timestamp | 3 min | Default time window 3h; max 7 days |
| `https://data.petabencana.id/floods?admin=ID-JK&minimum_state=2&geoformat=geojson` | Jakarta kelurahan polygons (severity ≥ "yellow"), FeatureCollection | 5 min | Jakarta only; states: 1 (10-70cm), 2 (71-150cm), 3 (>150cm), 4 (extreme) |
| `https://api.petabencana.id/floodgauges?city=ID-JK` | Jakarta sensor stations (Katulampa, Depok, Pluit, …), TopoJSON | 10 min | Hourly readings; **deferred** — sensor UX is a follow-up |

### 3.2 BMKG nowcast — secondary
Public domain, attribution mandatory. ~60 req/min/IP rate limit. CORS confirmed open (`access-control-allow-origin: *`).

| Endpoint | Returns | Refresh | Notes |
|---|---|---|---|
| `https://www.bmkg.go.id/alerts/nowcast/id` | RSS index of active weather warnings | 10 min | Each item links to a CAP XML detail |
| `<from RSS item>_alert.xml` | CAP XML with kecamatan polygon + "local flood potential" callout | on-demand | Parsed for `parameter[name=banjir]` flag |

**Implication:** BMKG gives us the rest-of-Indonesia coverage that PetaBencana's polygon layer (Jakarta-only) lacks, but it's *predictive* ("flood potential"), not confirmed inundation. UI must label clearly.

## 4. Architecture

Feature-sliced design, sibling to `compliance/`:

```
src/features/banjir/
├── lib/
│   ├── petabencana.ts          # GeoJSON normalizer (pure)
│   ├── bmkg-nowcast.ts         # RSS + CAP XML parser (pure)
│   ├── use-flood-data.ts       # TanStack Query hooks
│   ├── use-exposed-vehicles.ts # turf point-in-polygon (pure-ish)
│   └── __tests__/
├── ui/
│   └── BanjirPanel.tsx         # Compliance Brief slot
└── index.ts

src/map/layers/
└── MapBanjir.tsx               # MapLibre source + style layers

src/pages/compliance/
└── BanjirPage.tsx              # /compliance/banjir module page

# Modifications:
src/app/router.tsx                              # + /compliance/banjir
src/features/compliance/ui/ComplianceLayout.tsx # +nav entry
src/pages/compliance/ComplianceBriefPage.tsx    # +<BanjirPanel/>
src/features/main/MainMap.tsx                   # +<MapBanjir/>
src/shared/i18n/locales/{en,id}.json            # +25 keys
package.json                                    # +@turf/turf
```

### 4.1 Normalized data shape

All three sources collapse to one type before the UI sees them:

```ts
export type FloodSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';
export type FloodKind = 'report' | 'polygon' | 'warning';

export interface FloodFeature {
  id: string;                  // stable across refreshes
  kind: FloodKind;
  severity: FloodSeverity;
  geometry: Polygon | MultiPolygon | Point;
  depthCm: number | null;      // only on `report` kind from PetaBencana
  reportedAt: string;          // ISO 8601
  source: 'petabencana' | 'bmkg';
  attribution: string;         // rendered verbatim in the footer
  meta?: Record<string, unknown>; // raw fields for tooltip
}

export interface FloodSnapshot {
  features: FloodFeature[];
  bySource: Record<FloodFeature['source'], FloodFeature[]>;
  bySeverity: Record<FloodSeverity, number>;
  updatedAt: string;
  stale: boolean;              // true if data > 2× refresh interval old
}
```

### 4.2 PetaBencana → FloodFeature mapping

| PetaBencana field | FloodFeature field | Notes |
|---|---|---|
| `properties.pkey` | `id` | Stable PK |
| `properties.disaster_type` | filter `== 'flood'` | Reports endpoint is multi-disaster |
| `properties.report_data.flood_depth` | `depthCm` | cm |
| `properties.created_at` | `reportedAt` | ISO |
| `properties.state` (1-4) | `severity` | 1→minor, 2→moderate, 3→severe, 4→extreme |
| `geometry` | `geometry` | Point for reports, MultiPolygon for floods |

### 4.3 BMKG nowcast → FloodFeature mapping

Parse RSS for items with title containing flood keywords ("banjir", "genangan") OR fetch each `_alert.xml` and inspect CAP `parameter` blocks. Polygon comes from CAP `area > polygon` (space-separated `lat,lng` pairs). Severity from CAP `severity` (minor/moderate/severe/extreme — already matches our enum).

## 5. Data flow

```
TanStack Query (3 keys, polled independently)
   │
   ├── reportsQuery(refetchInterval: 3min)  → PetaBencana /reports
   ├── floodsQuery(refetchInterval: 5min)   → PetaBencana /floods (Jakarta)
   └── nowcastQuery(refetchInterval: 10min) → BMKG nowcast RSS + CAP XMLs
        │
        ▼ (each normalizer)
   FloodFeature[]
        │
        ▼ (use-flood-data merges + summarizes)
   FloodSnapshot
        │
        ├──────────────┬──────────────┬────────────────────────┐
        ▼              ▼              ▼                        ▼
   MapBanjir      BanjirPage     BanjirPanel        use-exposed-vehicles
   (MainMap +    (table + hero)   (Brief slot)      (turf.js × live store)
    /banjir)
```

Live position data continues to come from `useLiveStore.positions`. The `use-exposed-vehicles` hook joins via `@turf/boolean-point-in-polygon` — pure, no I/O, runs on every render but memoized on `(positions, features)` identity.

## 6. Map rendering (`MapBanjir`)

Four MapLibre layers added below the existing positions/markers (so vehicles stay visually on top):

1. **Polygons-confirmed** (PetaBencana floods): fill, opacity 0.35, colour by severity (cyan→yellow→orange→red gradient matched to Cyber Ops palette via `--color-warning` / `--color-destructive`)
2. **Polygons-warning** (BMKG nowcast): same fills but with dashed outline + lower opacity to signal "predicted, not confirmed"
3. **Reports** (PetaBencana points): graduated circles sized 4-10px by depth, coloured by severity
4. **Hover popup**: location + depth + age + source link

Toggleable via existing `MapView` controls (a future pass; ship visible-by-default for V1).

## 7. Pages

### 7.1 `/compliance/banjir` (`BanjirPage.tsx`)

Cyber Ops mixing-board pattern, same as B40Page:

- **4 hero tiles:** Active reports (3h) · Jakarta polygons severity ≥ moderate · Exposed vehicles · BMKG warnings
- **Source-law ribbon:** `PetaBencana CC-BY · BMKG public domain · refresh 3-10 min · ${updatedAt}`
- **Alert banner** when exposed-vehicle count > 0: "⚠ N vehicle(s) currently inside or within 2km of an active flood report"
- **Map block** (full-width, ~50vh): embeds `MapView` + `MapBanjir` + `MapPositions` (read-only — no marker clicks redirect)
- **Reports table:** Location · Depth · Severity badge · Time ago · Source — sorted by reportedAt desc
- **Footnote:** Attribution + scope disclaimer ("Awareness only — no alerts or routing yet")

### 7.2 Compliance Brief slot (`BanjirPanel`)

Three small stat cells (severity counts) + worst-3 list + "exposed vehicles" callout. Same shape as the other 4 brief panels. Brief grid reflows from current `lg:grid-cols-2` (2×2) to `lg:grid-cols-2 xl:grid-cols-3` — two rows of three on desktop wide, two columns stacked on narrower. Order: FuelQuota · KIR · ODOL · B40 · Banjir.

### 7.3 Nav entry

`ComplianceLayout` `ENTRIES` array gains a 6th item: `{ path: '/compliance/banjir', labelKey: 'complianceBanjir' }`. Order: Morning Brief · Fuel Quota · KIR · ODOL · B40 · Banjir.

## 8. Error handling

- **Per-source isolation:** PetaBencana down → BMKG layer still renders; brief panel shows partial counts with `[PARTIAL]` indicator
- **Stale data:** `FloodSnapshot.stale = true` when last successful fetch > 2× refresh interval. UI shows `[STALE]` badge near the source-law ribbon and dims polygons by 40%
- **Empty success:** "Tidak ada laporan banjir aktif dalam 3 jam terakhir" / "No active flood reports in last 3 hours" — empty state, not error
- **Network failure:** TanStack Query default retry (3 attempts, exponential backoff). After exhaustion, surface a small dismissible toast: "PetaBencana feed unavailable — last data 12 min ago"
- **Parser failure:** Skip the malformed feature, log to `useErrorsStore`, continue with the rest. A single bad RSS item must not kill the layer

## 9. Testing

Unit only — matches the established Compliance pattern (lib-tested, page manually verified via staging).

| Module | Tests |
|---|---|
| `petabencana.ts` | normalize report happy-path; missing `flood_depth`; non-flood disaster filtered out; severity 1/2/3/4 mapping; empty FeatureCollection; malformed geometry; stale timestamp detection. ~10 |
| `bmkg-nowcast.ts` | parse RSS index; extract flood items only; parse CAP polygon; severity mapping; missing polygon fallback; UTF-8 / namespace handling. ~8 |
| `use-exposed-vehicles.ts` | point-in-polygon hit; <2km hit; >2km miss; no positions; no flood features; mixed severity preserves worst. ~6 |
| Hooks | mocked-fetch test for `use-flood-data` covering stale flag + partial-failure isolation. ~3 |

Target: **~27 new unit tests**. Bringing project total from 258 → ~285.

## 10. i18n (~25 keys, en + id)

Categories:
- Nav + page titles (`complianceBanjir`, `banjirPageTitle`)
- Hero tile labels (`banjirActiveReports`, `banjirJakartaPolygons`, `banjirExposedVehicles`, `banjirNowcastWarnings`, plus metas)
- Severity badges (`banjirSeverityMinor/Moderate/Severe/Extreme`)
- Source/law ribbon (`banjirSourceAttribution`, `banjirRefreshLabel`)
- Alert banner + body (`banjirAlertTitle`, `banjirAlertBody`)
- Reports table headers + empty state
- Brief panel labels (`briefBanjirTitle` reused / `briefBanjirReady`)
- Stale + partial indicators
- Footnote
- Drop orphaned `briefBanjirTitle`/`briefBanjirDesc` from Upcoming since Banjir leaves the roadmap row (similar pattern to B40 commit)

## 11. Future: Path B (alerts) + Path C (re-routing engine)

Captured here so the C-level research isn't lost.

### 11.1 Path B — smart alerts (next milestone)

- Add 2km buffer ring around `kind:'report'|'polygon'` features (turf `buffer`)
- New `useFloodAlerts` hook diffs entered/exited vehicles between snapshots
- Push notification via existing `useEventsStore` (the alert toast infra used elsewhere)
- "Top exposed" list in Brief becomes interactive (click → focus map)
- Estimated effort: ~1 day

### 11.2 Path C — full re-routing engine (premium feature gate)

**Routing engine: GraphHopper self-hosted (Apache 2.0).** The only viable option after research:
- Supports arbitrary polygon avoidance via Custom Model `areas` (runtime, no graph rebuild)
- Truck profile with weight/height/dimension constraints (aligns with our ODOL module)
- License clean for commercial SaaS (Apache 2.0 core)
- Self-host on a VPS, Docker deploy, ~$50-150/mo for Indonesia OSM extract
- Alternative considered: ORS (200 km² polygon area cap = too restrictive for Java-scale floods, GPL server license adds compliance overhead), Valhalla (`exclude_polygons` documented buggy: issues #3266/#4659), OSRM (no runtime polygon avoid), Google/Mapbox/HERE (no arbitrary polygon avoidance — only categories or bounding boxes)

**Traffic feed: TomTom Routing + Traffic Flow + Incidents.**
- Indonesia officially "detailed" coverage (both flow + incidents)
- $0.75/1k routing + $0.75/1k non-tile traffic + €0.08/1k tiles
- 2.5k non-tile + 50k tile per day free, no monthly minimum
- Premium fallback: Google Routes API (best Jakarta accuracy) gated behind per-shipment budget

**Cost model at 10k shipments/day × 10 reroutes each = ~3M req/mo:**
- ~$2,250/mo TomTom (~13× cheaper than Google at scale)
- +$300/mo Google premium-routing budget for ~30k critical trips
- +$50-150/mo GraphHopper VPS
- **≈ $2.5K/mo recurring** — needs justified by paying customer base before pull-trigger

**Jasa Marga toll status:** No public API. The only authoritative source is the Travoy app + JM CLICK internal feed (3,500+ CCTV). Pursue B2B partnership with Jasa Marga / JMTO — plan to launch C *without* JM and add when partnership materializes.

**Decision gate for Path C:** Execute when (a) we have ≥50 paying fleets on the premium tier, (b) the dispatcher feedback explicitly asks for "the system to choose the route", and (c) we have an ops owner for GraphHopper monitoring. Until then, the awareness layer (Path A) is the right level of investment.

## 12. Open questions

None blocking. Notes for the planner:

- The exact merge strategy for overlapping PetaBencana report + BMKG warning polygons (visual layering only — the data stays separate)
- Whether to ship the `MapBanjir` layer toggled on by default in MainPage (probably yes for Indonesia; revisit if non-IDN deployments come)
- Whether `useExposedVehicles` 2km buffer is configurable per fleet (default OK; expose later if asked)

## 13. References

**Verified live 2026-05-24:**
- https://api.petabencana.id/reports?disaster=flood — 200, GeoJSON, CORS open
- https://data.petabencana.id/floods?admin=ID-JK&minimum_state=2 — 200, polygon
- https://www.bmkg.go.id/alerts/nowcast/id — 200, RSS, CORS open
- https://docs.petabencana.id/master-1 — current docs (SITI OSS)
- https://github.com/petabencana — active org

**Routing/traffic research (Path C foundation):**
- https://docs.graphhopper.com/openapi/custom-model/limit-rules-to-certain-areas
- https://developer.tomtom.com/traffic-api/documentation/product-information/market-coverage
- https://developer.tomtom.com/pricing
- https://www.here.com/docs/bundle/routing-api-developer-guide-v8/page/concepts/truck-routing.html
- https://github.com/valhalla/valhalla/issues/4659 (exclude_polygons reliability)
- https://openrouteservice.org/restrictions/ (200 km² cap)
