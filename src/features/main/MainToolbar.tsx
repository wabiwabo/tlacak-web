import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button, Badge, Switch, Label } from '@/shared/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useGroupsQuery } from '@/entities/group';
import { useDeviceReadonly } from '@/entities/session';
import { useFilterStore } from './model/filter-store';
import { useLiveStore } from './model/live-store';
import { cn } from '@/shared/lib/cn';
import type { DeviceSort } from './lib/filter-devices';

interface ChipDef {
  id: string;
  label: string;
  count: number;
  variant: 'moving' | 'idle' | 'stopped' | 'offline' | 'outline';
}

export function MainToolbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const deviceReadonly = useDeviceReadonly();
  const { data: groups = [] } = useGroupsQuery();
  const devices = useLiveStore((state) => state.devices);
  const positions = useLiveStore((state) => state.positions);

  const statuses = useFilterStore((state) => state.statuses);
  const setStatuses = useFilterStore((state) => state.setStatuses);
  const groupFilter = useFilterStore((state) => state.groups);
  const setGroups = useFilterStore((state) => state.setGroups);
  const sort = useFilterStore((state) => state.sort);
  const setSort = useFilterStore((state) => state.setSort);
  const filterMap = useFilterStore((state) => state.filterMap);
  const setFilterMap = useFilterStore((state) => state.setFilterMap);

  const list = Object.values(devices);
  const total = list.length;
  let moving = 0;
  let idle = 0;
  let stopped = 0;
  let offline = 0;
  for (const d of list) {
    if (d.status !== 'online') offline += 1;
    else if ((positions[d.id as number]?.speed ?? 0) > 1) moving += 1;
    else if (positions[d.id as number]) idle += 1;
    else stopped += 1;
  }

  // Chips are "additive filters" — clicking toggles statuses[] in the store.
  // 'all' is selected when statuses[] is empty (the canonical empty-filter state).
  const isAll = statuses.length === 0;
  const has = (s: string) => statuses.includes(s);

  function toggleStatus(status: string) {
    setStatuses(has(status) ? statuses.filter((value) => value !== status) : [...statuses, status]);
  }

  function clearStatuses() {
    setStatuses([]);
  }

  const chips: ChipDef[] = [
    { id: 'all', label: 'ALL', count: total, variant: 'outline' },
    { id: 'online', label: 'MOVING', count: moving, variant: 'moving' },
    { id: 'idle', label: 'IDLE', count: idle, variant: 'idle' },
    { id: 'unknown', label: 'STOPPED', count: stopped, variant: 'stopped' },
    { id: 'offline', label: 'OFFLINE', count: offline, variant: 'offline' },
  ];

  const filterActive = statuses.length > 0 || groupFilter.length > 0;

  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {chips.map((chip) => {
          const active = chip.id === 'all' ? isAll : has(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => (chip.id === 'all' ? clearStatuses() : toggleStatus(chip.id))}
              className={cn(
                'shrink-0 transition-all',
                active
                  ? 'ring-1 ring-primary/50 ring-offset-0'
                  : 'opacity-60 hover:opacity-100',
              )}
            >
              <Badge variant={chip.variant} size="sm" bracketed>
                {chip.label} · {chip.count}
              </Badge>
            </button>
          );
        })}

        <div className="ms-auto flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('sharedFilter')}
                data-active={filterActive}
                className={cn(filterActive && 'border-primary/60 text-primary')}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-64 flex-col gap-3">
              <fieldset className="flex max-h-40 flex-col gap-1 overflow-auto">
                <legend className="cyber-label text-[10px]">{t('settingsGroups')}</legend>
                {[...groups]
                  .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                  .map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 font-mono text-xs tracking-wide"
                    >
                      <input
                        type="checkbox"
                        checked={groupFilter.includes(group.id as number)}
                        onChange={() =>
                          setGroups(
                            groupFilter.includes(group.id as number)
                              ? groupFilter.filter((value) => value !== (group.id as number))
                              : [...groupFilter, group.id as number],
                          )
                        }
                        className="accent-primary"
                      />
                      {group.name}
                    </label>
                  ))}
              </fieldset>
              <label className="flex flex-col gap-1 cyber-label text-[10px]">
                {t('sharedSortBy')}
                <select
                  className="border border-border bg-card font-mono text-xs tracking-wide p-1 text-foreground"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as DeviceSort)}
                >
                  <option value="">&nbsp;</option>
                  <option value="name">{t('sharedName')}</option>
                  <option value="lastUpdate">{t('deviceLastUpdate')}</option>
                </select>
              </label>
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-map" className="cyber-label text-[10px]">
                  {t('sharedFilterMap')}
                </Label>
                <Switch
                  id="filter-map"
                  checked={filterMap}
                  onCheckedChange={setFilterMap}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('sharedAdd')}
            disabled={deviceReadonly}
            onClick={() => navigate('/settings/device')}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
