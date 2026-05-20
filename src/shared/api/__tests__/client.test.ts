import { describe, expect, it } from 'vitest';
import { apiClient } from '../client';

describe('apiClient', () => {
  it('exposes typed request methods', () => {
    expect(typeof apiClient.GET).toBe('function');
    expect(typeof apiClient.POST).toBe('function');
  });
});
