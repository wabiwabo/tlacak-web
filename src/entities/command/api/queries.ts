import { useQuery } from '@tanstack/react-query';
import { createCrudHooks, request } from '@/shared/api/crud';
import type { Command, CommandType } from '../model/types';

const commandCrud = createCrudHooks<Command>('commands');

export const commandKeys = commandCrud.keys;
export const useCommandsQuery = commandCrud.useList;
export const useSaveCommand = commandCrud.useSave;
export const useRemoveCommand = commandCrud.useRemove;
export const commandsApi = commandCrud.api;

/** Command types supported by a device (or all types when no deviceId). */
export function useCommandTypesQuery(deviceId?: number) {
  const query = deviceId ? `?deviceId=${deviceId}` : '';
  return useQuery({
    queryKey: ['commandTypes', deviceId ?? 'all'],
    queryFn: () => request<CommandType[]>(`/commands/types${query}`),
  });
}

/** Saved commands sendable to a device. */
export function useSendableCommandsQuery(deviceId: number) {
  return useQuery({
    queryKey: ['commandsSend', deviceId],
    queryFn: () => request<Command[]>(`/commands/send?deviceId=${deviceId}`),
  });
}
