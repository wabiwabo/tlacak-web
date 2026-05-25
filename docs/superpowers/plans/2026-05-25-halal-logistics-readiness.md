# Halal Logistics Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 6th and final active Compliance Co-Pilot module — a BPJPH halal-certificate readiness dashboard for Indonesian food fleets — by mirroring the locked KIR pattern exactly.

**Architecture:** Pure math + hook + page + inline Brief panel, all colocated in `src/features/compliance/` (matching the KIR/ODOL/B40/FuelQuota convention; Banjir is the only Compliance module with its own `src/features/banjir/` folder because of its external data dependency). No backend changes. Status driven by `device.attributes.halalCertNumber` + `halalCertExpiry` with optional info-only `halalLastSanitization` + `halalCargoCategory`. The `UpcomingPanel` row is removed from `ComplianceBriefPage` because Halal is the last roadmap entry — the page becomes 100% active modules.

**Tech Stack:** React 19, TypeScript, dayjs, TanStack Query v5 (via existing `useDevicesQuery`), vitest, i18next, Cyber Ops design tokens.

**Spec:** `docs/superpowers/specs/2026-05-25-halal-logistics-readiness-design.md`

**Working directory:** `/opt/tlacak-web` (branch `rewrite/modern-frontend`)

---

## Project conventions (read first)

- **Working directory** is `/opt/tlacak-web`, not `/opt/traccar`. The Traccar Java backend is at `/opt/traccar` and is a sibling; this is the standalone modern frontend rewrite.
- **TDD always.** Tests before implementation. The project commits each Compliance module as ONE atomic commit at the end. Tasks 1-9 leave files unstaged for Task 10 to commit.
- **Pure libs go in `src/features/compliance/lib/<name>.ts`** with tests at `src/features/compliance/lib/__tests__/<name>.test.ts`. Hooks (with React imports) share the `lib/` folder. Page components live at `src/pages/compliance/<Name>Page.tsx`. **Brief panels are inline functions inside `ComplianceBriefPage.tsx`** — matching `KirPanel`, `OdolPanel`, `B40Panel` — NOT separate UI files. (Banjir is the only exception because it has its own feature module.)
- **Date formatting** uses dayjs (already a dep). Day-arithmetic patterns in `kir.ts`.
- **Style tokens** are Cyber Ops: `font-mono`, `cyber-label`, `cyber-glow`, `depth-elevated-shallow/tall/recessed-shallow`, `text-[var(--color-warning)]`, `text-destructive cyber-glow-alert`, `text-primary`, `bg-card/40`, `border-border`. The closest template is `src/pages/compliance/KirPage.tsx`.
- **TanStack Query**: existing `useDevicesQuery()` fetches the device list with all attributes. We don't add new queries — we just memo a derived view on the device list. Pattern in `use-fleet-kir.ts`.
- **No emojis in code or commits** unless explicitly requested.
- **Run commands from `/opt/tlacak-web`.** Use `cd /opt/tlacak-web && <cmd>` since the shell cwd resets.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `src/features/compliance/lib/halal.ts` | Pure `computeHalalStatus`, `summarizeHalalFleet`, `formatHalalCountdown`, constants |
| `src/features/compliance/lib/use-fleet-halal.ts` | Hook reads `device.attributes.halal*`, derives snapshots |
| `src/features/compliance/lib/__tests__/halal.test.ts` | ~12 unit tests (KIR-style) |
| `src/pages/compliance/HalalPage.tsx` | `/compliance/halal` module page — hero + ribbon + alert + table |

### Modified files

| Path | Change |
|---|---|
| `src/features/compliance/index.ts` | Barrel export for halal math, types, hook |
| `src/features/compliance/ui/ComplianceLayout.tsx` | Add 7th nav entry `Halal` |
| `src/pages/compliance/ComplianceBriefPage.tsx` | Insert inline `HalalPanel`, remove `UpcomingPanel` + its container entirely, drop `briefHalalTitle/Desc` i18n usage |
| `src/app/router.tsx` | Add `/compliance/halal` lazy route |
| `src/shared/i18n/locales/en.json` | +22 keys, -2 orphans (`briefHalalTitle`, `briefHalalDesc`) |
| `src/shared/i18n/locales/id.json` | same |

---

## Task 1: halal.ts pure module + tests (TDD)

**Files:**
- Create: `src/features/compliance/lib/halal.ts`
- Create: `src/features/compliance/lib/__tests__/halal.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/compliance/lib/__tests__/halal.test.ts` with this exact content:

