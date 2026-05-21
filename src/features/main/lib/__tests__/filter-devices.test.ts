import { describe, expect, it } from 'vitest';
import { filterDevices } from '../filter-devices';
import type { Device } from '@/entities/device';
import type { Group } from '@/entities/group';

const devices: Device[] = [
  { id: 1, name: 'Beta', uniqueId: 'b1', status: 'online', groupId: 10 } as Device,
  { id: 2, name: 'Alpha', uniqueId: 'a2', status: 'offline', groupId: 11 } as Device,
  { id: 3, name: 'Gamma', uniqueId: 'g3', status: 'online', groupId: undefined } as Device,
];
const groups: Group[] = [
  { id: 10, name: 'North', groupId: undefined } as Group,
  { id: 11, name: 'South', groupId: 10 } as Group,
];

describe('filterDevices', () => {
  it('returns every device when no filter is set', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [],
      sort: '',
    });
    expect(result).toHaveLength(3);
  });

  it('filters by keyword across name and uniqueId, case-insensitively', () => {
    const result = filterDevices(devices, groups, {
      keyword: 'alph',
      statuses: [],
      groups: [],
      sort: '',
    });
    expect(result.map((d) => d.id)).toEqual([2]);
  });

  it('filters by status', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: ['online'],
      groups: [],
      sort: '',
    });
    expect(result.map((d) => d.id).sort()).toEqual([1, 3]);
  });

  it('filters by group, including nested parent groups', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [10],
      sort: '',
    });
    expect(result.map((d) => d.id).sort()).toEqual([1, 2]);
  });

  it('sorts by name', () => {
    const result = filterDevices(devices, groups, {
      keyword: '',
      statuses: [],
      groups: [],
      sort: 'name',
    });
    expect(result.map((d) => d.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
