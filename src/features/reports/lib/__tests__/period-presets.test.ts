import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { periodRange, periodOptions } from '../period-presets';

describe('periodRange', () => {
  it('today spans the current day', () => {
    const { from, to } = periodRange('today');
    expect(dayjs(from).isSame(dayjs().startOf('day'))).toBe(true);
    expect(dayjs(to).isSame(dayjs().endOf('day'))).toBe(true);
  });

  it('yesterday spans the previous day', () => {
    const { from, to } = periodRange('yesterday');
    expect(dayjs(from).isSame(dayjs().subtract(1, 'day').startOf('day'))).toBe(true);
    expect(dayjs(to).isSame(dayjs().subtract(1, 'day').endOf('day'))).toBe(true);
  });

  it('exposes the seven preset options', () => {
    expect(periodOptions.map((option) => option.key)).toEqual([
      'today',
      'yesterday',
      'thisWeek',
      'previousWeek',
      'thisMonth',
      'previousMonth',
      'custom',
    ]);
  });
});
