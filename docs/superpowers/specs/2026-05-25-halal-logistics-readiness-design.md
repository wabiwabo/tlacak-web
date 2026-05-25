# Halal Logistics Readiness Dashboard — Design

**Status:** Approved, ready for plan
**Date:** 2026-05-25
**Author:** Fariz + Claude (Opus 4.7)
**Implements:** Compliance Co-Pilot — 6th and final active module (after Fuel Quota, KIR, ODOL, B40, Banjir)
**Scope tier:** Path A of three (readiness only). Path B (live temperature) and Path C (full audit log + manifest + PDF export) documented in §10 as future.

---

## 1. Motivation

UU 33/2014 Jaminan Produk Halal + PP 39/2021 made halal certification mandatory across the Indonesian supply chain. The first deadline (17 Oct 2024, food & beverage) is already 19 months past — operators hauling food cargo without BPJPH-certified vehicles risk product detention and contract loss. The non-food deadline (17 Oct 2026) is the next gate — currently ~5 months out.

For a fleet operator, the practical question is: *"Which of my trucks have a valid BPJPH halal logistics certificate, and which need renewal before they're caught at a Bulog/distributor gate?"* Today this is tracked on paper or in a spreadsheet — same operator pain as KIR (which we solved). No fleet tracking app in the Indonesian market (TransTRACK, McEasy, Cartrack ID, GPSku) surfaces BPJPH certificate state today.

This ships the readiness dashboard — Path A — closing OneFleet's Compliance Co-Pilot at **6/6 modules** and removing the last roadmap row from the dispatcher's Morning Brief. Path B (live temperature monitoring for chilled cargo) and Path C (full audit log + PDF export for inspectors) are documented as future iterations gated on customer demand.

## 2. Scope

**In scope:**
- Per-vehicle BPJPH certificate status (certified / due-soon / expired / unknown) driven by operator-logged cert expiry
- `/compliance/halal` page with mixing-board hero + sortable readiness table
- `HalalPanel` slot in the Compliance Morning Brief
- Bahasa Indonesia + English i18n
- ~12 unit tests on the pure status math, mirroring `kir.test.ts`
- Removal of the now-empty Upcoming Modules row from `ComplianceBriefPage`

**Out of scope (this iteration):**
- Live temperature monitoring (`position.attributes.temp1` integration) — Path B
- Per-trip manifest UI / cargo log — Path C
- PDF / CSV audit report export for BPJPH inspectors — Path C
- Tamper-evident logging — Path C
- Sanitation interval enforcement — PP 39/2021 does not fix an interval (only "between haram→halal hauls"), so any fixed-period warning would be a false positive. The sanitation date is displayed as informational only.

## 3. Data model

All compliance state is operator-logged on the device via `device.attributes.*`, matching the established pattern (KIR/ODOL/B40 all read from there). No backend changes.

| Attribute | Type | Required | Drives status? | Notes |
|---|---|---|---|---|
| `halalCertNumber` | string | yes (to be "tracked") | absence → `unknown` | BPJPH-issued certificate identifier |
| `halalCertExpiry` | ISO 8601 date | yes | yes | BPJPH certificates valid 4 years from issuance |
| `halalLastSanitization` | ISO 8601 date | optional | no — info column only | PP 39/2021 requires sanitation *between haram→halal hauls*, not at fixed intervals; date is shown so the operator can see it but is not classified |
| `halalCargoCategory` | string `'halal-only' \| 'mixed' \| 'haram'` | optional | no — info column only | Operator can flag a truck that explicitly does not haul halal cargo |

## 4. Status math

```ts
export type HalalStatus = 'certified' | 'due-soon' | 'expired' | 'unknown';

export const HALAL_CERT_VALIDITY_YEARS = 4;  // BPJPH standard, reference only
export const HALAL_WARN_DAYS = 60;            // BPJPH renewal typically 30-45 days
```

Decision tree:
1. `halalCertNumber` missing → `unknown`
2. `halalCertExpiry` parseable date AND now > expiry → `expired`
3. days-until-expiry ≤ 60 → `due-soon`
4. days-until-expiry > 60 → `certified`

`computeHalalStatus(certNumber, certExpiry, thresholds?, now?)` returns:

```ts
{
  certNumber: string | null,
  certExpiry: string | null,      // YYYY-MM-DD normalised
  daysUntilExpiry: number | null, // negative if expired
  status: HalalStatus,
}
```

Pure function. `now` injected for tests.

## 5. Architecture

Mirrors the KIR pattern (lib + hook + page + inline Brief panel). No new feature module — Halal lives alongside Fuel/KIR/ODOL/B40 in `src/features/compliance/lib/`. Banjir is the only Compliance module with its own `src/features/banjir/` folder, because it has a unique external data dependency. Halal does not.

```
src/features/compliance/lib/
├── halal.ts                          # pure: computeHalalStatus, summarizeHalalFleet, formatHalalCountdown
├── use-fleet-halal.ts                # hook: reads device.attributes.halal*
└── __tests__/halal.test.ts           # ~12 tests (KIR-style)

src/pages/compliance/HalalPage.tsx    # /compliance/halal module page

# Modified
src/features/compliance/index.ts                  # barrel exports
src/features/compliance/ui/ComplianceLayout.tsx   # 7th nav entry "Halal"
src/pages/compliance/ComplianceBriefPage.tsx      # +HalalPanel inline + drop UpcomingPanel + drop briefHalal* keys usage
src/app/router.tsx                                # /compliance/halal lazy route
src/shared/i18n/locales/{en,id}.json              # ~22 keys
```

