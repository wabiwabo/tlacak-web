import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronsUpDown } from 'lucide-react';
import { request } from '@/shared/api/crud';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib/cn';

type Key = string | number;

interface SelectFieldProps<T> {
  label: string;
  value: Key | Key[] | undefined;
  onChange: (value: Key | Key[] | undefined) => void;
  /** Static option list. Mutually exclusive with `endpoint`. */
  data?: T[];
  /** API path (relative to /api) to fetch options from. */
  endpoint?: string;
  /** Extracts an option's key. Default: `item.id`. */
  optionKey?: (item: T) => Key;
  /** Extracts an option's display label. Default: `item.name`. */
  optionLabel?: (item: T) => string;
  multiple?: boolean;
  disabled?: boolean;
}

export function SelectField<T extends Record<string, unknown>>({
  label,
  value,
  onChange,
  data,
  endpoint,
  optionKey = (item) => item.id as Key,
  optionLabel = (item) => String(item.name ?? ''),
  multiple = false,
  disabled = false,
}: SelectFieldProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const { data: fetched } = useQuery({
    queryKey: ['select-field', endpoint],
    queryFn: () => request<T[]>(endpoint as string),
    enabled: Boolean(endpoint),
    staleTime: 5 * 60 * 1000,
  });

  const options = useMemo(() => data ?? fetched ?? [], [data, fetched]);
  const selected: Key[] = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value === undefined
      ? []
      : [value as Key];

  const labelByKey = useMemo(() => {
    const map = new Map<Key, string>();
    for (const item of options) {
      map.set(optionKey(item), optionLabel(item));
    }
    return map;
  }, [options, optionKey, optionLabel]);

  const filtered = options.filter((item) =>
    optionLabel(item).toLowerCase().includes(filter.toLowerCase()),
  );

  const triggerText =
    selected.length === 0
      ? t('sharedSearch')
      : selected.map((key) => labelByKey.get(key) ?? String(key)).join(', ');

  const toggle = (key: Key) => {
    if (multiple) {
      const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
      onChange(next);
    } else {
      onChange(selected[0] === key ? undefined : key);
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={label}
            className="justify-between font-normal"
          >
            <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>
              {triggerText}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder={t('sharedSearch')}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.map((item) => {
              const key = optionKey(item);
              return (
                <li key={String(key)}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {multiple ? <Checkbox checked={selected.includes(key)} /> : null}
                    {optionLabel(item)}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{t('sharedSearch')}</li>
            ) : null}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
