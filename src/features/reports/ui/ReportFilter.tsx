import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportParams } from '@/entities/report';
import { SelectField } from '@/features/settings';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Field } from '@/shared/ui/Field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { periodOptions, periodRange } from '../lib/period-presets';
import type { PeriodKey } from '../lib/period-presets';

export interface ScheduleDraft {
  description: string;
  calendarId: number;
  attributes: Record<string, unknown>;
}

interface ReportFilterProps {
  /** `multiple` shows device+group multi-selects; `single` one device; `none` date-only. */
  deviceType: 'multiple' | 'single' | 'none';
  loading?: boolean;
  onShow: (params: ReportParams) => void;
  onExport?: (params: ReportParams) => void;
  onSchedule?: (deviceIds: number[], groupIds: number[], draft: ScheduleDraft) => void;
  /** Extra filter controls (column select, event-type select, …). */
  children?: ReactNode;
}

export function ReportFilter({
  deviceType,
  loading = false,
  onShow,
  onExport,
  onSchedule,
  children,
}: ReportFilterProps) {
  const { t } = useTranslation();
  const [deviceIds, setDeviceIds] = useState<number[]>([]);
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState<number | undefined>(undefined);

  const resolveParams = (): ReportParams => {
    const range =
      period === 'custom'
        ? { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() }
        : periodRange(period);
    return { deviceIds, groupIds, from: range.from, to: range.to };
  };

  const deviceMissing = deviceType !== 'none' && deviceIds.length === 0;
  const customMissing = period === 'custom' && (!customFrom || !customTo);
  const disabled = loading || deviceMissing || customMissing;

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border bg-card/40 px-4 py-3 print:hidden">
      {deviceType !== 'none' ? (
        <div className="min-w-48">
          <SelectField
            label={deviceType === 'single' ? t('reportDevice') : t('deviceTitle')}
            endpoint="/devices"
            multiple={deviceType === 'multiple'}
            value={deviceType === 'multiple' ? deviceIds : deviceIds[0]}
            onChange={(value) =>
              setDeviceIds(
                value === undefined
                  ? []
                  : Array.isArray(value)
                    ? (value as number[])
                    : [value as number],
              )
            }
          />
        </div>
      ) : null}
      {deviceType === 'multiple' ? (
        <div className="min-w-48">
          <SelectField
            label={t('settingsGroups')}
            endpoint="/groups"
            multiple
            value={groupIds}
            onChange={(value) => setGroupIds((value as number[]) ?? [])}
          />
        </div>
      ) : null}
      <div className="min-w-40">
        <Field label={t('reportPeriod')}>
          {(id) => (
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>
      {period === 'custom' ? (
        <>
          <div className="min-w-44">
            <Field label={t('reportFrom')}>
              {(id) => (
                <Input
                  id={id}
                  type="datetime-local"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              )}
            </Field>
          </div>
          <div className="min-w-44">
            <Field label={t('reportTo')}>
              {(id) => (
                <Input
                  id={id}
                  type="datetime-local"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              )}
            </Field>
          </div>
        </>
      ) : null}
      {children}
      <div className="flex gap-2">
        <Button type="button" disabled={disabled} onClick={() => onShow(resolveParams())}>
          {loading ? t('sharedLoading') : t('reportShow')}
        </Button>
        {onExport ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onExport(resolveParams())}
          >
            {t('reportExport')}
          </Button>
        ) : null}
        {onSchedule ? (
          <Button
            type="button"
            variant="outline"
            disabled={deviceMissing}
            onClick={() => setScheduleOpen(true)}
          >
            {t('reportSchedule')}
          </Button>
        ) : null}
      </div>

      {onSchedule ? (
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reportSchedule')}</DialogTitle>
            </DialogHeader>
            <Field label={t('sharedDescription')}>
              {(id) => (
                <Input
                  id={id}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
            </Field>
            <SelectField
              label={t('sharedCalendar')}
              endpoint="/calendars"
              value={calendarId}
              onChange={(value) => setCalendarId(value as number | undefined)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleOpen(false)}>
                {t('sharedCancel')}
              </Button>
              <Button
                disabled={!description || !calendarId}
                onClick={() => {
                  onSchedule(deviceIds, groupIds, {
                    description,
                    calendarId: calendarId as number,
                    attributes: {},
                  });
                  setScheduleOpen(false);
                }}
              >
                {t('reportSchedule')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