## 6. Page layout (`/compliance/halal`)

Cyber Ops mixing-board, same shape as `KirPage.tsx`/`B40Page.tsx`:

- **4 hero tiles:**
  - `Tracked` (tall · cyan glow) — count of vehicles with `halalCertNumber` set
  - `Expired` (alert + elevated when > 0)
  - `Due Soon` (warning + elevated when > 0)
  - `Unknown` (warning when > 0, flat depth)
- **Source-law ribbon:** `UU 33/2014 · PP 39/2021 · BPJPH · validity 4 years · warn 60 days`
- **Alert banner** when `expired + due-soon > 0`: `⚠ N vehicle(s) need certificate action within 60 days or are already expired`
- **Per-vehicle table** sorted by urgency (expired → due-soon → unknown → certified). Columns:
  - Name · Plate (uniqueId) · Cert # · Cert expiry · Last sanitation (info, "—" if blank) · Cargo category (info, "—" if blank) · Countdown (right-aligned, severity-coloured) · Status badge
- **Footnote:** mandate context + the four operator-set attribute names

## 7. Compliance Brief integration

- **HalalPanel** (inline function in `ComplianceBriefPage.tsx`, matching `KirPanel`/`OdolPanel`/`B40Panel` colocated pattern — Halal does not get its own UI file unlike Banjir)
- 3-stat grid: `Certified` count · `Due Soon` count · `Expired` count
- Worst-5 list of expired-or-due-soon vehicles when present
- Slots into the existing brief grid as the **6th active panel**. Grid stays at `lg:grid-cols-2 xl:grid-cols-3` (6 panels = 2 rows of 3 on xl, 3 rows of 2 on lg)
- **The `UpcomingPanel` and its surrounding container are removed entirely** since Halal was the last roadmap item. The page is now 100% active modules

## 8. Error handling

Trivial — Halal reads from `device.attributes` (already-fetched data, no separate network call). The only failure mode is operator-typo'd attribute values, handled by:
- Non-parseable `halalCertExpiry` → falls through to `unknown` (same as KIR's pattern)
- Non-string `halalCertNumber` → treated as absent → `unknown`
- Empty device list → renders empty state (`No vehicles configured for halal tracking`)

## 9. Testing

~12 unit tests on `halal.ts`, mirroring `kir.test.ts`:

- `unknown` when cert number missing
- `unknown` when cert expiry unparseable
- normalises `certExpiry` to `YYYY-MM-DD`
- computes `daysUntilExpiry` correctly (positive when future, negative when past)
- `certified` at > 60 days
- `due-soon` at exactly 60 days (boundary)
- `due-soon` at 30 days
- `expired` at -1 day
- `expired` deep negative
- honours custom `warnDays` threshold
- summariser counts by status
- formatter renders `60 d` / `12 mo` / `−12 d` matching KIR

Total project test count: 287 → ~299.

## 10. Future: Path B + Path C

### 10.1 Path B — live temperature monitoring (next milestone)
- Read `position.attributes.temp1` / `temp2` from live position telemetry (via `useLiveStore`)
- Add per-vehicle temperature column + in/out-of-range indicator
- Brief panel surfaces "temp violations now" count
- Threshold configurable per device via `halalTempMinC` / `halalTempMaxC` attributes
- First Compliance module to read from `position.attributes.*` (live telemetry) rather than `device.attributes.*` (config). The `useExposedVehicles` pattern from Banjir is the reference
- Estimated effort: ~3-4 hours

### 10.2 Path C — full audit log + PDF export (premium gate)
- Backend addition: `Manifest` entity (per-trip cargo type, halal status, sanitation snapshot)
- New `/compliance/halal/manifest` create flow
- Time-series chart of temperature history per device
- "Generate BPJPH audit report" → PDF export with cert info + manifest history + temp series + sanitation log
- Tamper-evident: hash-chain the manifest log so an inspector can detect mutation
- Estimated effort: multi-day. Backend + PDF generation infra
- **Decision gate:** Execute when (a) ≥10 paying food-fleet customers ask for inspector export, (b) we have product capacity for a backend manifest API, (c) the BPJPH inspector workflow is verified with a real audit (some inspectors accept laminated paper logs)

## 11. Open questions

None blocking. Notes for the planner:

- The hero "Tracked" tile shows `total - unknown` / `total` (matching KIR). A fleet operator who hauls non-halal cargo on most trucks may want a way to mark trucks as "non-applicable" so they don't inflate the `unknown` count. The `halalCargoCategory` attribute is logged for this but does not currently filter — we surface it in the table only. Revisit if operators complain.
- Cert validity is 4 years per BPJPH — surfaced in the source ribbon but not enforced. We trust the operator-entered `halalCertExpiry` rather than computing from issuance date.

## 12. References

- UU 33/2014 — Jaminan Produk Halal (Halal Product Assurance Law)
- PP 39/2021 — implementing regulation
- BPJPH (Badan Penyelenggara Jaminan Produk Halal) — certification body, https://bpjph.halal.go.id
- 17 Oct 2024 — first deadline (food & beverage, already in force)
- 17 Oct 2026 — second deadline (non-food: pharma, cosmetics, etc.)
- KIR module — `src/features/compliance/lib/kir.ts` + `src/pages/compliance/KirPage.tsx` — primary pattern reference
