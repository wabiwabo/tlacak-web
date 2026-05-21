import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceSort } from '../lib/filter-devices';

interface FilterState {
  keyword: string;
  statuses: string[];
  groups: number[];
  sort: DeviceSort;
  filterMap: boolean;
  setKeyword: (keyword: string) => void;
  setStatuses: (statuses: string[]) => void;
  setGroups: (groups: number[]) => void;
  setSort: (sort: DeviceSort) => void;
  setFilterMap: (filterMap: boolean) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      keyword: '',
      statuses: [],
      groups: [],
      sort: '',
      filterMap: false,
      setKeyword: (keyword) => set({ keyword }),
      setStatuses: (statuses) => set({ statuses }),
      setGroups: (groups) => set({ groups }),
      setSort: (sort) => set({ sort }),
      setFilterMap: (filterMap) => set({ filterMap }),
    }),
    {
      name: 'traccar-device-filter',
      // `keyword` is transient — only persist the durable filter choices.
      partialize: (state) => ({
        statuses: state.statuses,
        groups: state.groups,
        sort: state.sort,
        filterMap: state.filterMap,
      }),
    },
  ),
);
