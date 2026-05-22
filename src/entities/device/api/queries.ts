import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { createCrudHooks } from '@/shared/api/crud';
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

// Settings CRUD for devices. The collection key is `['devices']`, identical to
// `deviceKeys.all`, so a save/remove also refreshes the live map's device query.
const deviceCrud = createCrudHooks<Device>('devices');
export const useSaveDevice = deviceCrud.useSave;
export const useRemoveDevice = deviceCrud.useRemove;
export const devicesApi = deviceCrud.api;
