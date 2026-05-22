import { useShallow } from 'zustand/shallow';
import { useSessionStore } from '@/entities/session';

export interface Features {
  disableGroups: boolean;
  disableDrivers: boolean;
  disableCalendars: boolean;
  disableComputedAttributes: boolean;
  disableMaintenance: boolean;
  disableSavedCommands: boolean;
  disableAttributes: boolean;
}

/** Server-attribute feature flags used to hide disabled settings sections. */
export function useFeatures(): Features {
  return useSessionStore(
    useShallow((state) => {
      const attrs: Record<string, unknown> = {
        ...state.server?.attributes,
        ...state.user?.attributes,
      };
      const flag = (key: string) => Boolean(attrs[key]);
      return {
        disableGroups: flag('ui.disableGroups'),
        disableDrivers: flag('ui.disableDrivers'),
        disableCalendars: flag('ui.disableCalendars'),
        disableComputedAttributes: flag('ui.disableComputedAttributes'),
        disableMaintenance: flag('ui.disableMaintenance'),
        disableSavedCommands: flag('ui.disableSavedCommands'),
        disableAttributes: flag('ui.disableAttributes'),
      };
    }),
  );
}
