import { request } from '@/shared/api/crud';
import type { ScheduledReport } from '@/entities/report';

/**
 * Persists a report as a scheduled job: POST /reports, then link it to the
 * selected devices/groups via /permissions/bulk. Port of the legacy helper.
 */
export async function scheduleReport(
  deviceIds: number[],
  groupIds: number[],
  report: Omit<ScheduledReport, 'id'>,
): Promise<void> {
  const saved = await request<ScheduledReport>('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
  if (deviceIds.length) {
    await request('/permissions/bulk', {
      method: 'POST',
      body: JSON.stringify(deviceIds.map((deviceId) => ({ deviceId, reportId: saved.id }))),
    });
  }
  if (groupIds.length) {
    await request('/permissions/bulk', {
      method: 'POST',
      body: JSON.stringify(groupIds.map((groupId) => ({ groupId, reportId: saved.id }))),
    });
  }
}
