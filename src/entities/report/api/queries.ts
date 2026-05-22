import { useQuery } from '@tanstack/react-query';
import { request } from '@/shared/api/crud';
import type { Position } from '@/entities/position';
import type { DeviceEvent } from '@/entities/event';
import type {
  SummaryReport,
  TripReport,
  StopReport,
  GeofenceReport,
  StatisticsItem,
  AuditItem,
  ScheduledReport,
} from '../model/types';

/** The filter every standard report shares. */
export interface ReportParams {
  deviceIds: number[];
  groupIds: number[];
  from: string;
  to: string;
}

/** Builds a `?from=&to=&deviceId=&groupId=` query string with repeated id params. */
export function reportQuery(params: ReportParams, extra: Record<string, string[]> = {}): string {
  const search = new URLSearchParams();
  search.set('from', params.from);
  search.set('to', params.to);
  params.deviceIds.forEach((id) => search.append('deviceId', String(id)));
  params.groupIds.forEach((id) => search.append('groupId', String(id)));
  for (const [key, values] of Object.entries(extra)) {
    values.forEach((value) => search.append(key, value));
  }
  return `?${search.toString()}`;
}

/** True once a from/to pair is present — gates the auto-running report queries. */
function ready(params: ReportParams | undefined): params is ReportParams {
  return Boolean(params && params.from && params.to);
}

function useReport<T>(
  name: string,
  path: string,
  params: ReportParams | undefined,
  extra?: Record<string, string[]>,
) {
  return useQuery({
    queryKey: [name, params, extra],
    queryFn: () => request<T[]>(`${path}${reportQuery(params as ReportParams, extra)}`),
    enabled: ready(params),
  });
}

export function useSummaryReport(params: ReportParams | undefined, daily: boolean) {
  return useReport<SummaryReport>('report-summary', '/reports/summary', params, {
    daily: [String(daily)],
  });
}
export function useTripsReport(params: ReportParams | undefined) {
  return useReport<TripReport>('report-trips', '/reports/trips', params);
}
export function useStopsReport(params: ReportParams | undefined) {
  return useReport<StopReport>('report-stops', '/reports/stops', params);
}
export function useGeofenceReport(params: ReportParams | undefined, geofenceIds: number[]) {
  return useReport<GeofenceReport>('report-geofences', '/reports/geofences', params, {
    geofenceId: geofenceIds.map(String),
  });
}
export function useEventsReport(params: ReportParams | undefined, types: string[]) {
  return useReport<DeviceEvent>('report-events', '/reports/events', params, { type: types });
}
export function useRouteReport(params: ReportParams | undefined) {
  return useReport<Position>('report-route', '/reports/route', params);
}

export function useStatistics(from: string | undefined, to: string | undefined) {
  return useQuery({
    queryKey: ['statistics', from, to],
    queryFn: () => request<StatisticsItem[]>(`/statistics?from=${from}&to=${to}`),
    enabled: Boolean(from && to),
  });
}
export function useAudit(from: string | undefined, to: string | undefined) {
  return useQuery({
    queryKey: ['audit', from, to],
    queryFn: () => request<AuditItem[]>(`/audit?from=${from}&to=${to}`),
    enabled: Boolean(from && to),
  });
}

export const scheduledReportKeys = { all: ['reports'] as const };
export function useScheduledReports() {
  return useQuery({
    queryKey: scheduledReportKeys.all,
    queryFn: () => request<ScheduledReport[]>('/reports'),
  });
}
export function deleteScheduledReport(id: number) {
  return request<void>(`/reports/${id}`, { method: 'DELETE' });
}
