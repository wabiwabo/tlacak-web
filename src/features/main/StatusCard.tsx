import { Rnd } from 'react-rnd';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
import { useLiveStore } from './model/live-store';
import { useSelectionStore } from './model/selection-store';

const ATTRIBUTE_FIELDS: { key: string; labelKey: string }[] = [
  { key: 'speed', labelKey: 'positionSpeed' },
  { key: 'address', labelKey: 'positionAddress' },
  { key: 'batteryLevel', labelKey: 'positionBatteryLevel' },
];

export function StatusCard({ deviceId }: { deviceId: number }) {
  const { t } = useTranslation();
  const device = useLiveStore((state) => state.devices[deviceId]);
  const position = useLiveStore((state) => state.positions[deviceId]);
  const select = useSelectionStore((state) => state.select);

  if (!device) {
    return null;
  }

  return (
    <Rnd
      default={{ x: 24, y: 24, width: 320, height: 'auto' }}
      bounds="parent"
      enableResizing={false}
      dragHandleClassName="status-card-handle"
      style={{ zIndex: 5, pointerEvents: 'auto' }}
    >
      <Card>
        <div className="status-card-handle flex cursor-move items-center justify-between border-b border-border p-2">
          <span className="truncate text-sm font-medium">{device.name}</span>
          <button
            type="button"
            aria-label={t('sharedClose')}
            onClick={() => select(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CardContent className="p-2 text-sm">
          {position ? (
            <dl className="grid grid-cols-2 gap-1">
              {ATTRIBUTE_FIELDS.map(({ key, labelKey }) => {
                const value =
                  key in (position.attributes ?? {})
                    ? position.attributes[key]
                    : (position as unknown as Record<string, unknown>)[key];
                if (value === undefined || value === null) {
                  return null;
                }
                return (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{t(labelKey)}</dt>
                    <dd className="truncate">{String(value)}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <span className="text-muted-foreground">{t('sharedNoData')}</span>
          )}
        </CardContent>
      </Card>
    </Rnd>
  );
}
