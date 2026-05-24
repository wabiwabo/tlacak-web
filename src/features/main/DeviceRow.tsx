import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { AlertCircle, BatteryFull, BatteryLow, BatteryMedium, Power } from 'lucide-react';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';
import { MotionBar } from './MotionBar';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { Device } from '@/entities/device';

dayjs.extend(relativeTime);

interface DeviceRowProps {
  index: number;
  style: React.CSSProperties;
  devices: Device[];
}

function batteryIcon(level: number) {
  if (level > 70) return <BatteryFull className="h-3.5 w-3.5 text-primary" />;
  if (level > 30) return <BatteryMedium className="h-3.5 w-3.5 text-[var(--color-warning)]" />;
  return <BatteryLow className="h-3.5 w-3.5 text-destructive" />;
}

type RowStatus = 'moving' | 'idle' | 'stopped' | 'offline';

function statusVariant(status: string | undefined, speed: number, hasPosition: boolean) {
  if (status !== 'online') return { variant: 'offline' as RowStatus, label: 'OFFLINE' };
  if (speed > 1) return { variant: 'moving' as RowStatus, label: 'MOVING' };
  if (hasPosition) return { variant: 'idle' as RowStatus, label: 'IDLE' };
  return { variant: 'stopped' as RowStatus, label: 'STOPPED' };
}

const DEPTH_BY_STATUS: Record<RowStatus, string> = {
  moving: 'depth-elevated-shallow',
  idle: '',
  stopped: 'depth-recessed-shallow',
  offline: 'depth-recessed-deep',
};

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

  const attributes = position?.attributes ?? {};
  const speed = position?.speed ?? 0;
  const status = statusVariant(device.status ?? undefined, speed, Boolean(position));
  const ago = device.lastUpdate ? dayjs(device.lastUpdate).fromNow(true) : '—';
  const isSelected = selectedDeviceId === device.id;
  const plate = (device as unknown as { uniqueId?: string }).uniqueId;

  const depthClass = isSelected
    ? 'depth-elevated-tall'
    : DEPTH_BY_STATUS[status.variant];

  return (
    <div style={style} className="px-1.5 py-px">
      <button
        type="button"
        onClick={() => select(device.id as number)}
        aria-current={isSelected}
        className={cn(
          'group relative flex h-[68px] w-full items-center gap-3 px-3 text-left transition-all',
          depthClass,
          'depth-interactive',
          isSelected ? 'text-foreground' : 'text-foreground/90 hover:depth-elevated-shallow',
        )}
      >
        {isSelected && <span className="absolute inset-y-0 start-0 w-0.5 bg-primary cyber-box-glow" />}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate font-mono text-[13px] font-bold uppercase tracking-wider text-foreground">
              {device.name}
            </span>
            <Badge variant={status.variant} size="sm" className="shrink-0">
              {status.label}
            </Badge>
          </span>

          <span className="mt-1 flex items-center gap-2 text-[10px]">
            {plate ? (
              <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">
                {plate}
              </span>
            ) : null}
            {speed > 1 ? (
              <span className="font-mono font-semibold text-primary tracking-wider">
                {Math.round(speed)} km/h
              </span>
            ) : null}
            <span className="font-mono text-muted-foreground tracking-wider">· {ago}</span>
          </span>

          {'motion' in attributes && (
            <span className="mt-1 block">
              <MotionBar deviceId={device.id as number} />
            </span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          {'alarm' in attributes ? (
            <AlertCircle
              className="h-3.5 w-3.5 text-destructive cyber-glow-alert"
              role="img"
              aria-label={t('eventAlarm')}
            />
          ) : null}
          {'ignition' in attributes ? (
            <Power
              className={cn(
                'h-3.5 w-3.5',
                attributes.ignition ? 'text-primary' : 'text-muted-foreground',
              )}
              role="img"
              aria-label={t('positionIgnition')}
            />
          ) : null}
          {'batteryLevel' in attributes ? batteryIcon(attributes.batteryLevel as number) : null}
        </span>
      </button>
    </div>
  );
}
