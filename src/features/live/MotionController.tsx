import { useEffect } from 'react';
import dayjs from 'dayjs';
import { useSessionStore } from '@/entities/session';
import { useMotionStore } from './motion-store';
import { buildMotionSegments, type MotionEvent } from '@/features/main/lib/motion-segments';

const REFRESH_INTERVAL = 5 * 60 * 1000;

interface ReportEvent extends MotionEvent {
  deviceId: number;
}

export function MotionController() {
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const deviceSecondary =
    (user?.attributes?.deviceSecondary as string) ||
    (server?.attributes?.deviceSecondary as string) ||
    '';

  useEffect(() => {
    if (deviceSecondary !== 'motion') {
      useMotionStore.getState().clear();
      return;
    }
    let active = true;

    const refresh = async () => {
      const to = dayjs();
      const from = to.subtract(24, 'hour');
      const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      query.append('type', 'deviceMoving');
      query.append('type', 'deviceStopped');
      const response = await fetch(`/api/reports/events?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return;
      }
      const events = (await response.json()) as ReportEvent[];
      const grouped = new Map<number, ReportEvent[]>();
      for (const event of events) {
        const list = grouped.get(event.deviceId) ?? [];
        list.push(event);
        grouped.set(event.deviceId, list);
      }
      const segments: Record<number, ReturnType<typeof buildMotionSegments>> = {};
      for (const [deviceId, deviceEvents] of grouped) {
        segments[deviceId] = buildMotionSegments(deviceEvents, from.valueOf(), to.valueOf());
      }
      if (active) {
        useMotionStore.getState().set(segments);
      }
    };

    void refresh();
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deviceSecondary]);

  return null;
}
