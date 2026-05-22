import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

/**
 * Thin typed `fetch` wrapper for REST CRUD — mirrors the raw-fetch style of
 * `session-api.ts`. Throws the response body (or status text) on a non-ok
 * response so errors surface through TanStack Query.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Minimum shape a CRUD resource item must satisfy. */
export interface CrudEntity {
  id?: number;
}

export interface CrudKeys {
  all: readonly [string];
  list: (query: string) => readonly [string, string];
  detail: (id: number) => readonly [string, number];
}

export function crudKeys(resource: string): CrudKeys {
  return {
    all: [resource],
    list: (query) => [resource, query],
    detail: (id) => [resource, id],
  };
}

/**
 * Builds `useList` / `useSave` / `useRemove` hooks plus a `keys` object for a
 * standard REST resource (`GET/POST /<resource>`, `PUT/DELETE /<resource>/<id>`).
 * `useSave` POSTs when the item has no `id`, PUTs otherwise. Both mutations
 * invalidate the resource's collection query on success.
 */
export function createCrudHooks<T extends CrudEntity>(resource: string) {
  const keys = crudKeys(resource);

  const api = {
    list: (query = '') => request<T[]>(`/${resource}${query}`),
    get: (id: number) => request<T>(`/${resource}/${id}`),
    create: (item: T) => request<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(item) }),
    update: (item: T) =>
      request<T>(`/${resource}/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (id: number) => request<void>(`/${resource}/${id}`, { method: 'DELETE' }),
  };

  function useList(query = '', options?: { staleTime?: number }) {
    return useQuery({
      queryKey: query ? keys.list(query) : keys.all,
      queryFn: () => api.list(query),
      staleTime: options?.staleTime ?? 0,
    });
  }

  function useSave() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (item: T) => (item.id ? api.update(item) : api.create(item)),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useRemove() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => api.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  return { resource, keys, api, useList, useSave, useRemove };
}

export type CrudHooks<T extends CrudEntity> = ReturnType<typeof createCrudHooks<T>>;