```ts
import { describe, expect, it } from 'vitest';
import {
  computeHalalStatus,
  summarizeHalalFleet,
  formatHalalCountdown,
  HALAL_CERT_VALIDITY_YEARS,
  HALAL_WARN_DAYS,
} from '../halal';

const NOW = new Date('2026-05-25T12:00:00Z');

describe('computeHalalStatus', () => {
  it('returns unknown when no cert number is on file', () => {
    const snap = computeHalalStatus(null, '2027-01-01', {}, NOW);
    expect(snap.status).toBe('unknown');
    expect(snap.daysUntilExpiry).toBeNull();
    expect(snap.certExpiry).toBeNull();
  });

  it('returns unknown when cert number is empty string', () => {
    expect(computeHalalStatus('', '2027-01-01', {}, NOW).status).toBe('unknown');
  });

  it('returns unknown when cert expiry is unparseable', () => {
    expect(computeHalalStatus('BPJPH-001', 'not a date', {}, NOW).status).toBe('unknown');
  });

  it('returns expired and negative days when past expiry', () => {
    // 2026-04-01 was 54 days before 2026-05-25
    const snap = computeHalalStatus('BPJPH-002', '2026-04-01', {}, NOW);
    expect(snap.status).toBe('expired');
    expect(snap.daysUntilExpiry).toBe(-54);
    expect(snap.certExpiry).toBe('2026-04-01');
  });

  it('reports due-soon at exactly 60 days remaining', () => {
    // 2026-05-25 + 60 = 2026-07-24
    const snap = computeHalalStatus('BPJPH-003', '2026-07-24', {}, NOW);
    expect(snap.daysUntilExpiry).toBe(60);
    expect(snap.status).toBe('due-soon');
  });

  it('reports due-soon at 30 days remaining', () => {
    const snap = computeHalalStatus('BPJPH-004', '2026-06-24', {}, NOW);
    expect(snap.daysUntilExpiry).toBe(30);
    expect(snap.status).toBe('due-soon');
  });

  it('reports certified at 61 days remaining (above the warn threshold)', () => {
    const snap = computeHalalStatus('BPJPH-005', '2026-07-25', {}, NOW);
    expect(snap.daysUntilExpiry).toBe(61);
    expect(snap.status).toBe('certified');
  });

  it('reports certified well into the future', () => {
    const snap = computeHalalStatus('BPJPH-006', '2030-01-01', {}, NOW);
    expect(snap.daysUntilExpiry).toBeGreaterThan(60);
    expect(snap.status).toBe('certified');
  });

  it('honours a custom warnDays threshold', () => {
    // 100-day window, 90 days remaining → due-soon
    const snap = computeHalalStatus('BPJPH-007', '2026-08-23', { warnDays: 100 }, NOW);
    expect(snap.daysUntilExpiry).toBe(90);
    expect(snap.status).toBe('due-soon');
  });

  it('normalises certExpiry to YYYY-MM-DD even when an ISO timestamp is supplied', () => {
    const snap = computeHalalStatus('BPJPH-008', '2027-03-15T08:30:00Z', {}, NOW);
    expect(snap.certExpiry).toBe('2027-03-15');
  });

  it('echoes the cert number on the snapshot', () => {
    const snap = computeHalalStatus('BPJPH-009', '2027-01-01', {}, NOW);
    expect(snap.certNumber).toBe('BPJPH-009');
  });
});

describe('summarizeHalalFleet', () => {
  it('counts by status', () => {
    const snaps = [
      computeHalalStatus('A', '2030-01-01', {}, NOW), // certified
      computeHalalStatus('B', '2026-07-24', {}, NOW), // due-soon
      computeHalalStatus('C', '2026-04-01', {}, NOW), // expired
      computeHalalStatus(null, null, {}, NOW),        // unknown
    ];
    expect(summarizeHalalFleet(snaps)).toEqual({
      total: 4,
      counts: { certified: 1, 'due-soon': 1, expired: 1, unknown: 1 },
    });
  });

  it('handles an empty fleet', () => {
    expect(summarizeHalalFleet([])).toEqual({
      total: 0,
      counts: { certified: 0, 'due-soon': 0, expired: 0, unknown: 0 },
    });
  });
});

describe('formatHalalCountdown', () => {
  it('renders unknown as em dash', () => {
    expect(formatHalalCountdown(null)).toBe('—');
  });

  it('uses days under the 60-day cutoff', () => {
    expect(formatHalalCountdown(12)).toBe('12 d');
    expect(formatHalalCountdown(59)).toBe('59 d');
  });

  it('uses months at 60+ days', () => {
    expect(formatHalalCountdown(60)).toBe('2 mo');
    expect(formatHalalCountdown(180)).toBe('6 mo');
  });

  it('prepends minus for expired with U+2212', () => {
    expect(formatHalalCountdown(-1)).toBe('−1 d');
    expect(formatHalalCountdown(-100)).toBe('−100 d');
  });
});

describe('HALAL constants reflect BPJPH regime', () => {
  it('BPJPH cert validity is 4 years (reference only — not enforced)', () => {
    expect(HALAL_CERT_VALIDITY_YEARS).toBe(4);
  });

  it('default warn window is 60 days (BPJPH renewal lead time)', () => {
    expect(HALAL_WARN_DAYS).toBe(60);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /opt/tlacak-web && npx vitest run src/features/compliance/lib/__tests__/halal.test.ts`
Expected: FAIL — "Failed to resolve import '../halal'".

- [ ] **Step 3: Implement the module**

Create `src/features/compliance/lib/halal.ts` with this exact content:

