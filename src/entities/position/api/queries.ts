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

/** Positions for one device over a time range — backs the Route report. */
export function usePositionsRangeQuery(deviceId: number | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ['positions-range', deviceId, from, to],
    queryFn: () => fetchPositionsRange(deviceId as number, from, to),
    enabled: Boolean(deviceId && from && to),
  });
}

export async function fetchPositionsRange(
  deviceId: number,
  from: string,
  to: string,
): Promise<Position[]> {
  const { data, error } = await apiClient.GET('/positions', {
    params: { query: { deviceId, from, to } },
  });
  if (error || !data) {
    throw new Error('Failed to load positions');
  }
  return data as Position[];
}
