import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Group } from '../model/types';

export const groupKeys = {
  all: ['groups'] as const,
};

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await apiClient.GET('/groups');
  if (error || !data) {
    throw new Error('Failed to load groups');
  }
  return data as Group[];
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: fetchGroups,
    staleTime: 5 * 60 * 1000,
  });
}
