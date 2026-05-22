import dayjs from 'dayjs';

/** Knots → display speed unit. */
const SPEED_FACTORS: Record<string, number> = { kn: 1, kmh: 1.852, mph: 1.150779 };
const SPEED_SUFFIX: Record<string, string> = { kn: 'kn', kmh: 'km/h', mph: 'mph' };
/** Metres → display distance unit. */
const DISTANCE_FACTORS: Record<string, number> = {
  m: 1,
  km: 0.001,
  mi: 0.000621371,
  nmi: 0.000539957,
};
const DISTANCE_SUFFIX: Record<string, string> = { m: 'm', km: 'km', mi: 'mi', nmi: 'nmi' };
/** Litres → display volume unit. */
const VOLUME_FACTORS: Record<string, number> = { ltr: 1, usGal: 0.264172, impGal: 0.219969 };
const VOLUME_SUFFIX: Record<string, string> = { ltr: 'l', usGal: 'gal', impGal: 'gal' };

export type TimePrecision = 'date' | 'time' | 'minutes' | 'seconds';

const TIME_FORMATS: Record<TimePrecision, string> = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  minutes: 'YYYY-MM-DD HH:mm',
  seconds: 'YYYY-MM-DD HH:mm:ss',
};

/** Formats an ISO datetime string (or epoch ms) at the given precision; '' when absent. */
export function formatTime(
  value: string | number | undefined | null,
  precision: TimePrecision,
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return dayjs(value).format(TIME_FORMATS[precision]);
}

/** Converts a metre distance to the user's unit and appends the suffix. */
export function formatDistance(metres: number, unit: string): string {
  const factor = DISTANCE_FACTORS[unit] ?? DISTANCE_FACTORS['km'];
  return `${(metres * (factor as number)).toFixed(2)} ${DISTANCE_SUFFIX[unit] ?? 'km'}`;
}

/** Converts a knots speed to the user's unit and appends the suffix. */
export function formatSpeed(knots: number, unit: string): string {
  const factor = SPEED_FACTORS[unit] ?? SPEED_FACTORS['kn'];
  return `${(knots * (factor as number)).toFixed(2)} ${SPEED_SUFFIX[unit] ?? 'kn'}`;
}

/** Converts a litre volume to the user's unit and appends the suffix. */
export function formatVolume(litres: number, unit: string): string {
  const factor = VOLUME_FACTORS[unit] ?? VOLUME_FACTORS['ltr'];
  return `${(litres * (factor as number)).toFixed(2)} ${VOLUME_SUFFIX[unit] ?? 'l'}`;
}

/** Renders a millisecond duration as `H h M m`. */
export function formatNumericHours(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes} m`;
}

/** A boolean as a check mark or empty string. */
export function formatBoolean(value: unknown): string {
  return value ? '✓' : '';
}

/** Best-effort address: the provided address string, else `lat, lon`. */
export function formatAddress(
  address: string | undefined | null,
  latitude?: number,
  longitude?: number,
): string {
  if (address) {
    return address;
  }
  if (latitude !== undefined && longitude !== undefined) {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
  return '';
}
