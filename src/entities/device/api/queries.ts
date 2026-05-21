import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Device } from '../model/types';

export const deviceKeys = {
  all: ['devices'] as const,
};

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await apiClient.GET('/devices');
  if (error || !data) {
    throw new Error('Failed to load devices');
  }
  return data as Device[];
}

export function useDevicesQuery() {
  return useQuery({
    queryKey: deviceKeys.all,
    queryFn: fetchDevices,
    staleTime: Infinity,
  });
}
