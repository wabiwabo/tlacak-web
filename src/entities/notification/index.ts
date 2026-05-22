export type {
  Notification,
  NotificationType,
  Notificator,
  NotificationAttributes,
} from './model/types';
export {
  notificationKeys,
  useNotificationsQuery,
  useSaveNotification,
  useRemoveNotification,
  notificationsApi,
  useNotificationTypesQuery,
  useNotificatorsQuery,
} from './api/queries';
