import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { createCrudHooks } from '@/shared/api/crud';
import type { Geofence } from '../model/types';

export const geofenceKeys = {
  all: ['geofences'] as const,
};

export async function fetchGeofences(): Promise<Geofence[]> {
  const { data, error } = await apiClient.GET('/geofences');
  if (error || !data) {
    throw new Error('Failed to load geofences');
  }
  return data as Geofence[];
}

export function useGeofencesQuery() {
  return useQuery({
    queryKey: geofenceKeys.all,
    queryFn: fetchGeofences,
    staleTime: 5 * 60 * 1000,
  });
}

const geofenceCrud = createCrudHooks<Geofence>('geofences');
export const useSaveGeofence = geofenceCrud.useSave;
export const useRemoveGeofence = geofenceCrud.useRemove;
export const geofencesApi = geofenceCrud.api;
