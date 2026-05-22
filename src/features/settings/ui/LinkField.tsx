import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/crud';
import { SelectField } from './SelectField';

type Key = string | number;

interface LinkFieldProps<T> {
  label: string;
  /** Endpoint listing every linkable option. */
  endpointAll: string;
  /** Endpoint listing the options currently linked to the base entity. */
  endpointLinked: string;
  /** Id of the base entity (device/group/user). */
  baseId: number;
  /** Permission body key for the base entity, e.g. `deviceId`. */
  keyBase: string;
  /** Permission body key for the linked entity, e.g. `geofenceId`. */
  keyLink: string;
  optionKey?: (item: T) => Key;
  optionLabel?: (item: T) => string;
}

export function LinkField<T extends Record<string, unknown>>({
  label,
  endpointAll,
  endpointLinked,
  baseId,
  keyBase,
  keyLink,
  optionKey = (item) => item.id as Key,
  optionLabel = (item) => String(item.name ?? ''),
}: LinkFieldProps<T>) {
  const queryClient = useQueryClient();

  const { data: all } = useQuery({
    queryKey: ['link-all', endpointAll],
    queryFn: () => request<T[]>(endpointAll),
    staleTime: 5 * 60 * 1000,
  });
  const { data: linked } = useQuery({
    queryKey: ['link-linked', endpointLinked],
    queryFn: () => request<T[]>(endpointLinked),
  });

  const linkedKeys = (linked ?? []).map(optionKey);

  const mutate = async (method: 'POST' | 'DELETE', linkId: Key) => {
    await request('/permissions', {
      method,
      body: JSON.stringify({ [keyBase]: baseId, [keyLink]: linkId }),
    });
  };

  const handleChange = async (next: Key[]) => {
    const added = next.filter((key) => !linkedKeys.includes(key));
    const removed = linkedKeys.filter((key) => !next.includes(key));
    await Promise.all([
      ...added.map((key) => mutate('POST', key)),
      ...removed.map((key) => mutate('DELETE', key)),
    ]);
    await queryClient.invalidateQueries({ queryKey: ['link-linked', endpointLinked] });
  };

  return (
    <SelectField<T>
      label={label}
      data={all ?? []}
      value={linkedKeys}
      onChange={(value) => void handleChange(value as Key[])}
      optionKey={optionKey}
      optionLabel={optionLabel}
      multiple
    />
  );
}
