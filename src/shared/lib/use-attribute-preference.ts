import { useSessionStore } from '@/entities/session';

export interface UnitPreferences {
  speedUnit: string;
  distanceUnit: string;
  volumeUnit: string;
  altitudeUnit: string;
}

/** Reads a single attribute preference with the user → server → default fallback. */
export function useAttributePreference(key: string, defaultValue: string): string {
  return useSessionStore((state) => {
    const user = state.user?.attributes?.[key];
    const server = state.server?.attributes?.[key];
    return (user as string) || (server as string) || defaultValue;
  });
}

/** The four unit preferences a report needs, resolved once. */
export function useUnitPreferences(): UnitPreferences {
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const volumeUnit = useAttributePreference('volumeUnit', 'ltr');
  const altitudeUnit = useAttributePreference('altitudeUnit', 'm');
  return { speedUnit, distanceUnit, volumeUnit, altitudeUnit };
}
