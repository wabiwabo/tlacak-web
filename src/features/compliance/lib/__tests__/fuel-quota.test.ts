import { describe, expect, it } from 'vitest';
import {
  computeQuota,
  summarizeFleet,
  formatRupiahCompact,
  formatRupiahFull,
  DEFAULT_DAILY_CAP_L,
  PENALTY_PER_LITER_IDR,
} from '../fuel-quota';

describe('computeQuota', () => {
  it('reports zero usage when nothing was burned', () => {
    const q = computeQuota(0);
    expect(q.usedL).toBe(0);
    expect(q.percentUsed).toBe(0);
    expect(q.remainingL).toBe(DEFAULT_DAILY_CAP_L);
    expect(q.savingsIDR).toBe(0);
    expect(q.penaltyIDR).toBe(0);
    expect(q.status).toBe('nominal');
  });

  it('credits subsidy savings for litres under the cap', () => {
    const q = computeQuota(120);
    expect(q.percentUsed).toBe(60);
    expect(q.remainingL).toBe(80);
    expect(q.savingsIDR).toBe(120 * PENALTY_PER_LITER_IDR);
    expect(q.penaltyIDR).toBe(0);
    expect(q.status).toBe('nominal');
  });

  it('flips to warning state at 80% of cap', () => {
    expect(computeQuota(159).status).toBe('nominal');
    expect(computeQuota(160).status).toBe('warning');
    expect(computeQuota(195).status).toBe('warning');
  });

  it('flips to over state at or above 100% of cap', () => {
    expect(computeQuota(199).status).toBe('warning');
    expect(computeQuota(200).status).toBe('over');
    expect(computeQuota(240).status).toBe('over');
  });

  it('charges the penalty for litres over the cap', () => {
    const q = computeQuota(240);
    expect(q.usedL).toBe(240);
    expect(q.remainingL).toBe(0);
    expect(q.savingsIDR).toBe(200 * PENALTY_PER_LITER_IDR);
    expect(q.penaltyIDR).toBe(40 * PENALTY_PER_LITER_IDR);
    expect(q.status).toBe('over');
  });

  it('honours a custom cap and treats zero-cap vehicles as nominal', () => {
    const q = computeQuota(50, 100);
    expect(q.percentUsed).toBe(50);
    expect(q.remainingL).toBe(50);
    const empty = computeQuota(50, 0);
    expect(empty.percentUsed).toBe(0);
    expect(empty.status).toBe('nominal');
  });

  it('clamps negative input to zero', () => {
    const q = computeQuota(-5);
    expect(q.usedL).toBe(0);
    expect(q.percentUsed).toBe(0);
  });

  it('respects custom warning/over thresholds', () => {
    expect(computeQuota(60, 100, { warningAt: 0.5 }).status).toBe('warning');
    expect(computeQuota(90, 100, { overAt: 0.9 }).status).toBe('over');
  });
});

describe('summarizeFleet', () => {
  it('sums totals and counts statuses', () => {
    const fleet = [computeQuota(30), computeQuota(180), computeQuota(220)];
    const summary = summarizeFleet(fleet);
    expect(summary.totalUsedL).toBe(430);
    expect(summary.totalCapL).toBe(600);
    expect(summary.counts).toEqual({ nominal: 1, warning: 1, over: 1 });
    expect(summary.totalPenaltyIDR).toBe(20 * PENALTY_PER_LITER_IDR);
  });

  it('returns zero summary for an empty fleet', () => {
    const summary = summarizeFleet([]);
    expect(summary).toEqual({
      totalUsedL: 0,
      totalCapL: 0,
      totalSavingsIDR: 0,
      totalPenaltyIDR: 0,
      counts: { nominal: 0, warning: 0, over: 0 },
    });
  });
});

describe('formatRupiahCompact', () => {
  it('formats by magnitude using Indonesian abbreviations', () => {
    expect(formatRupiahCompact(450)).toBe('Rp 450');
    expect(formatRupiahCompact(3500)).toBe('Rp 4 rb');
    expect(formatRupiahCompact(3_360_000)).toBe('Rp 3.36 jt');
    expect(formatRupiahCompact(2_500_000_000)).toBe('Rp 2.50 M');
  });

  it('preserves the minus sign for negative amounts', () => {
    expect(formatRupiahCompact(-1_500_000)).toBe('-Rp 1.50 jt');
  });
});

describe('formatRupiahFull', () => {
  it('formats with id-ID locale digit grouping', () => {
    // The Intl id-ID locale may use either a comma or a non-breaking space as
    // thousands separator depending on the ICU version. Assert on the digits.
    const formatted = formatRupiahFull(3_360_000);
    expect(formatted).toContain('3');
    expect(formatted).toContain('360');
    expect(formatted).toContain('000');
    expect(formatted).toMatch(/Rp/);
  });
});
