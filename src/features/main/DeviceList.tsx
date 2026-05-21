import { useEffect, useState } from 'react';
import { List } from 'react-window';
import { DeviceRow } from './DeviceRow';
import type { Device } from '@/entities/device';

export function DeviceList({ devices }: { devices: Device[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <List<{ devices: Device[] }>
      className="h-full"
      rowComponent={DeviceRow}
      rowCount={devices.length}
      rowHeight={72}
      rowProps={{ devices }}
      overscanCount={5}
    />
  );
}
