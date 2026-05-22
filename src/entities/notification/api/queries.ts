import { useQuery } from '@tanstack/react-query';
import { createCrudHooks, request } from '@/shared/api/crud';
import type { Notification, NotificationType, Notificator } from '../model/types';

const notificationCrud = createCrudHooks<Notification>('notifications');

export const notificationKeys = notificationCrud.keys;
export const useNotificationsQuery = notificationCrud.useList;
export const useSaveNotification = notificationCrud.useSave;
export const useRemoveNotification = notificationCrud.useRemove;
export const notificationsApi = notificationCrud.api;

export function useNotificationTypesQuery() {
  return useQuery({
    queryKey: ['notificationTypes'],
    queryFn: () => request<NotificationType[]>('/notifications/types'),
    staleTime: Infinity,
  });
}

export function useNotificatorsQuery(announcement = false) {
  return useQuery({
    queryKey: ['notificators', announcement],
    queryFn: () =>
      request<Notificator[]>(
        `/notifications/notificators${announcement ? '?announcement=true' : ''}`,
      ),
    staleTime: Infinity,
  });
}
