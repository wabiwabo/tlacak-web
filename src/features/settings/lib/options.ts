export interface StaticOption {
  key: string;
  labelKey: string;
}

export const coordinateFormatOptions: StaticOption[] = [
  { key: 'dd', labelKey: 'sharedDecimalDegrees' },
  { key: 'ddm', labelKey: 'sharedDegreesDecimalMinutes' },
  { key: 'dms', labelKey: 'sharedDegreesMinutesSeconds' },
];

export const speedUnitOptions: StaticOption[] = [
  { key: 'kn', labelKey: 'sharedKn' },
  { key: 'kmh', labelKey: 'sharedKmh' },
  { key: 'mph', labelKey: 'sharedMph' },
];

export const distanceUnitOptions: StaticOption[] = [
  { key: 'km', labelKey: 'sharedKm' },
  { key: 'mi', labelKey: 'sharedMi' },
  { key: 'nmi', labelKey: 'sharedNmi' },
];

export const altitudeUnitOptions: StaticOption[] = [
  { key: 'm', labelKey: 'sharedMeters' },
  { key: 'ft', labelKey: 'sharedFeet' },
];

export const volumeUnitOptions: StaticOption[] = [
  { key: 'ltr', labelKey: 'sharedLiter' },
  { key: 'usGal', labelKey: 'sharedUsGallon' },
  { key: 'impGal', labelKey: 'sharedImpGallon' },
];

export const attributeTypeOptions: StaticOption[] = [
  { key: 'string', labelKey: 'sharedTypeString' },
  { key: 'number', labelKey: 'sharedTypeNumber' },
  { key: 'boolean', labelKey: 'sharedTypeBoolean' },
];

export const calendarRecurrenceOptions: StaticOption[] = [
  { key: 'ONCE', labelKey: 'calendarOnce' },
  { key: 'DAILY', labelKey: 'calendarDaily' },
  { key: 'WEEKLY', labelKey: 'calendarWeekly' },
  { key: 'MONTHLY', labelKey: 'calendarMonthly' },
];

/** Device category keys; the label is the `category${Name}` translation key. */
export const deviceCategoryKeys = [
  'default',
  'animal',
  'bicycle',
  'boat',
  'bus',
  'car',
  'camper',
  'crane',
  'helicopter',
  'motorcycle',
  'offroad',
  'person',
  'pickup',
  'plane',
  'ship',
  'tractor',
  'train',
  'tram',
  'trolleybus',
  'truck',
  'van',
  'scooter',
] as const;
