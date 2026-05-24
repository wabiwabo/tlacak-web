import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useLiveStore } from './model/live-store';
import { useMapUiStore } from './model/map-ui-store';
import { cn } from '@/shared/lib/cn';

type Elevation =
  | 'recessed-deep'
  | 'recessed-shallow'
  | 'flat'
  | 'elevated-shallow'
  | 'elevated-tall';

interface Tile {
  label: string;
  value: number;
  pct?: number;
  tone: 'primary' | 'warn' | 'purple' | 'dim' | 'alert';
  elevation: Elevation;
  glow?: boolean;
}

const TONE_TEXT: Record<Tile['tone'], string> = {
  primary: 'text-primary',
  warn: 'text-[var(--color-warning)]',
  purple: 'text-[var(--color-cyber-purple)]',
  dim: 'text-muted-foreground',
  alert: 'text-destructive',
};

const TONE_BAR: Record<Tile['tone'], string> = {
  primary: 'bg-primary',
  warn: 'bg-[var(--color-warning)]',
  purple: 'bg-[var(--color-cyber-purple)]',
  dim: 'bg-muted-foreground',
  alert: 'bg-destructive',
};

const ELEVATION_CLASS: Record<Elevation, string> = {
  'recessed-deep': 'depth-recessed-deep translate-y-[3px]',
  'recessed-shallow': 'depth-recessed-shallow translate-y-[1.5px]',
  flat: 'depth-flat',
  'elevated-shallow': 'depth-elevated-shallow -translate-y-[1.5px]',
  'elevated-tall': 'depth-elevated-tall -translate-y-[4px]',
};

export function MetricsStrip() {
  const { t } = useTranslation();
  const devices = useLiveStore((state) => state.devices);
  const positions = useLiveStore((state) => state.positions);
  const events = useLiveStore((state) => state.events);
  const setEventsOpen = useMapUiStore((state) => state.setEventsOpen);

  const tiles = useMemo<Tile[]>(() => {
    const list = Object.values(devices);
    const total = list.length;
    let moving = 0;
    let idle = 0;
    let stopped = 0;
    let offline = 0;
    for (const device of list) {
      if (device.status !== 'online') {
        offline += 1;
        continue;
      }
      const speed = positions[device.id as number]?.speed ?? 0;
      if (speed > 1) moving += 1;
      else if (positions[device.id as number]) idle += 1;
      else stopped += 1;
    }
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
    return [
      { label: 'TOTAL', value: total, tone: 'dim', elevation: 'flat' },
      {
        label: 'MOVING',
        value: moving,
        pct: pct(moving),
        tone: 'primary',
        elevation: 'elevated-tall',
        glow: moving > 0,
      },
      { label: 'IDLE', value: idle, pct: pct(idle), tone: 'warn', elevation: 'flat' },
      {
        label: 'STOPPED',
        value: stopped,
        pct: pct(stopped),
        tone: 'purple',
        elevation: 'recessed-shallow',
      },
      { label: 'OFFLINE', value: offline, tone: 'dim', elevation: 'recessed-deep' },
    ];
  }, [devices, positions]);

  const latest = useMemo(() => events.slice(-3).reverse(), [events]);

  const now = dayjs();

  return (
    <footer className="relative z-20 flex h-24 shrink-0 items-stretch border-t border-border bg-card/80 px-4 backdrop-blur-sm cyber-grid print:hidden">
      <span className="pointer-events-none absolute inset-0 depth-toplight" aria-hidden />

      {/* Mixing-board tiles — heights vary per status meaning */}
      <div className="flex items-end gap-2 py-2 pe-3 me-3 border-e border-border">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={cn(
              'relative flex h-[68px] w-24 flex-col justify-between p-2.5 transition-transform',
              ELEVATION_CLASS[tile.elevation],
            )}
          >
            <span className="cyber-label text-[9px]">{tile.label}</span>
            <span className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-mono text-2xl font-bold tracking-tight tabular-nums leading-none',
                  TONE_TEXT[tile.tone],
                  tile.glow && 'cyber-glow',
                )}
              >
                {tile.value}
              </span>
              {tile.pct !== undefined && (
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                  {tile.pct}%
                </span>
              )}
            </span>
            <span className={cn('h-px w-full', TONE_BAR[tile.tone], 'opacity-60')} />
          </div>
        ))}
      </div>

      {/* Alerts ticker */}
      <button
        type="button"
        onClick={() => setEventsOpen(true)}
        className="flex flex-1 flex-col justify-center text-left"
        aria-label={t('reportEvents')}
      >
        <span className="cyber-label text-[9px]">
          ACTIVE ALERTS · <span className="text-destructive">[ {events.length} ]</span>
        </span>
        <div className="mt-1 flex items-center gap-3 overflow-hidden">
          {latest.length === 0 ? (
            <span className="cyber-text-dim font-mono text-xs tracking-wide">
              NOMINAL · NO ACTIVE ALERTS
            </span>
          ) : (
            latest.map((event) => (
              <span
                key={`${event.id ?? `${event.type}-${event.eventTime}`}`}
                className="inline-flex items-center gap-2 truncate"
              >
                <span className="inline-block h-1.5 w-1.5 bg-destructive cyber-box-glow-alert" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-destructive">
                  {event.type}
                </span>
                <span className="font-mono text-[11px] text-foreground tracking-wide">
                  · ID #{event.deviceId}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
                  · {event.eventTime ? dayjs(event.eventTime).format('HH:mm') : '—'}
                </span>
              </span>
            ))
          )}
        </div>
      </button>

      {/* Clock + date */}
      <div className="ml-3 ps-4 border-s border-border flex flex-col justify-center items-end">
        <span className="font-mono text-base font-bold tracking-wider text-foreground">
          {now.format('HH:mm:')}
          <span className="text-primary cyber-glow">{now.format('ss')}</span>
        </span>
        <span className="cyber-label mt-1">
          {now.format('ddd, MMM D · YYYY').toUpperCase()}
        </span>
      </div>
    </footer>
  );
}
