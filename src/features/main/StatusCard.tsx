import { useTranslation } from 'react-i18next';
import { X, Power, Battery, Gauge, Thermometer, MapPin, Clock, Send, History, Activity, ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@/shared/ui';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';
import { cn } from '@/shared/lib/cn';

interface TelemetryTileProps {
  label: string;
  value: string;
  meta?: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'warn' | 'dim';
}

function TelemetryTile({ label, value, meta, icon, tone = 'primary' }: TelemetryTileProps) {
  return (
    <div className="border border-border bg-background/40 p-3 flex flex-col gap-1">
      <span className="cyber-label flex items-center gap-1.5 text-[9px]">
        <span
          className={cn(
            tone === 'primary' && 'text-primary',
            tone === 'warn' && 'text-[var(--color-warning)]',
            tone === 'dim' && 'text-muted-foreground',
          )}
        >
          {icon}
        </span>
        {label}
      </span>
      <span
        className={cn(
          'font-mono font-bold tracking-wide text-lg',
          tone === 'primary' && 'text-primary',
          tone === 'warn' && 'text-[var(--color-warning)]',
          tone === 'dim' && 'text-foreground',
        )}
      >
        {value}
      </span>
      {meta && (
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{meta}</span>
      )}
    </div>
  );
}

export function StatusCard({ deviceId }: { deviceId: number }) {
  const { t } = useTranslation();
  const device = useLiveStore((state) => state.devices[deviceId]);
  const position = useLiveStore((state) => state.positions[deviceId]);
  const select = useSelectionStore((state) => state.select);

  if (!device) {
    return null;
  }

  const attributes = position?.attributes ?? {};
  const speed = Math.round(position?.speed ?? 0);
  const moving = device.status === 'online' && speed > 1;
  const status = moving ? 'MOVING' : device.status === 'online' ? 'IDLE' : 'OFFLINE';
  const statusVariant = moving ? 'moving' : device.status === 'online' ? 'idle' : 'offline';
  const plate = (device as unknown as { uniqueId?: string }).uniqueId;
  const addr = typeof attributes.address === 'string' ? attributes.address : null;
  const ago = device.lastUpdate ? dayjs(device.lastUpdate).fromNow(true) : '—';

  const lat = position?.latitude;
  const lng = position?.longitude;
  const battery =
    typeof attributes.batteryLevel === 'number' ? `${attributes.batteryLevel}%` : '—';
  const ignition = attributes.ignition ? 'ON' : 'OFF';
  const ignitionTone: 'primary' | 'dim' = attributes.ignition ? 'primary' : 'dim';
  const power =
    typeof attributes.power === 'number'
      ? `${(attributes.power as number).toFixed(1)} V`
      : '—';
  const temp =
    typeof attributes.deviceTemp === 'number'
      ? `${attributes.deviceTemp}°C`
      : '—';

  // Tiny sparkline — fake-ish: derive a polyline from last segment values if motion store had it.
  // For a static-feeling sparkline we render a placeholder smooth curve.
  const sparkPath = 'M0 24 L20 18 L40 22 L60 12 L80 16 L100 8 L120 14 L140 6 L160 12 L180 4 L200 10 L220 6';

  return (
    <aside
      className={cn(
        'pointer-events-auto flex h-full w-full flex-col border-s border-border bg-card text-foreground',
        'overflow-hidden',
      )}
      aria-label={t('sharedDevice')}
    >
      {/* Header */}
      <div className="border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="cyber-label flex items-center gap-1">
              <span className="text-primary">//</span> SELECTED UNIT
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold uppercase tracking-wider text-foreground cyber-glow-strong">
                {device.name}
              </span>
            </div>
            {plate && (
              <div className="mt-0.5 font-mono text-xs text-muted-foreground uppercase tracking-[0.18em]">
                {plate}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={t('sharedClose')}
            onClick={() => select(null)}
            className="border border-border bg-background/40 p-1 text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 flex items-baseline gap-3">
          <span
            className={cn(
              'font-mono text-3xl font-bold tracking-tight tabular-nums',
              moving ? 'text-primary cyber-glow-strong' : 'text-muted-foreground',
            )}
          >
            {speed}
          </span>
          <span className="cyber-label text-[10px] mb-1">KM/H</span>
          <span className="ml-auto">
            <Badge variant={statusVariant} bracketed>
              {status}
            </Badge>
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-muted-foreground tracking-wider">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 bg-primary animate-cyber-pulse" />
            LIVE
          </span>
          <span>· LAST UPDATE {ago.toUpperCase()}</span>
        </div>
      </div>

      {/* Driver */}
      {typeof attributes.driverUniqueId === 'string' || true ? (
        <div className="border-b border-border px-4 py-3">
          <div className="cyber-label text-[9px] mb-2">DRIVER</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center border border-primary/40 bg-primary/15 font-mono text-[10px] font-bold text-primary cyber-glow">
              {typeof attributes.driverUniqueId === 'string'
                ? (attributes.driverUniqueId as string).slice(0, 2).toUpperCase()
                : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-semibold text-foreground tracking-wide truncate">
                {typeof attributes.driverUniqueId === 'string'
                  ? attributes.driverUniqueId
                  : t('sharedNoData')}
              </div>
              {typeof attributes.driverUniqueId === 'string' && (
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
                  ID #{attributes.driverUniqueId as string}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Location */}
      <div className="border-b border-border px-4 py-3">
        <div className="cyber-label text-[9px] mb-2 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-primary" />
          LOCATION
        </div>
        {addr && (
          <div className="font-mono text-xs text-foreground tracking-wide leading-snug">{addr}</div>
        )}
        {typeof lat === 'number' && typeof lng === 'number' && (
          <div className="mt-1 font-mono text-[10px] text-muted-foreground tracking-wider">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1 cyber-label text-[9px]">
          <Clock className="h-3 w-3" />
          UPDATED {ago.toUpperCase()} AGO
        </div>
      </div>

      {/* Telemetry 2x2 */}
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border p-px">
        <TelemetryTile
          label="IGNITION"
          value={ignition}
          icon={<Power className="h-3 w-3" />}
          tone={ignitionTone}
        />
        <TelemetryTile
          label="FUEL"
          value={battery}
          icon={<Battery className="h-3 w-3" />}
          tone={'primary'}
        />
        <TelemetryTile
          label="POWER"
          value={power}
          icon={<Gauge className="h-3 w-3" />}
          tone="dim"
        />
        <TelemetryTile
          label="ENGINE TEMP"
          value={temp}
          icon={<Thermometer className="h-3 w-3" />}
          tone="dim"
        />
      </div>

      {/* Sparkline */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between cyber-label text-[9px]">
          <span>SPEED · LAST 60 MIN</span>
          <span className="font-mono text-muted-foreground tracking-wider">km/h</span>
        </div>
        <svg viewBox="0 0 220 32" className="mt-2 h-8 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ffc8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00ffc8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${sparkPath} L220 32 L0 32 Z`} fill="url(#spark-fill)" />
          <path d={sparkPath} stroke="#00ffc8" strokeWidth="1" fill="none" />
        </svg>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground tracking-wider">
          <span>-60m</span>
          <span>NOW</span>
        </div>
      </div>

      {/* Today */}
      <div className="border-b border-border px-4 py-3">
        <div className="cyber-label text-[9px] mb-2">TODAY</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'DIST', value: '—' },
            { label: 'TIME', value: '—' },
            { label: 'STOPS', value: '0' },
            { label: 'ALERTS', value: '0' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="cyber-label text-[9px]">{s.label}</span>
              <span className="font-mono text-sm font-bold text-foreground tracking-wide">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="mt-auto grid grid-cols-4 gap-px border-t border-border bg-border p-px">
        {[
          { icon: <Send className="h-3 w-3" />, label: 'COMMANDS' },
          { icon: <History className="h-3 w-3" />, label: 'HISTORY' },
          { icon: <ShieldCheck className="h-3 w-3" />, label: 'GEOFENCE' },
          { icon: <Activity className="h-3 w-3" />, label: 'EVENTS' },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            className="flex flex-col items-center justify-center gap-1 bg-card py-2 transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="text-muted-foreground">{a.icon}</span>
            <span className="cyber-label text-[9px]">{a.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
