import { describe, expect, it } from 'vitest';
import { computeKirStatus, summarizeKirFleet, formatKirCountdown } from '../kir';

const NOW = new Date('2026-05-24T12:00:00Z');

describe('computeKirStatus', () => {
  it('returns unknown for missing input', () => {
    const snap = computeKirStatus(null, {}, NOW);
    expect(snap.status).toBe('unknown');
    expect(snap.daysUntilDue).toBeNull();
    expect(snap.nextDue).toBeNull();
  });

  it('returns unknown for an unparseable date string', () => {
    expect(computeKirStatus('not a date', {}, NOW).status).toBe('unknown');
  });

  it('projects next due as last + 6 months', () => {
    const snap = computeKirStatus('2026-01-15', {}, NOW);
    expect(snap.nextDue).toBe('2026-07-15');
  });

  it('reports days until due', () => {
    // 2026-01-15 last → 2026-07-15 due → 2026-05-24 today → 52 days
    const snap = computeKirStatus('2026-01-15', {}, NOW);
    expect(snap.daysUntilDue).toBe(52);
    expect(snap.status).toBe('valid');
  });

  it('flips to due-soon inside the 30-day warning window', () => {
    // 2025-11-25 last → 2026-05-25 due → 1 day from 2026-05-24
    const snap = computeKirStatus('2025-11-25', {}, NOW);
    expect(snap.daysUntilDue).toBe(1);
    expect(snap.status).toBe('due-soon');
  });

  it('flips to due-soon at exactly 30 days', () => {
    // last + 6mo = today + 30
    const snap = computeKirStatus('2025-12-23', {}, NOW);
    expect(snap.daysUntilDue).toBe(30);
    expect(snap.status).toBe('due-soon');
  });

  it('reports valid when 31+ days remain', () => {
    const snap = computeKirStatus('2025-12-24', {}, NOW);
    expect(snap.daysUntilDue).toBe(31);
    expect(snap.status).toBe('valid');
  });

  it('reports expired when the due date has passed', () => {
    // 2025-10-01 last → 2026-04-01 due → 53 days overdue from 2026-05-24
    const snap = computeKirStatus('2025-10-01', {}, NOW);
    expect(snap.daysUntilDue).toBe(-53);
    expect(snap.status).toBe('expired');
  });

  it('honours a custom warning threshold', () => {
    expect(computeKirStatus('2025-12-22', { warnDays: 60 }, NOW).status).toBe('due-soon');
  });
});

describe('summarizeKirFleet', () => {
  it('counts by status', () => {
    const fleet = [
      computeKirStatus('2026-01-15', {}, NOW), // valid (52d)
      computeKirStatus('2025-12-23', {}, NOW), // due-soon (30d)
      computeKirStatus('2025-10-01', {}, NOW), // expired (-53d)
      computeKirStatus(null, {}, NOW), // unknown
    ];
    expect(summarizeKirFleet(fleet)).toEqual({
      total: 4,
      counts: { valid: 1, 'due-soon': 1, expired: 1, unknown: 1 },
    });
  });
});

describe('formatKirCountdown', () => {
  it('renders unknown as em dash', () => {
    expect(formatKirCountdown(null)).toBe('—');
  });
  it('uses days for short windows', () => {
    expect(formatKirCountdown(12)).toBe('12 d');
    expect(formatKirCountdown(59)).toBe('59 d');
  });
  it('uses months for 60+ day horizons', () => {
    expect(formatKirCountdown(60)).toBe('2 mo');
    expect(formatKirCountdown(180)).toBe('6 mo');
  });
  it('prepends minus for expired', () => {
    expect(formatKirCountdown(-1)).toBe('−1 d');
    expect(formatKirCountdown(-100)).toBe('−100 d');
  });
});
