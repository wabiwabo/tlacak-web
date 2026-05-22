import type { components } from '@/shared/api/schema';

type SchemaCalendar = components['schemas']['Calendar'];

/** Free-form attribute bag the backend returns on Calendar. */
export type CalendarAttributes = Record<string, unknown>;

/** A calendar as returned by GET /api/calendars. */
export interface Calendar extends Omit<SchemaCalendar, 'attributes'> {
  attributes: CalendarAttributes;
}
