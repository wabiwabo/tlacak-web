import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useScheduledReports, deleteScheduledReport, scheduledReportKeys } from '@/entities/report';
import type { ScheduledReport } from '@/entities/report';
import { useCalendarsQuery } from '@/entities/calendar';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';
import { Button } from '@/shared/ui/button';
import { Trash2 } from 'lucide-react';
import { RemoveDialog } from '@/features/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ReportLayout } from '@/features/reports';

const TYPE_LABEL: Record<string, string> = {
  events: 'reportEvents',
  route: 'reportPositions',
  summary: 'reportSummary',
  trips: 'reportTrips',
  stops: 'reportStops',
};

export default function ScheduledPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pushError = useErrorsStore((state) => state.push);
  const { data } = useScheduledReports();
  const { data: calendars } = useCalendarsQuery();
  const [removing, setRemoving] = useState<ScheduledReport>();

  const calendarName = (id: number | undefined) =>
    (calendars ?? []).find((c) => c.id === id)?.name ?? '';

  return (
    <ReportLayout titleKey="reportScheduled">
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sharedType')}</TableHead>
              <TableHead>{t('sharedDescription')}</TableHead>
              <TableHead>{t('sharedCalendar')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((report) => (
              <TableRow key={report.id}>
                <TableCell>{t(TYPE_LABEL[report.type] ?? report.type)}</TableCell>
                <TableCell>{report.description ?? ''}</TableCell>
                <TableCell>{calendarName(report.calendarId)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('sharedRemove')}
                    onClick={() => setRemoving(report)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <RemoveDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(undefined)}
        onConfirm={async () => {
          if (!removing) {
            return;
          }
          try {
            await deleteScheduledReport(removing.id);
            await queryClient.invalidateQueries({ queryKey: scheduledReportKeys.all });
          } catch (error) {
            pushError((error as Error).message);
          }
        }}
      />
    </ReportLayout>
  );
}
