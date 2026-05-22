import { describe, expect, it } from 'vitest';
import {
  formatTime,
  formatDistance,
  formatSpeed,
  formatVolume,
  formatNumericHours,
  formatBoolean,
} from '../format';

describe('formatDistance', () => {
  it('converts metres to kilometres', () => {
    expect(formatDistance(1500, 'km')).toBe('1.50 km');
  });
  it('converts metres to miles', () => {
    expect(formatDistance(1609.344, 'mi')).toBe('1.00 mi');
  });
});

describe('formatSpeed', () => {
  it('converts knots to km/h', () => {
    expect(formatSpeed(1, 'kmh')).toBe('1.85 km/h');
  });
});

describe('formatVolume', () => {
  it('converts litres to litres', () => {
    expect(formatVolume(10, 'ltr')).toBe('10.00 l');
  });
});

describe('formatNumericHours', () => {
  it('renders a millisecond duration as hours and minutes', () => {
    expect(formatNumericHours(3_600_000 + 1_800_000)).toBe('1 h 30 m');
  });
});

describe('formatTime', () => {
  it('formats an ISO string at minute precision', () => {
    expect(formatTime('2026-05-22T08:09:00.000Z', 'minutes')).toMatch(/2026-05-22/);
  });
  it('returns an empty string for a missing value', () => {
    expect(formatTime(undefined, 'minutes')).toBe('');
  });
});

describe('formatBoolean', () => {
  it('maps booleans to a check or empty', () => {
    expect(formatBoolean(true)).toBe('✓');
    expect(formatBoolean(false)).toBe('');
  });
});
