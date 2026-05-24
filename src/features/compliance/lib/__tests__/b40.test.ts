import { describe, expect, it } from 'vitest';
import {
  computeB40Status,
  summarizeB40Fleet,
  formatB40Countdown,
  B40_DEFAULT_INTERVAL_KM,
  B40_DEFAULT_INTERVAL_MONTHS,
} from '../b40';

const NOW = new Date('2026-05-24T12:00:00Z');

describe('computeB40Status', () => {
  it('returns unknown when no last-change data is provided', () => {
    const snap = computeB40Status({}, {}, NOW);
    expect(snap.status).toBe('unknown');
    expect(snap.kmUntilDue).toBeNull();
    expect(snap.daysUntilDue).toBeNull();
    expect(snap.nextDueKm).toBeNull();
    expect(snap.nextDueDate).toBeNull();
  });

  it('returns unknown when only currentKm is known but no last change', () => {
    expect(computeB40Status({ currentKm: 50_000 }, {}, NOW).status).toBe('unknown');
  });

  it('reports km axis when km data is complete', () => {
    // last 40_000, current 45_000, interval 10_000 → due at 50_000 → 5_000 km to go
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 45_000 },
      {},
      NOW,
    );
    expect(snap.nextDueKm).toBe(50_000);
    expect(snap.kmUntilDue).toBe(5_000);
    expect(snap.status).toBe('valid');
    expect(snap.axis).toBe('km');
  });

  it('reports time axis when only date data is known', () => {
    // 2026-03-24 last → +6mo = 2026-09-24 → from 2026-05-24 → 123 days
    const snap = computeB40Status({ lastChangeDate: '2026-03-24' }, {}, NOW);
    expect(snap.nextDueDate).toBe('2026-09-24');
    expect(snap.daysUntilDue).toBe(123);
    expect(snap.kmUntilDue).toBeNull();
    expect(snap.status).toBe('valid');
    expect(snap.axis).toBe('time');
  });

  it('reports both axes when km and date are both known and picks the closer to expiry', () => {
    // km axis: 9_500 used of 10_000 → 500 km remaining (due-soon)
    // time axis: changed today, 6 months away → valid
    // Binding axis = km (closer to expiry)
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 49_500, lastChangeDate: NOW.toISOString() },
      {},
      NOW,
    );
    expect(snap.kmUntilDue).toBe(500);
    expect(snap.status).toBe('due-soon');
    expect(snap.axis).toBe('km');
  });

  it('flips to due-soon at exactly 1500 km remaining', () => {
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 48_500 },
      {},
      NOW,
    );
    expect(snap.kmUntilDue).toBe(1_500);
    expect(snap.status).toBe('due-soon');
  });

  it('stays valid at 1501 km remaining', () => {
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 48_499 },
      {},
      NOW,
    );
    expect(snap.kmUntilDue).toBe(1_501);
    expect(snap.status).toBe('valid');
  });

  it('flips to due-soon at exactly 30 days remaining (time axis only)', () => {
    // due at lastDate + 6 mo. We want next - today = 30. Today 2026-05-24, next 2026-06-23.
    // → lastDate = 2025-12-23.
    const snap = computeB40Status({ lastChangeDate: '2025-12-23' }, {}, NOW);
    expect(snap.daysUntilDue).toBe(30);
    expect(snap.status).toBe('due-soon');
  });

  it('reports overdue when km is past interval', () => {
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 52_000 },
      {},
      NOW,
    );
    expect(snap.kmUntilDue).toBe(-2_000);
    expect(snap.status).toBe('overdue');
  });

  it('reports overdue when only time axis is past', () => {
    // 2025-10-01 last → +6mo = 2026-04-01 → 53 days overdue
    const snap = computeB40Status({ lastChangeDate: '2025-10-01' }, {}, NOW);
    expect(snap.daysUntilDue).toBe(-53);
    expect(snap.status).toBe('overdue');
  });

  it('reports overdue if either axis is past, even when the other is valid', () => {
    // time axis overdue (-53d), km axis fresh
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 40_100, lastChangeDate: '2025-10-01' },
      {},
      NOW,
    );
    expect(snap.status).toBe('overdue');
    expect(snap.axis).toBe('time');
  });

  it('honours a custom intervalKm', () => {
    // interval 5000 — sturdier filter regime
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 44_000, intervalKm: 5_000 },
      {},
      NOW,
    );
    expect(snap.nextDueKm).toBe(45_000);
    expect(snap.kmUntilDue).toBe(1_000);
    expect(snap.status).toBe('due-soon');
  });

  it('honours a custom warnKm threshold', () => {
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 47_000 },
      { warnKm: 3_500 },
      NOW,
    );
    expect(snap.kmUntilDue).toBe(3_000);
    expect(snap.status).toBe('due-soon');
  });

  it('honours a custom warnDays threshold', () => {
    // 2026-01-08 last → +6mo = 2026-07-08 → from 2026-05-24 → 45 days.
    // Default 30-day window would still classify as valid; widened 60-day → due-soon.
    const snap = computeB40Status({ lastChangeDate: '2026-01-08' }, { warnDays: 60 }, NOW);
    expect(snap.daysUntilDue).toBe(45);
    expect(snap.status).toBe('due-soon');
  });

  it('returns unknown for an unparseable date', () => {
    expect(computeB40Status({ lastChangeDate: 'not-a-date' }, {}, NOW).status).toBe('unknown');
  });

  it('ignores negative or zero intervalKm and falls back to default', () => {
    const snap = computeB40Status(
      { lastChangeKm: 40_000, currentKm: 41_000, intervalKm: 0 },
      {},
      NOW,
    );
    expect(snap.nextDueKm).toBe(40_000 + B40_DEFAULT_INTERVAL_KM);
  });

  it('returns unknown when km data is incomplete (last set but currentKm missing)', () => {
    const snap = computeB40Status({ lastChangeKm: 40_000 }, {}, NOW);
    expect(snap.status).toBe('unknown');
    expect(snap.kmUntilDue).toBeNull();
  });
});

