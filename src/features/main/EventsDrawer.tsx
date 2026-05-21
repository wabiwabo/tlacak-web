import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { useLiveStore } from './model/live-store';
import { cn } from '@/shared/lib/cn';

interface EventsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function EventsDrawer({ open, onClose }: EventsDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const events = useLiveStore((state) => state.events);
  const devices = useLiveStore((state) => state.devices);
  const deleteEvent = useLiveStore((state) => state.deleteEvent);
  const clearEvents = useLiveStore((state) => state.clearEvents);

  return (
    <aside
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'fixed inset-y-0 end-0 z-20 w-80 border-s border-border bg-background shadow-lg transition-transform',
        open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full',
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-2">
        <span className="text-sm font-medium">{t('reportEvents')}</span>
        <div className="flex gap-1">
          <button type="button" aria-label={t('sharedRemove')} onClick={() => clearEvents()}>
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label={t('sharedClose')} onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-border overflow-auto">
        {events.map((event, index) => (
          <li key={event.id ?? `event-${index}`} className="flex items-center gap-2 p-2 text-sm">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              disabled={!event.id}
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <span className="block truncate">
                {devices[event.deviceId as number]?.name} • {t(`event${event.type}`)}
              </span>
            </button>
            <button
              type="button"
              aria-label={t('sharedRemove')}
              onClick={() => {
                if (event.id !== undefined) {
                  deleteEvent(event.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
