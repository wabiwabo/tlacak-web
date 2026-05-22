import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveStore } from '@/features/main/model/live-store';
import { ReportLayout } from '@/features/reports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface LogEntry {
  deviceId?: number;
  uniqueId?: string;
  protocol?: string;
  data?: string;
}

export default function LogsPage() {
  const { t } = useTranslation();
  const setIncludeLogs = useLiveStore((state) => state.setIncludeLogs);
  const logs = useLiveStore((state) => state.logs) as LogEntry[];

  useEffect(() => {
    setIncludeLogs(true);
    return () => setIncludeLogs(false);
  }, [setIncludeLogs]);

  return (
    <ReportLayout titleKey="sharedLogs">
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('deviceIdentifier')}</TableHead>
              <TableHead>{t('positionProtocol')}</TableHead>
              <TableHead>{t('commandData')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>{entry.uniqueId ?? ''}</TableCell>
                <TableCell>{entry.protocol ?? ''}</TableCell>
                <TableCell className="font-mono text-xs">{entry.data ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('sharedNoData')}</p>
        ) : null}
      </div>
    </ReportLayout>
  );
}
