import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '../query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient', () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('disables refetch-on-window-focus by default', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('sets staleTime to 30 seconds', () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(30_000);
  });

  it('retries once on failure', () => {
    expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(1);
  });
});
