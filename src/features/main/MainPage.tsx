import { useMemo } from 'react';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { useGroupsQuery } from '@/entities/group';
import { MainMap } from './MainMap';
import { MainToolbar } from './MainToolbar';
import { DeviceList } from './DeviceList';
import { StatusCard } from './StatusCard';
import { EventsDrawer } from './EventsDrawer';
import { MetricsStrip } from './MetricsStrip';
import { filterDevices } from './lib/filter-devices';
import { useLiveStore } from './model/live-store';
import { useFilterStore } from './model/filter-store';
import { useMapUiStore } from './model/map-ui-store';
import { useSelectionStore } from './model/selection-store';

function FleetHeader({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border px-3 py-3 cyber-grid">
      <div className="flex flex-col gap-0.5">
        <div className="cyber-label flex items-center gap-1">
          <span className="text-primary">//</span> FLEET
        </div>
        <div className="font-mono text-xs text-muted-foreground tracking-[0.14em]">
          <span className="text-foreground font-bold">{count}</span>
          <span className="text-muted-foreground"> / {total}</span>
          <span className="ms-1">UNITS</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-mono text-primary tracking-wider">
        <span className="inline-block h-1.5 w-1.5 bg-primary animate-cyber-pulse" />
        LIVE
      </div>
    </div>
  );
}

export function MainPage() {
  const desktop = useMediaQuery('(min-width: 768px)');
  const { data: groups = [] } = useGroupsQuery();

  const devices = useLiveStore((state) => state.devices);
  const positions = useLiveStore((state) => state.positions);
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);

  const keyword = useFilterStore((state) => state.keyword);
  const statuses = useFilterStore((state) => state.statuses);
  const groupFilter = useFilterStore((state) => state.groups);
  const sort = useFilterStore((state) => state.sort);
  const filterMap = useFilterStore((state) => state.filterMap);

  const devicesOpen = useMapUiStore((state) => state.devicesOpen);
  const eventsOpen = useMapUiStore((state) => state.eventsOpen);
  const setEventsOpen = useMapUiStore((state) => state.setEventsOpen);

  const filteredDevices = useMemo(
    () =>
      filterDevices(Object.values(devices), groups, {
        keyword,
        statuses,
        groups: groupFilter,
        sort,
      }),
    [devices, groups, keyword, statuses, groupFilter, sort],
  );

  const filteredPositions = useMemo(() => {
    if (filterMap) {
      return filteredDevices
        .map((device) => positions[device.id as number])
        .filter((position): position is NonNullable<typeof position> => Boolean(position));
    }
    return Object.values(positions);
  }, [filterMap, filteredDevices, positions]);

  const total = Object.keys(devices).length;
  const showRightPanel = desktop && selectedDeviceId !== null;

  // Desktop: 3-col grid + bottom metrics strip
  if (desktop) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div
          className={
            'grid min-h-0 flex-1 ' +
            (showRightPanel
              ? 'grid-cols-[340px_1fr_360px]'
              : 'grid-cols-[340px_1fr]')
          }
        >
          {/* Left — fleet panel */}
          <aside className="flex min-h-0 flex-col border-e border-border bg-card/60">
            <FleetHeader count={filteredDevices.length} total={total} />
            <MainToolbar />
            <div className="flex-1 min-h-0">
              <DeviceList devices={filteredDevices} />
            </div>
          </aside>

          {/* Center — map */}
          <div className="relative min-h-0">
            <div className="absolute inset-0">
              <MainMap positions={filteredPositions} />
            </div>
            <div
              className="pointer-events-none absolute inset-0 cyber-grid opacity-40"
              aria-hidden
            />
            <div className="pointer-events-none absolute top-3 left-3 z-10">
              <div className="border border-border bg-card/70 backdrop-blur-sm px-2 py-1 cyber-label cyber-text-bright text-[10px]">
                SECTOR 07 · JKT–BDG CORRIDOR
              </div>
            </div>
          </div>

          {/* Right — selected vehicle panel */}
          {showRightPanel && selectedDeviceId !== null && (
            <StatusCard deviceId={selectedDeviceId} />
          )}
        </div>
        <MetricsStrip />
        <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      </div>
    );
  }

  // Mobile: original overlay pattern (map full-bleed + sliding list + bottom-sheet status)
  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <MainMap positions={filteredPositions} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 flex w-full flex-col p-0">
        <div className="pointer-events-auto border-b border-border bg-card">
          <MainToolbar />
        </div>
        {devicesOpen && (
          <div className="pointer-events-auto flex-1 overflow-hidden bg-card">
            <FleetHeader count={filteredDevices.length} total={total} />
            <div className="h-[calc(100%-3.75rem)]">
              <DeviceList devices={filteredDevices} />
            </div>
          </div>
        )}
      </div>
      {selectedDeviceId !== null && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto">
          <StatusCard deviceId={selectedDeviceId} />
        </div>
      )}
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </div>
  );
}
