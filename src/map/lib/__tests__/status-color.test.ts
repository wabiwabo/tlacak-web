import { describe, expect, it } from 'vitest';
import { getStatusColor } from '../status-color';

describe('getStatusColor', () => {
  it('maps device statuses to colour keys', () => {
    expect(getStatusColor('online')).toBe('success');
    expect(getStatusColor('offline')).toBe('error');
    expect(getStatusColor('unknown')).toBe('neutral');
    expect(getStatusColor(undefined)).toBe('neutral');
  });
});
