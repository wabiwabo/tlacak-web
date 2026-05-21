import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List as ListIcon, Map as MapIcon, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useGroupsQuery } from '@/entities/group';
import { useDeviceReadonly } from '@/entities/session';
import { useFilterStore } from './model/filter-store';
import { useMapUiStore } from './model/map-ui-store';
import { useLiveStore } from './model/live-store';
import type { DeviceSort } from './lib/filter-devices';

const STATUSES = ['online', 'offline', 'unknown'] as const;

export function MainToolbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const deviceReadonly = useDeviceReadonly();
  const { data: groups = [] } = useGroupsQuery();
  const devices = useLiveStore((state) => state.devices);

  const keyword = useFilterStore((state) => state.keyword);
  const setKeyword = useFilterStore((state) => state.setKeyword);
  const statuses = useFilterStore((state) => state.statuses);
  const setStatuses = useFilterStore((state) => state.setStatuses);
  const groupFilter = useFilterStore((state) => state.groups);
  const setGroups = useFilterStore((state) => state.setGroups);
  const sort = useFilterStore((state) => state.sort);
  const setSort = useFilterStore((state) => state.setSort);
  const filterMap = useFilterStore((state) => state.filterMap);
  const setFilterMap = useFilterStore((state) => state.setFilterMap);

  const devicesOpen = useMapUiStore((state) => state.devicesOpen);
  const setDevicesOpen = useMapUiStore((state) => state.setDevicesOpen);

  const statusCount = (status: string) =>
    Object.values(devices).filter((device) => device.status === status).length;

  const toggleStatus = (status: string) =>
    setStatuses(
      statuses.includes(status)
        ? statuses.filter((value) => value !== status)
        : [...statuses, status],
    );

  const toggleGroup = (id: number) =>
    setGroups(
      groupFilter.includes(id) ? groupFilter.filter((value) => value !== id) : [...groupFilter, id],
    );

  const filterActive = statuses.length > 0 || groupFilter.length > 0;

  return (
    <div className="flex items-center gap-2 border-b border-border p-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('mapTitle')}
        onClick={() => setDevicesOpen(!devicesOpen)}
      >
        {devicesOpen ? <MapIcon className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
      </Button>
      <Input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder={t('sharedSearchDevices')}
        className="flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('sharedFilter')}
            data-active={filterActive}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-64 flex-col gap-3">
          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-medium">{t('deviceStatus')}</legend>
            {STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                {t(`deviceStatus${status[0]!.toUpperCase()}${status.slice(1)}`)} (
                {statusCount(status)})
              </label>
            ))}
          </fieldset>
          <fieldset className="flex max-h-40 flex-col gap-1 overflow-auto">
            <legend className="text-xs font-medium">{t('settingsGroups')}</legend>
            {[...groups]
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .map((group) => (
                <label key={group.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={groupFilter.includes(group.id as number)}
                    onChange={() => toggleGroup(group.id as number)}
                  />
                  {group.name}
                </label>
              ))}
          </fieldset>
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t('sharedSortBy')}
            <select
              className="rounded border border-border bg-background p-1 text-sm"
              value={sort}
              onChange={(event) => setSort(event.target.value as DeviceSort)}
            >
              <option value="">&nbsp;</option>
              <option value="name">{t('sharedName')}</option>
              <option value="lastUpdate">{t('deviceLastUpdate')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterMap}
              onChange={(event) => setFilterMap(event.target.checked)}
            />
            {t('sharedFilterMap')}
          </label>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('sharedAdd')}
        disabled={deviceReadonly}
        onClick={() => navigate('/settings/device')}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
