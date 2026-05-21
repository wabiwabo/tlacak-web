import dayjs from 'dayjs';
import type { Device } from '@/entities/device';
import type { Group } from '@/entities/group';

export type DeviceSort = '' | 'name' | 'lastUpdate';

export interface DeviceFilter {
  keyword: string;
  statuses: string[];
  groups: number[];
  sort: DeviceSort;
}

function deviceGroupChain(device: Device, groupsById: Map<number, Group>): number[] {
  const chain: number[] = [];
  let groupId = device.groupId ?? undefined;
  while (groupId) {
    chain.push(groupId);
    groupId = groupsById.get(groupId)?.groupId ?? undefined;
  }
  return chain;
}

/** Pure device filter + sort — the port of the legacy `useFilter` hook. */
export function filterDevices(devices: Device[], groups: Group[], filter: DeviceFilter): Device[] {
  const groupsById = new Map(groups.map((group) => [group.id as number, group]));
  const keyword = filter.keyword.toLowerCase();

  const result = devices
    .filter((device) => !filter.statuses.length || filter.statuses.includes(device.status ?? ''))
    .filter(
      (device) =>
        !filter.groups.length ||
        deviceGroupChain(device, groupsById).some((id) => filter.groups.includes(id)),
    )
    .filter((device) => {
      if (!keyword) {
        return true;
      }
      return [device.name, device.uniqueId, device.phone, device.model, device.contact].some(
        (value) => typeof value === 'string' && value.toLowerCase().includes(keyword),
      );
    });

  if (filter.sort === 'name') {
    result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  } else if (filter.sort === 'lastUpdate') {
    result.sort((a, b) => {
      const t1 = a.lastUpdate ? dayjs(a.lastUpdate).valueOf() : 0;
      const t2 = b.lastUpdate ? dayjs(b.lastUpdate).valueOf() : 0;
      return t2 - t1;
    });
  }

  return result;
}