```ts
/**
 * Halal logistics readiness compliance math.
 *
 * Indonesia's Halal Product Assurance Law (UU 33/2014) + PP 39/2021
 * makes BPJPH halal certification mandatory across the supply chain.
 * For food & beverage the deadline was 17 Oct 2024 — already in force.
 * For non-food (pharma, cosmetics) the deadline is 17 Oct 2026. A truck
 * caught at a Bulog/distributor gate without a valid certificate loses
 * the contract on the spot.
 *
 * No fleet tracking app in the Indonesian market — TransTRACK, McEasy,
 * Cartrack ID, GPSku — surfaces BPJPH certificate state today. This is
 * the sixth and final module of OneFleet's Compliance Co-Pilot, after
 * MyPertamina fuel quota, KIR inspection, ODOL load advisor, B40 filter
 * schedule, and Banjir awareness.
 *
 * We read the operator-logged certificate identity + expiry from
 * `device.attributes.halalCertNumber` (string) and
 * `device.attributes.halalCertExpiry` (ISO 8601 date). Optional
 * `halalLastSanitization` and `halalCargoCategory` are surfaced in the
 * table as informational columns but do not drive status (PP 39/2021
 * does not fix a sanitation interval, only "between haram→halal hauls",
 * so any fixed-period warning would be a false positive).
 */

import dayjs from 'dayjs';

/** BPJPH halal certificates are issued for 4 years. Reference only —
 *  surfaced in the source-law ribbon. Status is driven by expiry, not
 *  by computing from issuance. */
export const HALAL_CERT_VALIDITY_YEARS = 4;

/** Days-until-expiry threshold below which we flip to due-soon.
 *  BPJPH renewal typically takes 30-45 days; 60 days gives operators
 *  enough runway to start the paperwork. */
export const HALAL_WARN_DAYS = 60;

export type HalalStatus = 'certified' | 'due-soon' | 'expired' | 'unknown';

export interface HalalSnapshot {
  /** Echo of the input cert number, or null if blank. */
  certNumber: string | null;
  /** Echo of the input expiry, normalised to YYYY-MM-DD, or null. */
  certExpiry: string | null;
  /** Days from today to expiry; negative if expired. null if unknown. */
  daysUntilExpiry: number | null;
  status: HalalStatus;
}

export interface HalalThresholds {
  /** Days-until-expiry cutoff for the "due-soon" warning state. Default 60. */
  warnDays?: number;
}

/**
 * Compute the Halal readiness snapshot for a vehicle.
 * Pure function — `now` injected to keep deterministic for tests.
 */
export function computeHalalStatus(
  certNumber: string | null | undefined,
  certExpiry: string | null | undefined,
  thresholds: HalalThresholds = {},
  now: Date = new Date(),
): HalalSnapshot {
  const warnDays = thresholds.warnDays ?? HALAL_WARN_DAYS;

  if (!certNumber) {
    return { certNumber: null, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }
  if (!certExpiry) {
    return { certNumber, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }

  const expiry = dayjs(certExpiry);
  if (!expiry.isValid()) {
    return { certNumber, certExpiry: null, daysUntilExpiry: null, status: 'unknown' };
  }

  const today = dayjs(now).startOf('day');
  const daysUntilExpiry = expiry.startOf('day').diff(today, 'day');

  let status: HalalStatus;
  if (daysUntilExpiry < 0) {
    status = 'expired';
  } else if (daysUntilExpiry <= warnDays) {
    status = 'due-soon';
  } else {
    status = 'certified';
  }

  return {
    certNumber,
    certExpiry: expiry.format('YYYY-MM-DD'),
    daysUntilExpiry,
    status,
  };
}

export interface FleetHalalSummary {
  total: number;
  counts: Record<HalalStatus, number>;
}

export function summarizeHalalFleet(snapshots: HalalSnapshot[]): FleetHalalSummary {
  const counts: Record<HalalStatus, number> = {
    certified: 0,
    'due-soon': 0,
    expired: 0,
    unknown: 0,
  };
  for (const snap of snapshots) {
    counts[snap.status] += 1;
  }
  return { total: snapshots.length, counts };
}

/**
 * Human-readable countdown — matches `formatKirCountdown` for visual
 * parity across Compliance modules.
 * - expired:  "−12 d" (U+2212 minus)
 * - due-soon: "12 d"
 * - certified: "3 mo" (or "12 d" if under 60 days)
 */
export function formatHalalCountdown(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return '—';
  if (daysUntilExpiry < 0) return `−${Math.abs(daysUntilExpiry)} d`;
  if (daysUntilExpiry >= 60) return `${Math.floor(daysUntilExpiry / 30)} mo`;
  return `${daysUntilExpiry} d`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /opt/tlacak-web && npx vitest run src/features/compliance/lib/__tests__/halal.test.ts`
Expected: PASS — 19 tests passing (11 computeHalalStatus + 2 summarizeHalalFleet + 4 formatHalalCountdown + 2 HALAL constants).

---

## Task 2: use-fleet-halal hook

**Files:**
- Create: `src/features/compliance/lib/use-fleet-halal.ts`

- [ ] **Step 1: Build the hook**

Create `src/features/compliance/lib/use-fleet-halal.ts` with this exact content:

```ts
import { useMemo } from 'react';
import { useDevicesQuery, type Device } from '@/entities/device';
import {
  computeHalalStatus,
  summarizeHalalFleet,
  type HalalSnapshot,
  type FleetHalalSummary,
} from './halal';

export interface HalalRow {
  deviceId: number;
  deviceName: string;
  uniqueId: string | null;
  /** Operator-logged last sanitization date (info only — no status impact). */
  lastSanitization: string | null;
  /** Operator-flagged cargo category (info only). */
  cargoCategory: string | null;
  snapshot: HalalSnapshot;
}

function strAttr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function certNumberOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCertNumber);
}

function certExpiryOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCertExpiry);
}

function lastSanitizationOf(device: Device): string | null {
  return strAttr(device.attributes?.halalLastSanitization);
}

function cargoCategoryOf(device: Device): string | null {
  return strAttr(device.attributes?.halalCargoCategory);
}

/**
 * Derives BPJPH halal-certification readiness for every visible device
 * from operator-logged `device.attributes.halal*` fields. Devices with
 * no `halalCertNumber` surface as status `unknown` so the operator can
 * see and address them. No backend changes — reuses `useDevicesQuery`.
 */
export function useFleetHalalQuery() {
  const devicesQ = useDevicesQuery();
  const devices = useMemo(() => devicesQ.data ?? [], [devicesQ.data]);

  const rows = useMemo<HalalRow[]>(
    () =>
      devices.map((device) => ({
        deviceId: device.id as number,
        deviceName: device.name ?? '—',
        uniqueId: (device as { uniqueId?: string }).uniqueId ?? null,
        lastSanitization: lastSanitizationOf(device),
        cargoCategory: cargoCategoryOf(device),
        snapshot: computeHalalStatus(certNumberOf(device), certExpiryOf(device)),
      })),
    [devices],
  );

  const summary = useMemo<FleetHalalSummary>(
    () => summarizeHalalFleet(rows.map((r) => r.snapshot)),
    [rows],
  );

  return {
    rows,
    summary,
    isLoading: devicesQ.isLoading,
    isFetching: devicesQ.isFetching,
    error: devicesQ.error,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0.

---

## Task 3: Barrel export

**Files:**
- Modify: `src/features/compliance/index.ts`

- [ ] **Step 1: Add halal exports to the barrel**

Edit `src/features/compliance/index.ts`. Find the final block:

```ts
export {
  useFleetB40Query,
  type B40Row,
} from './lib/use-fleet-b40';
```

(NOTE: the exact lines may differ slightly; use whatever the LAST block in the file is — it adds B40 exports). Append a new block AFTER it:

```ts

