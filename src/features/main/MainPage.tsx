import { useMemo } from 'react';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { useGroupsQuery } from '@/entities/group';
import { MainMap } from './MainMap';
import { MainToolbar } from './MainToolbar';
import { DeviceList } from './DeviceList';
import { StatusCard } from './StatusCard';
import { EventsDrawer } from './EventsDrawer';
import { filterDevices } from './lib/filter-devices';
import { useLiveStore } from './model/live-store';
import { useFilterStore } from './model/filter-store';
import { useMapUiStore } from './model/map-ui-store';
import { useSelectionStore } from './model/selection-store';

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

  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <MainMap positions={filteredPositions} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 flex w-full flex-col p-0 md:m-3 md:h-[calc(100%-1.5rem)] md:w-[280px]">
        <div className="pointer-events-auto bg-background shadow">
          <MainToolbar />
        </div>
        {(devicesOpen || !desktop) && (
          <div
            className="pointer-events-auto flex-1 overflow-hidden bg-background shadow"
            style={devicesOpen ? undefined : { visibility: 'hidden' }}
          >
            <DeviceList devices={filteredDevices} />
          </div>
        )}
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && <StatusCard deviceId={selectedDeviceId} />}
    </div>
  );
}
