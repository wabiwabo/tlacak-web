import type { components } from '@/shared/api/schema';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';

export type SummaryReport = components['schemas']['ReportSummary'];
export type TripReport = components['schemas']['ReportTrips'];
export type StopReport = components['schemas']['ReportStops'];

/** A geofence enter/exit report row (schema key: ReportGeofences). */
export type GeofenceReport = components['schemas']['ReportGeofences'];

/** One device's slice of the combined report. */
export interface CombinedReportItem {
  deviceId: number;
  events: DeviceEvent[];
  positions: Position[];
  route: [number, number][];
}

/** A server-statistics sample (schema key: Statistics). */
export type StatisticsItem = components['schemas']['Statistics'];

/** An audit-log entry. */
export interface AuditItem {
  id: number;
  actionTime: string;
  userId: number;
  actionType: string;
  objectType: string;
  objectId: number;
}

/** A persisted scheduled report. */
export interface ScheduledReport {
  id: number;
  type: string;
  description?: string;
  calendarId?: number;
  attributes: Record<string, unknown>;
}