export {
  HALAL_CERT_VALIDITY_YEARS,
  HALAL_WARN_DAYS,
  computeHalalStatus,
  summarizeHalalFleet,
  formatHalalCountdown,
  type HalalSnapshot,
  type HalalStatus,
  type FleetHalalSummary,
} from './lib/halal';
export { useFleetHalalQuery, type HalalRow } from './lib/use-fleet-halal';
```

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0.

---

## Task 4: HalalPage

**Files:**
- Create: `src/pages/compliance/HalalPage.tsx`

- [ ] **Step 1: Build the page**

Create `src/pages/compliance/HalalPage.tsx` with this exact content:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ComplianceLayout } from '@/features/compliance/ui/ComplianceLayout';
import {
  useFleetHalalQuery,
  formatHalalCountdown,
  HALAL_CERT_VALIDITY_YEARS,
  HALAL_WARN_DAYS,
  type HalalRow,
  type HalalStatus,
} from '@/features/compliance';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const STATUS_VARIANT: Record<HalalStatus, 'moving' | 'warning' | 'alert' | 'offline'> = {
  certified: 'moving',
  'due-soon': 'warning',
  expired: 'alert',
  unknown: 'offline',
};

const STATUS_LABEL_KEY: Record<HalalStatus, string> = {
  certified: 'halalStatusCertified',
  'due-soon': 'halalStatusDueSoon',
  expired: 'halalStatusExpired',
  unknown: 'halalStatusUnknown',
};

const STATUS_TEXT_COLOR: Record<HalalStatus, string> = {
  certified: 'text-primary',
  'due-soon': 'text-[var(--color-warning)]',
  expired: 'text-destructive cyber-glow-alert',
  unknown: 'text-muted-foreground',
};

const STATUS_ORDER: Record<HalalStatus, number> = {
  expired: 0,
  'due-soon': 1,
  unknown: 2,
  certified: 3,
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

export default function HalalPage() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetHalalQuery();

  // Sort by urgency: expired first (descending overdue), then due-soon
  // (ascending days), then unknown, then certified (ascending days).
  const sorted = useMemo<HalalRow[]>(
    () =>
      [...rows].sort((a, b) => {
        const stOrder = STATUS_ORDER[a.snapshot.status] - STATUS_ORDER[b.snapshot.status];
        if (stOrder !== 0) return stOrder;
        const ad = a.snapshot.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
        const bd = b.snapshot.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      }),
    [rows],
  );

  const expiredOrSoon = summary.counts.expired + summary.counts['due-soon'];

  return (
    <ComplianceLayout titleKey="complianceHalal">
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label={t('halalTotalTracked')}
            value={summary.total - summary.counts.unknown}
            meta={`/ ${summary.total} ${t('halalVehicles')}`}
            tone="primary"
            depth="tall"
          />
          <MetricTile
            label={t('halalStatusExpired')}
            value={summary.counts.expired}
            meta={t('halalExpiredMeta')}
            tone={summary.counts.expired > 0 ? 'alert' : 'dim'}
            depth={summary.counts.expired > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('halalStatusDueSoon')}
            value={summary.counts['due-soon']}
            meta={`${t('halalDueSoonMeta')} ${HALAL_WARN_DAYS} ${t('halalDays')}`}
            tone={summary.counts['due-soon'] > 0 ? 'warning' : 'dim'}
            depth={summary.counts['due-soon'] > 0 ? 'elevated' : 'recessed'}
          />
          <MetricTile
            label={t('halalStatusUnknown')}
            value={summary.counts.unknown}
            meta={t('halalUnknownMeta')}
            tone={summary.counts.unknown > 0 ? 'warning' : 'dim'}
            depth="flat"
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-y border-border bg-card/40 px-4 py-2">
          <div className="cyber-label flex items-center gap-2 text-[10px]">
            <span className="text-primary">●</span>
            {t('halalSourceLaw')}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {t('halalValidityLabel')} {HALAL_CERT_VALIDITY_YEARS} {t('halalYears')}
            <span className="mx-2">·</span>
            {t('halalWarnLabel')} {HALAL_WARN_DAYS} {t('halalDays')}
          </div>
        </div>

        {expiredOrSoon > 0 && (
          <div className="mt-3 border border-destructive/60 bg-destructive/[0.08] depth-elevated-tall p-3">
            <div className="flex items-center gap-2">
              <span className="cyber-label text-[10px] text-destructive cyber-glow-alert">
                ⚠ {t('halalAlertTitle')}
              </span>
              <span className="font-mono text-[11px] text-foreground tracking-wide">
                {t('halalAlertBody', { count: expiredOrSoon })}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 depth-flat border border-border overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr>
                <Th>{t('sharedName')}</Th>
                <Th>{t('sharedPlate')}</Th>
                <Th>{t('halalColCertNumber')}</Th>
                <Th>{t('halalColCertExpiry')}</Th>
                <Th>{t('halalColLastSanitization')}</Th>
                <Th>{t('halalColCargoCategory')}</Th>
                <Th align="right">{t('halalColCountdown')}</Th>
                <Th>{t('quotaStatus')}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center cyber-label">
                    {isLoading ? t('sharedLoading') : t('sharedNoData')}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr
                    key={row.deviceId}
                    className="border-b border-border/60 transition-colors hover:bg-primary/[0.04]"
                  >
                    <Td>
                      <span className="font-mono text-[13px] font-bold uppercase tracking-wider text-foreground">
                        {row.deviceName}
                      </span>
                    </Td>
                    <Td>
                      {row.uniqueId && (
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          {row.uniqueId}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-mono text-muted-foreground">
                        {row.snapshot.certNumber ?? '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-foreground">
                        {row.snapshot.certExpiry ?? '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-muted-foreground">
                        {row.lastSanitization ?? '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {row.cargoCategory ?? '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'font-mono font-semibold tabular-nums',
                          STATUS_TEXT_COLOR[row.snapshot.status],
                        )}
                      >
                        {formatHalalCountdown(row.snapshot.daysUntilExpiry)}
                      </span>
                    </Td>
                    <Td>
                      <Badge
                        variant={STATUS_VARIANT[row.snapshot.status]}
                        size="sm"
                        bracketed
                      >
                        {t(STATUS_LABEL_KEY[row.snapshot.status])}
                      </Badge>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wider leading-relaxed max-w-3xl">
          {t('halalFootnote')}
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

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0. (i18n keys not yet added — `t()` falls back to key string, no compile error.)

---

## Task 5: Router entry

**Files:**
- Modify: `src/app/router.tsx`

- [ ] **Step 1: Add the lazy route**

Edit `src/app/router.tsx`. Find:

```tsx
      {
        path: 'compliance/banjir',
        element: lazyRoute(() => import('@/pages/compliance/BanjirPage')),
      },
    ],
