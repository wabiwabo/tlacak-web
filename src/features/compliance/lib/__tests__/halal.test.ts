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
