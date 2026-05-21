import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Position } from '../model/types';

export const positionKeys = {
  all: ['positions'] as const,
};

export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await apiClient.GET('/positions');
  if (error || !data) {
    throw new Error('Failed to load positions');
  }
  return data as Position[];
}

export function usePositionsQuery() {
  return useQuery({
    queryKey: positionKeys.all,
    queryFn: fetchPositions,
    staleTime: Infinity,
  });
}