```

Replace with:

```tsx
      {
        path: 'compliance/banjir',
        element: lazyRoute(() => import('@/pages/compliance/BanjirPage')),
      },
      {
        path: 'compliance/halal',
        element: lazyRoute(() => import('@/pages/compliance/HalalPage')),
      },
    ],
```

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0.

---

## Task 6: ComplianceLayout nav entry

**Files:**
- Modify: `src/features/compliance/ui/ComplianceLayout.tsx`

- [ ] **Step 1: Add the 7th nav entry**

Edit `src/features/compliance/ui/ComplianceLayout.tsx`. Find:

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

Replace with:

```tsx
const ENTRIES = [
  { path: '/compliance', labelKey: 'complianceMorningBrief', end: true },
  { path: '/compliance/fuel-quota', labelKey: 'complianceFuelQuota' },
  { path: '/compliance/kir', labelKey: 'complianceKir' },
  { path: '/compliance/odol', labelKey: 'complianceOdol' },
  { path: '/compliance/b40', labelKey: 'complianceB40' },
  { path: '/compliance/banjir', labelKey: 'complianceBanjir' },
  { path: '/compliance/halal', labelKey: 'complianceHalal' },
];
```

---

## Task 7: HalalPanel + drop UpcomingPanel from ComplianceBriefPage

**Files:**
- Modify: `src/pages/compliance/ComplianceBriefPage.tsx`

This task adds the inline `HalalPanel` function (same shape as `KirPanel`) and removes the now-empty `UpcomingPanel` + its container entirely. Halal is the last roadmap item; with it active, the brief is 100% active modules.

- [ ] **Step 1: Add useFleetHalalQuery + formatHalalCountdown + HalalRow to the compliance imports**

Edit `src/pages/compliance/ComplianceBriefPage.tsx`. Find the compliance barrel import:

```tsx
import {
  useFleetQuotaQuery,
  useFleetKirQuery,
  useFleetOdolQuery,
  useFleetB40Query,
  formatRupiahCompact,
  formatKirCountdown,
  formatB40Countdown,
  type QuotaRow,
  type KirRow,
  type B40Row,
} from '@/features/compliance';
```

Replace with:

```tsx
import {
  useFleetQuotaQuery,
  useFleetKirQuery,
  useFleetOdolQuery,
  useFleetB40Query,
  useFleetHalalQuery,
  formatRupiahCompact,
  formatKirCountdown,
  formatB40Countdown,
  formatHalalCountdown,
  type QuotaRow,
  type KirRow,
  type B40Row,
  type HalalRow,
} from '@/features/compliance';
```

- [ ] **Step 2: Insert HalalPanel inline function**

Find the existing `B40Panel` function (it ends with a closing `}`). Just before the next function declaration (likely `UpcomingPanel` or `function UpcomingPanel()`), insert this exact block:

```tsx
function HalalPanel() {
  const { t } = useTranslation();
  const { rows, summary, isLoading } = useFleetHalalQuery();

  const expiredOrSoon = useMemo<HalalRow[]>(
    () =>
      rows
        .filter((r) => r.snapshot.status === 'expired' || r.snapshot.status === 'due-soon')
        .sort((a, b) => (a.snapshot.daysUntilExpiry ?? 0) - (b.snapshot.daysUntilExpiry ?? 0))
        .slice(0, 5),
    [rows],
  );

  let badge = '';
  let badgeTone: 'primary' | 'warning' | 'alert' = 'primary';
  if (summary.counts.expired > 0) {
    badge = `${summary.counts.expired} ${t('briefExpired')}`;
    badgeTone = 'alert';
  } else if (summary.counts['due-soon'] > 0) {
    badge = `${summary.counts['due-soon']} ${t('briefDueSoon')}`;
    badgeTone = 'warning';
  } else {
    badge = t('briefAllCertified');
  }

  return (
    <div className="depth-elevated-shallow relative flex flex-col gap-3 p-4">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />
      <div className="relative">
        <BriefHeader
          label={t('complianceHalal')}
          badge={badge}
          badgeTone={badgeTone}
          to="/compliance/halal"
        />
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <div>
          <div className="cyber-label text-[9px]">{t('halalStatusCertified')}</div>
          <div className="font-mono text-lg font-bold tabular-nums text-primary">
            {summary.counts.certified}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('halalStatusDueSoon')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts['due-soon'] > 0
                ? 'text-[var(--color-warning)]'
                : 'text-muted-foreground',
            )}
          >
            {summary.counts['due-soon']}
          </div>
        </div>
        <div>
          <div className="cyber-label text-[9px]">{t('halalStatusExpired')}</div>
          <div
            className={cn(
              'font-mono text-lg font-bold tabular-nums',
              summary.counts.expired > 0
                ? 'text-destructive cyber-glow-alert'
                : 'text-muted-foreground',
            )}
          >
            {summary.counts.expired}
          </div>
        </div>
      </div>

      {expiredOrSoon.length > 0 && (
        <div className="relative border-t border-border pt-3">
          <div className="cyber-label text-[9px] mb-2">{t('briefAttention')}</div>
          <ul className="flex flex-col gap-1.5 font-mono text-xs">
            {expiredOrSoon.map((r) => (
              <li
                key={r.deviceId}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span className="text-foreground tracking-wide truncate max-w-[16rem]">
                  {r.deviceName}
                  {r.uniqueId && (
                    <span className="text-muted-foreground tracking-[0.14em] ms-2 text-[10px] uppercase">
                      {r.uniqueId}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'tabular-nums tracking-wider font-semibold',
                    r.snapshot.status === 'expired'
                      ? 'text-destructive cyber-glow-alert'
                      : 'text-[var(--color-warning)]',
                  )}
                >
                  {formatHalalCountdown(r.snapshot.daysUntilExpiry)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && expiredOrSoon.length === 0 && (
        <div className="relative cyber-label">{t('sharedLoading')}</div>
      )}
    </div>
  );
}

```

- [ ] **Step 3: Delete the UpcomingPanel function entirely**

Find the `UpcomingPanel` function definition (starts with `function UpcomingPanel() {`) and delete the entire function including its closing `}`. It currently looks something like:

```tsx
function UpcomingPanel() {
  const { t } = useTranslation();
  // Roadmap items still queued — render as recessed tiles. Each item is
  // a real Indonesia regulation surfaced by the May 2026 research.
  const upcoming: { key: string; titleKey: string; descKey: string }[] = [
    { key: 'halal', titleKey: 'briefHalalTitle', descKey: 'briefHalalDesc' },
  ];
  return (
    <div className="depth-recessed-shallow relative flex flex-col gap-3 p-4">
      ... (entire JSX block)
    </div>
  );
}
```

Delete the WHOLE function and the blank line before/after it. Use Read first to see the exact current content, then Edit to remove it.

- [ ] **Step 4: Insert HalalPanel into the active-modules grid + delete the UpcomingPanel container**

Find:

```tsx
        {/* Active modules: Fuel Quota · KIR · ODOL · B40 · Banjir */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <FuelQuotaPanel />
          <KirPanel />
          <OdolPanel />
          <B40Panel />
          <BanjirPanel />
        </div>

        {/* Upcoming compliance modules */}
        <div className="mt-4">
          <UpcomingPanel />
        </div>
```

Replace with:

```tsx
        {/* Active modules: Fuel Quota · KIR · ODOL · B40 · Banjir · Halal */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <FuelQuotaPanel />
          <KirPanel />
          <OdolPanel />
          <B40Panel />
          <BanjirPanel />
          <HalalPanel />
        </div>
```

- [ ] **Step 5: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0.

---

## Task 8: i18n keys (en + id)

**Files:**
- Modify: `src/shared/i18n/locales/en.json`
- Modify: `src/shared/i18n/locales/id.json`

- [ ] **Step 1: Remove the orphaned Halal-in-Upcoming keys (en)**

Edit `src/shared/i18n/locales/en.json`. Find and delete these two lines:

```json
  "briefHalalTitle": "Halal Logistics Log",
  "briefHalalDesc": "Temperature + segregation record. Mandatory Oct 17, 2026 for food fleets.",
```

- [ ] **Step 2: Append the new Halal keys + add `briefAllCertified` (en)**

Find the very last line of `src/shared/i18n/locales/en.json` — the closing `}` preceded by the final key-value pair (added by Banjir task 10 — `"banjirStaleNotice": "..."` or similar). Use Read first to confirm exactly what the last key is, then replace it + the closing brace with the same line + a comma + the new keys + the closing brace:

```json
  "banjirStaleNotice": "Feed has not refreshed recently — last data may be outdated.",
  "complianceHalal": "Halal Readiness",
  "halalTotalTracked": "Tracked",
  "halalVehicles": "vehicles",
  "halalStatusCertified": "Certified",
  "halalStatusDueSoon": "Due soon",
  "halalStatusExpired": "Expired",
  "halalStatusUnknown": "Unknown",
  "halalExpiredMeta": "past expiry",
  "halalDueSoonMeta": "within",
  "halalUnknownMeta": "no certificate on file",
  "halalSourceLaw": "UU 33/2014 · PP 39/2021 · BPJPH halal certification",
  "halalValidityLabel": "validity",
  "halalWarnLabel": "warn at",
  "halalYears": "years",
  "halalDays": "days",
  "halalAlertTitle": "ATTENTION REQUIRED",
  "halalAlertBody": "{{count}} vehicle(s) need BPJPH renewal within the next 60 days or are already expired.",
  "halalColCertNumber": "Cert #",
  "halalColCertExpiry": "Cert expiry",
  "halalColLastSanitization": "Last sanitation",
  "halalColCargoCategory": "Cargo",
  "halalColCountdown": "Countdown",
  "halalFootnote": "BPJPH-issued halal logistics certificates are valid for 4 years (UU 33/2014, PP 39/2021). Food & beverage fleets fall under the active 17 Oct 2024 mandate; non-food (pharma, cosmetics) under the 17 Oct 2026 mandate. Operator sets per-vehicle on the Device page with `halalCertNumber`, `halalCertExpiry` (ISO date), plus optional `halalLastSanitization` and `halalCargoCategory`.",
  "briefAllCertified": "all certified"
}
```

If the very last key in the file is different from `banjirStaleNotice` (e.g. a hand-added key landed there), use that one's exact text as the anchor instead. The pattern is: turn the trailing `"<last-key>": "..."` line into the same line with a trailing comma, then add the 25 Halal-related lines, then the closing `}`.

- [ ] **Step 3: Remove the orphaned keys (id)**

Edit `src/shared/i18n/locales/id.json`. Find and delete these two lines:

```json
  "briefHalalTitle": "Log Logistik Halal",
  "briefHalalDesc": "Catatan suhu + pemisahan. Wajib 17 Okt 2026 untuk armada pangan.",
```

- [ ] **Step 4: Append the new Halal keys + add `briefAllCertified` (id)**

Mirror the en.json edit. Use the LAST key in `src/shared/i18n/locales/id.json` (likely `"banjirStaleNotice": "Feed belum refresh — data mungkin sudah usang."`) as the anchor. Replace it + the closing brace with:

```json
  "banjirStaleNotice": "Feed belum refresh — data mungkin sudah usang.",
  "complianceHalal": "Kesiapan Halal",
  "halalTotalTracked": "Tercatat",
  "halalVehicles": "kendaraan",
  "halalStatusCertified": "Bersertifikat",
  "halalStatusDueSoon": "Segera tempo",
  "halalStatusExpired": "Kedaluwarsa",
  "halalStatusUnknown": "Belum tercatat",
  "halalExpiredMeta": "lewat masa berlaku",
  "halalDueSoonMeta": "dalam",
  "halalUnknownMeta": "belum ada sertifikat",
  "halalSourceLaw": "UU 33/2014 · PP 39/2021 · sertifikasi halal BPJPH",
  "halalValidityLabel": "masa berlaku",
  "halalWarnLabel": "peringatan",
  "halalYears": "tahun",
  "halalDays": "hari",
  "halalAlertTitle": "BUTUH PERHATIAN",
  "halalAlertBody": "{{count}} kendaraan perlu perpanjangan BPJPH dalam 60 hari atau sudah kedaluwarsa.",
  "halalColCertNumber": "No. Sertifikat",
  "halalColCertExpiry": "Tanggal habis",
  "halalColLastSanitization": "Sanitasi terakhir",
  "halalColCargoCategory": "Kategori",
  "halalColCountdown": "Hitung mundur",
  "halalFootnote": "Sertifikat halal logistik BPJPH berlaku 4 tahun (UU 33/2014, PP 39/2021). Armada pangan tunduk mandat aktif 17 Okt 2024; non-pangan (farmasi, kosmetik) tunduk mandat 17 Okt 2026. Operator set per-kendaraan di halaman Device dengan `halalCertNumber`, `halalCertExpiry` (ISO date), plus opsional `halalLastSanitization` dan `halalCargoCategory`.",
  "briefAllCertified": "semua bersertifikat"
}
```

- [ ] **Step 5: Validate JSON syntax**

Run: `cd /opt/tlacak-web && node -e "JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/en.json', 'utf8')); JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/id.json', 'utf8')); console.log('ok')"`
Expected: `ok`.

---

## Task 9: Verify

**Files:** none new

- [ ] **Step 1: Run the full test suite**

Run: `cd /opt/tlacak-web && npx vitest run`
Expected: PASS — all tests green. Total should be the previous baseline (287) + 19 new Halal tests = **306 tests**.

If anything fails, fix it inline. Do NOT skip or comment out a failing test.

- [ ] **Step 2: Typecheck**

Run: `cd /opt/tlacak-web && npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Production build**

Run: `cd /opt/tlacak-web && npm run build`
Expected: build succeeds. Verify a `HalalPage-*.js` chunk appears in the asset list.

- [ ] **Step 4: Confirm the lazy chunk is reachable**

Run: `cd /opt/tlacak-web && ls build/assets/ | grep -iE "halal"`
Expected: at least one match (`HalalPage-<hash>.js`).

- [ ] **Step 5: Deploy to staging**

Run: `cd /opt/tlacak-web && bash scripts/build-staging.sh`
Expected: rebuild + placeholder substitution succeeds.

- [ ] **Step 6: Smoke test the new route over HTTPS**

Run: `curl -fsSI https://1f.val.id/compliance/halal | head -3 && curl -fsSI https://1f.val.id/compliance | head -3`
Expected: both return `HTTP/2 200`.

---

## Task 10: Atomic commit

**Files:** none new — stage existing changes only.

- [ ] **Step 1: Stage the files**

Run:
```bash
cd /opt/tlacak-web && git add \
  src/features/compliance/lib/halal.ts \
  src/features/compliance/lib/__tests__/halal.test.ts \
  src/features/compliance/lib/use-fleet-halal.ts \
  src/features/compliance/index.ts \
  src/features/compliance/ui/ComplianceLayout.tsx \
  src/pages/compliance/HalalPage.tsx \
  src/pages/compliance/ComplianceBriefPage.tsx \
  src/app/router.tsx \
  src/shared/i18n/locales/en.json \
  src/shared/i18n/locales/id.json
```

Then verify with: `cd /opt/tlacak-web && git status` — only the above paths should be in "Changes to be committed". Do not stage `.remember/`, untracked plan markdowns, or any other unrelated files.

- [ ] **Step 2: Commit**

Run:
```bash
cd /opt/tlacak-web && git commit -m "$(cat <<'EOF'
Add Halal Logistics readiness — BPJPH certificate dashboard

Sixth and final active slice of the Indonesia Compliance Co-Pilot.
UU 33/2014 + PP 39/2021 + BPJPH made halal certification mandatory
across the Indonesian supply chain: food & beverage fleets have
been under the 17 Oct 2024 mandate for 19 months already, non-food
(pharma, cosmetics) come under the 17 Oct 2026 deadline. A truck
caught at a Bulog/distributor gate without a valid certificate
loses the contract on the spot. No fleet tracking app in the
Indonesian market — TransTRACK, McEasy, Cartrack ID, GPSku —
surfaces BPJPH certificate state today.

Pattern: KIR-clone exactly. Pure math + hook + page + inline Brief
panel all colocated in src/features/compliance/, matching the
established convention from KIR/ODOL/B40/FuelQuota. (Banjir is
the only Compliance module with its own feature folder, because
of its external data dependency. Halal does not.)

Halal math (src/features/compliance/lib/halal.ts)
- `computeHalalStatus(certNumber, certExpiry, thresholds?, now?)`
  returns a snapshot with certNumber / certExpiry (normalised to
  YYYY-MM-DD) / daysUntilExpiry / status. 4-state enum:
  certified (>60d), due-soon (≤60d), expired (negative), unknown
  (no cert on file). 60-day warn matches BPJPH renewal lead time
  (30-45 days processing).
- `summarizeHalalFleet` rolls per-vehicle snapshots up;
  `formatHalalCountdown` renders "60 d" / "12 mo" / "−12 d" with
  U+2212 minus for visual parity with KIR.
- 16 unit tests cover threshold edges (60/61/30 days), unparseable
  dates, missing cert number, ISO timestamp normalisation, custom
  warn threshold, fleet aggregation, formatter edges.

Derivation hook (src/features/compliance/lib/use-fleet-halal.ts)
- Reads `device.attributes.halalCertNumber` (string) and
  `halalCertExpiry` (ISO date). Optional
  `halalLastSanitization` + `halalCargoCategory` surface as info
  columns but do not drive status — PP 39/2021 does not fix a
  sanitation interval (only "between haram→halal hauls"), so any
  fixed-period warning would be a false positive.
- `useFleetHalalQuery()` produces one `HalalRow` per device plus
  a `FleetHalalSummary` (status counts).

Page (src/pages/compliance/HalalPage.tsx)
- Four mixing-board hero tiles: Tracked (tall · cyan glow) ·
  Expired (alert + elevated when > 0) · Due Soon (warning) ·
  Unknown (warning when > 0, flat).
- Source-law ribbon citing UU 33/2014 + PP 39/2021 + BPJPH +
  4-year validity + 60-day warn.
- Alert banner when expired + due-soon > 0.
- Per-vehicle table sorted by urgency (expired first, then due-
  soon ascending, then unknown, then certified). Columns: name,
  plate, cert #, cert expiry, last sanitation, cargo category,
  countdown, status badge.
- Footnote: mandate context + the four operator-set attribute
  names.

Morning Brief
- New inline HalalPanel slots into the brief grid alongside
  FuelQuota / KIR / ODOL / B40 / Banjir. Grid stays at
  lg:grid-cols-2 xl:grid-cols-3 — six panels fit cleanly as 2
  rows of 3 on xl, 3 rows of 2 on lg.
- UpcomingPanel + its container removed entirely. Halal was the
  last roadmap item, so the brief is now 100% active modules.
- 4 orphan keys removed (briefHalalTitle + briefHalalDesc from
  both en + id).

Routes
- /compliance/halal → HalalPage (lazy-loaded chunk).
- ComplianceLayout nav rail now has 7 entries
  (Morning Brief · Fuel Quota · KIR · ODOL · B40 · Banjir · Halal).

i18n
- 24 new keys added to en + id (Bahasa Indonesia) covering
  status labels, hero tile metas, source-law ribbon, alert banner,
  column headers, brief panel headline, and the footnote.
  briefAllCertified added to both locales.

Verified: 306 unit tests pass (19 new for Halal math), typecheck
clean, build succeeds (HalalPage-*.js chunk emitted), /compliance
and /compliance/halal return HTTP 200 on staging.

Compliance Co-Pilot is now 6/6 active modules — closing the
Indonesia regulatory MVP. Future iterations documented in
docs/superpowers/specs/2026-05-25-halal-logistics-readiness-design.md
§10: live temperature monitoring for chilled cargo (Path B,
~3-4 hours), full audit log with per-trip manifest + PDF export
for BPJPH inspectors (Path C, multi-day, needs backend manifest
entity, gated on customer demand).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Confirm clean post-commit state**

Run: `cd /opt/tlacak-web && git log --oneline -3 && git status`
Expected: latest commit is the Halal one; working tree clean apart from previously-untracked unrelated files.

---

## Done

The 6th and final active Compliance Co-Pilot module ships. Module count: 6/6 (Fuel Quota · KIR · ODOL · B40 · Banjir · Halal). The Compliance Brief is 100% active modules with no roadmap row. The Indonesia regulatory compliance MVP is complete.
