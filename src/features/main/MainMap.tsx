import { useCallback, useMemo } from 'react';
import {
  MapView,
  MapPositions,
  MapGeofence,
  MapAccuracy,
  MapLiveRoutes,
  MapSelectedDevice,
  MapDefaultCamera,
} from '@/map';
import { useSelectionStore } from './model/selection-store';
import type { Position } from '@/entities/position';

export function MainMap({ positions }: { positions: Position[] }) {
  const select = useSelectionStore((state) => state.select);
  const onMarkerClick = useCallback((deviceId: number) => select(deviceId), [select]);
  const deviceIds = useMemo(
    () => positions.map((position) => position.deviceId as number),
    [positions],
  );

  return (
    <MapView>
      <MapGeofence />
      <MapAccuracy positions={positions} />
      <MapLiveRoutes deviceIds={deviceIds} />
      <MapPositions positions={positions} onMarkerClick={onMarkerClick} />
      <MapDefaultCamera positions={positions} />
      <MapSelectedDevice />
    </MapView>
  );
}
