import { describe, expect, it } from 'vitest';
import { computeOdolStatus, summarizeOdolFleet, formatTonnage } from '../odol';

describe('computeOdolStatus', () => {
  it('reports unknown when neither JBI nor JBKI is configured', () => {
    const snap = computeOdolStatus({ emptyKg: 8000, cargoKg: 4000, jbiKg: 0 });
    expect(snap.status).toBe('unknown');
    expect(snap.capKg).toBe(0);
    expect(snap.percent).toBe(0);
    expect(snap.fineEstimateIDR).toBe(0);
  });

  it('reports under when laden weight is well below JBI', () => {
    const snap = computeOdolStatus({ emptyKg: 8000, cargoKg: 4000, jbiKg: 16000 });
    expect(snap.totalKg).toBe(12000);
    expect(snap.percent).toBe(75);
    expect(snap.overKg).toBe(0);
    expect(snap.status).toBe('under');
    expect(snap.fineEstimateIDR).toBe(0);
  });

  it('flips to at-cap inside the 95% warning band', () => {
    const snap = computeOdolStatus({ emptyKg: 8000, cargoKg: 7300, jbiKg: 16000 });
    expect(snap.percent).toBeCloseTo(95.625, 3);
    expect(snap.status).toBe('at-cap');
  });

  it('flips to over at or above 100% of cap', () => {
    expect(computeOdolStatus({ emptyKg: 8000, cargoKg: 7999, jbiKg: 16000 }).status).toBe('at-cap');
    expect(computeOdolStatus({ emptyKg: 8000, cargoKg: 8000, jbiKg: 16000 }).status).toBe('over');
    expect(computeOdolStatus({ emptyKg: 8000, cargoKg: 9500, jbiKg: 16000 }).status).toBe('over');
  });

  it('uses JBKI as the binding limit when a combination weight is set', () => {
    const snap = computeOdolStatus({
      emptyKg: 8000,
      cargoKg: 14000,
      jbiKg: 16000,
      jbkiKg: 30000,
    });
    expect(snap.capKg).toBe(30000);
    expect(snap.percent).toBeCloseTo(73.33, 1);
    expect(snap.status).toBe('under');
  });

  it('falls back to JBI when JBKI is provided but zero or negative', () => {
    const snap = computeOdolStatus({ emptyKg: 8000, cargoKg: 7000, jbiKg: 16000, jbkiKg: 0 });
    expect(snap.capKg).toBe(16000);
  });

  it('charges a fine estimate scaled with overload kg', () => {
    const snap = computeOdolStatus({ emptyKg: 8000, cargoKg: 10000, jbiKg: 16000 });
    expect(snap.overKg).toBe(2000);
    expect(snap.fineEstimateIDR).toBe(500_000 + 2000 * 250);
  });

  it('clamps negative input to zero', () => {
    const snap = computeOdolStatus({ emptyKg: -100, cargoKg: -50, jbiKg: 16000 });
    expect(snap.totalKg).toBe(0);
    expect(snap.percent).toBe(0);
    expect(snap.status).toBe('under');
  });

  it('honours custom warning / over thresholds', () => {
    expect(
      computeOdolStatus({ emptyKg: 8000, cargoKg: 4800, jbiKg: 16000 }, { warnAt: 0.8 }).status,
    ).toBe('at-cap');
    expect(
      computeOdolStatus({ emptyKg: 8000, cargoKg: 7000, jbiKg: 16000 }, { overAt: 0.9 }).status,
    ).toBe('over');
  });
});

describe('summarizeOdolFleet', () => {
  it('counts by status, accumulates cargo and fine-risk totals', () => {
    const fleet = [
      computeOdolStatus({ emptyKg: 8000, cargoKg: 4000, jbiKg: 16000 }), // under
      computeOdolStatus({ emptyKg: 8000, cargoKg: 7300, jbiKg: 16000 }), // at-cap
      computeOdolStatus({ emptyKg: 8000, cargoKg: 10000, jbiKg: 16000 }), // over (2000 over)
      computeOdolStatus({ emptyKg: 8000, cargoKg: 4000, jbiKg: 0 }), // unknown
    ];
    const summary = summarizeOdolFleet(fleet);
    expect(summary.total).toBe(4);
    expect(summary.configured).toBe(3);
    expect(summary.counts).toEqual({ under: 1, 'at-cap': 1, over: 1, unknown: 1 });
    expect(summary.totalCargoKg).toBe(4000 + 7300 + 10000 + 4000);
    expect(summary.totalFineRiskIDR).toBe(500_000 + 2000 * 250);
  });

  it('returns a zero summary for an empty fleet', () => {
    expect(summarizeOdolFleet([])).toEqual({
      total: 0,
      configured: 0,
      counts: { under: 0, 'at-cap': 0, over: 0, unknown: 0 },
      totalCargoKg: 0,
      totalFineRiskIDR: 0,
    });
  });
});

describe('formatTonnage', () => {
  it('uses tonnes for >= 1000 kg', () => {
    expect(formatTonnage(13500)).toBe('13.5 t');
    expect(formatTonnage(1000)).toBe('1.0 t');
  });
  it('uses kg for sub-tonne values', () => {
    expect(formatTonnage(950)).toBe('950 kg');
    expect(formatTonnage(0)).toBe('0 kg');
  });
});
