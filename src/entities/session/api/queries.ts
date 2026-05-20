import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchServer,
  fetchSession,
  login,
  logout,
  registerUser,
  requestPasswordReset,
  updatePassword,
  updateUser,
} from './session-api';
import { useSessionStore } from '../model/session-store';
import type { LoginCredentials, RegisterPayload, Server, User } from '../model/types';

export const sessionKeys = {
  server: ['session', 'server'] as const,
  user: ['session', 'user'] as const,
};

/** Loads GET /api/server once and mirrors it into the session store. */
export function useServerQuery() {
  const setServer = useSessionStore((state) => state.setServer);
  const query = useQuery({
    queryKey: sessionKeys.server,
    queryFn: fetchServer,
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    if (query.data) {
      setServer(query.data);
    }
  }, [query.data, setServer]);
  return query;
}

/** Loads GET /api/session and mirrors the user (or null) into the session store. */
export function useSessionQuery() {
  const setUser = useSessionStore((state) => state.setUser);
  const query = useQuery({
    queryKey: sessionKeys.user,
    queryFn: fetchSession,
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    if (query.data !== undefined) {
      setUser(query.data);
    }
  }, [query.data, setUser]);
  return query;
}

/** Synchronously sets the session-query cache + store after a successful auth flow. */
function useApplyUser() {
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  return (user: User) => {
    queryClient.setQueryData<User | null>(sessionKeys.user, user);
    setUser(user);
  };
}

export function useLogin() {
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: applyUser,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<User | null>(sessionKeys.user, null);
      setUser(null);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

export function usePasswordUpdate() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      updatePassword(token, password),
  });
}

/** Persists a user update (used by terms acceptance + native token sync). */
export function useUpdateUser() {
  const applyUser = useApplyUser();
  return useMutation({
    mutationFn: (user: User) => updateUser(user),
    onSuccess: applyUser,
  });
}

/** Patches the cached server config in place (e.g. clearing newServer after register). */
export function usePatchServer() {
  const queryClient = useQueryClient();
  const setServer = useSessionStore((state) => state.setServer);
  return (patch: Partial<Server>) => {
    const current = queryClient.getQueryData<Server>(sessionKeys.server);
    if (current) {
      const next = { ...current, ...patch };
      queryClient.setQueryData(sessionKeys.server, next);
      setServer(next);
    }
  };
}
