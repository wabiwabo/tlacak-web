import { useSessionStore } from './session-store';
import type { Server, User } from './types';

/** Keys readable as a boolean restriction off either user or server. */
type RestrictionKey = 'readonly' | 'disableReports' | 'limitCommands' | 'deviceReadonly';

export function useAdministrator(): boolean {
  return useSessionStore((state) => Boolean(state.user?.administrator));
}

export function useManager(): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const manager = (state.user?.userLimit ?? 0) !== 0;
    return admin || manager;
  });
}

export function useDeviceReadonly(): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const flags = [
      state.server?.readonly,
      state.user?.readonly,
      state.server?.deviceReadonly,
      state.user?.deviceReadonly,
    ];
    return !admin && flags.some(Boolean);
  });
}

export function useRestriction(key: RestrictionKey): boolean {
  return useSessionStore((state) => {
    const admin = Boolean(state.user?.administrator);
    const serverValue = (state.server as Server | null)?.[key as keyof Server];
    const userValue = (state.user as User | null)?.[key as keyof User];
    return !admin && Boolean(serverValue || userValue);
  });
}