describe('summarizeB40Fleet', () => {
  it('counts by status', () => {
    const snaps = [
      computeB40Status({ lastChangeKm: 40_000, currentKm: 45_000 }, {}, NOW), // valid
      computeB40Status({ lastChangeKm: 40_000, currentKm: 49_500 }, {}, NOW), // due-soon
      computeB40Status({ lastChangeKm: 40_000, currentKm: 52_000 }, {}, NOW), // overdue
      computeB40Status({}, {}, NOW), // unknown
    ];
    expect(summarizeB40Fleet(snaps)).toEqual({
      total: 4,
      counts: { valid: 1, 'due-soon': 1, overdue: 1, unknown: 1 },
    });
  });

  it('handles an empty fleet', () => {
    expect(summarizeB40Fleet([])).toEqual({
      total: 0,
      counts: { valid: 0, 'due-soon': 0, overdue: 0, unknown: 0 },
    });
  });
});

describe('formatB40Countdown', () => {
  it('renders unknown as em dash', () => {
    expect(formatB40Countdown(null, 'km')).toBe('—');
    expect(formatB40Countdown(null, 'time')).toBe('—');
  });

  it('uses km units on the km axis', () => {
    expect(formatB40Countdown(2_500, 'km')).toBe('2,500 km');
    expect(formatB40Countdown(500, 'km')).toBe('500 km');
  });

  it('uses day/month units on the time axis like KIR', () => {
    expect(formatB40Countdown(12, 'time')).toBe('12 d');
    expect(formatB40Countdown(180, 'time')).toBe('6 mo');
  });

  it('prepends minus for overdue', () => {
    expect(formatB40Countdown(-1_500, 'km')).toBe('−1,500 km');
    expect(formatB40Countdown(-12, 'time')).toBe('−12 d');
  });
});

describe('B40 constants reflect Indonesian B40 regime', () => {
  it('default interval is 10,000 km (Pertamina + ATPM guidance for B40)', () => {
    expect(B40_DEFAULT_INTERVAL_KM).toBe(10_000);
  });

  it('default time-axis fallback is 6 months', () => {
    expect(B40_DEFAULT_INTERVAL_MONTHS).toBe(6);
  });
});
