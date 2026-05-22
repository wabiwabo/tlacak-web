import type { components } from '@/shared/api/schema';

type SchemaNotification = components['schemas']['Notification'];

export type NotificationAttributes = Record<string, unknown>;

/** A notification rule as returned by GET /api/notifications. */
export interface Notification extends Omit<SchemaNotification, 'attributes'> {
  attributes: NotificationAttributes;
}

/** A notification event-type descriptor. */
export interface NotificationType {
  type: string;
}

/** A notificator (delivery channel) descriptor. */
export interface Notificator {
  type: string;
}
