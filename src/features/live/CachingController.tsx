import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/session';
import { geofenceKeys, fetchGeofences } from '@/entities/geofence';
import { groupKeys, fetchGroups } from '@/entities/group';
import { apiClient } from '@/shared/api/client';

export function CachingController() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      return;
    }
    void queryClient.prefetchQuery({ queryKey: geofenceKeys.all, queryFn: fetchGeofences });
    void queryClient.prefetchQuery({ queryKey: groupKeys.all, queryFn: fetchGroups });
    void queryClient.prefetchQuery({
      queryKey: ['drivers'],
      queryFn: async () => (await apiClient.GET('/drivers')).data ?? [],
    });
    void queryClient.prefetchQuery({
      queryKey: ['maintenance'],
      queryFn: async () => (await apiClient.GET('/maintenance')).data ?? [],
    });
    void queryClient.prefetchQuery({
      queryKey: ['calendars'],
      queryFn: async () => (await apiClient.GET('/calendars')).data ?? [],
    });
  }, [user, queryClient]);

  return null;
}
