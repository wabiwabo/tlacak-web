import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/entities/session';
import { fetchDevices } from '@/entities/device';
import { fetchPositions } from '@/entities/position';
import { useLiveStore } from '@/features/main/model/live-store';
import { parseSocketMessage } from '@/features/main/lib/socket-message';

const LOGOUT_CODE = 4000;
const RECONNECT_DELAY = 60_000;

export function SocketController() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const includeLogs = useLiveStore((state) => state.includeLogs);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveConfigRef = useRef({ liveRoutes: 'none', limit: 10 });

  useEffect(() => {
    liveConfigRef.current = {
      liveRoutes:
        (user?.attributes?.mapLiveRoutes as string) ||
        (server?.attributes?.mapLiveRoutes as string) ||
        'none',
      limit:
        (user?.attributes?.['web.liveRouteLength'] as number) ||
        (server?.attributes?.['web.liveRouteLength'] as number) ||
        10,
    };
  }, [user, server]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const live = useLiveStore.getState();

    const clearReconnect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    const connect = () => {
      clearReconnect();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/socket`);
      socketRef.current = socket;

      socket.onopen = () => live.setSocketOpen(true);

      socket.onmessage = (event) => {
        const data = parseSocketMessage(event.data as string);
        if (data.devices) {
          live.updateDevices(data.devices);
        }
        if (data.positions) {
          const { liveRoutes, limit } = liveConfigRef.current;
          live.applyPositions(data.positions, liveRoutes, limit);
        }
        if (data.events) {
          live.addEvents(data.events);
        }
        if (data.logs) {
          live.setLogs(data.logs);
        }
      };

      socket.onclose = async (event) => {
        live.setSocketOpen(false);
        if (event.code === LOGOUT_CODE) {
          return;
        }
        try {
          const devices = await fetchDevices();
          live.refreshDevices(devices);
          const positions = await fetchPositions();
          const { liveRoutes, limit } = liveConfigRef.current;
          live.refreshPositions(positions);
          live.applyPositions(positions, liveRoutes, limit);
        } catch {
          navigate('/login');
        }
        clearReconnect();
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
      };
    };

    void fetchDevices().then((devices) => live.refreshDevices(devices));
    connect();

    return () => {
      clearReconnect();
      socketRef.current?.close(LOGOUT_CODE);
    };
  }, [user, navigate]);

  useEffect(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ logs: includeLogs }));
    }
  }, [includeLogs]);

  return null;
}
