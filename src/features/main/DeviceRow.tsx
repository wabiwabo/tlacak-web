import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { AlertCircle, BatteryFull, BatteryLow, BatteryMedium, Power } from 'lucide-react';
import { mapIconKey, mapIcons, getStatusColor } from '@/map';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';
import { MotionBar } from './MotionBar';
import { cn } from '@/shared/lib/cn';
import type { Device } from '@/entities/device';

dayjs.extend(relativeTime);

const STATUS_TEXT_CLASS: Record<string, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  neutral: 'text-muted-foreground',
};

interface DeviceRowProps {
  index: number;
  style: React.CSSProperties;
  devices: Device[];
}

function batteryIcon(level: number) {
  if (level > 70) {
    return <BatteryFull className="h-4 w-4 text-emerald-600" />;
  }
  if (level > 30) {
    return <BatteryMedium className="h-4 w-4 text-amber-600" />;
  }
  return <BatteryLow className="h-4 w-4 text-rose-600" />;
}

export function DeviceRow({ index, style, devices }: DeviceRowProps) {
  const { t } = useTranslation();
  const device = devices[index];
  const position = useLiveStore((state) =>
    device ? state.positions[device.id as number] : undefined,
  );
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);
  const select = useSelectionStore((state) => state.select);

  if (!device) {
    return null;
  }

  const secondary =
    device.status === 'online' || !device.lastUpdate
      ? t(
          `deviceStatus${device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Unknown'}`,
        )
      : dayjs(device.lastUpdate).fromNow();
  const attributes = position?.attributes ?? {};

  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => select(device.id as number)}
        className={cn(
          'flex h-[72px] w-full items-center gap-3 px-3 text-left',
          selectedDeviceId === device.id ? 'bg-muted' : 'hover:bg-muted/60',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <img
            src={mapIcons[mapIconKey(device.category ?? undefined)]}
            alt=""
            className="h-5 w-5 brightness-0 invert"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{device.name}</span>
          <span className="block truncate text-xs">
            {'motion' in attributes ? <MotionBar deviceId={device.id as number} /> : null}
            <span className={STATUS_TEXT_CLASS[getStatusColor(device.status)]}>{secondary}</span>
          </span>
        </span>
        {position && 'alarm' in attributes ? (
          <AlertCircle className="h-4 w-4 text-rose-600" role="img" aria-label={t('eventAlarm')} />
        ) : null}
        {position && 'ignition' in attributes ? (
          <Power
            className={cn(
              'h-4 w-4',
              attributes.ignition ? 'text-emerald-600' : 'text-muted-foreground',
            )}
            role="img"
            aria-label={t('positionIgnition')}
          />
        ) : null}
        {position && 'batteryLevel' in attributes
          ? batteryIcon(attributes.batteryLevel as number)
          : null}
      </button>
    </div>
  );
}
