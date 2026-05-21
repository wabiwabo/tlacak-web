import { useEffect, useRef } from 'react';
import { map } from '../core/map-instance';
import { useLiveStore } from '@/features/main/model/live-store';
import { useSelectionStore } from '@/features/main/model/selection-store';

const SELECT_ZOOM = 10;

export function MapSelectedDevice() {
  const selectedDeviceId = useSelectionStore((state) => state.selectedDeviceId);
  const selectTime = useSelectionStore((state) => state.selectTime);
  const position = useLiveStore((state) =>
    selectedDeviceId ? state.positions[selectedDeviceId] : undefined,
  );
  const previousSelectTime = useRef(0);

  useEffect(() => {
    if (position && selectTime !== previousSelectTime.current) {
      map.easeTo({
        center: [position.longitude as number, position.latitude as number],
        zoom: Math.max(map.getZoom(), SELECT_ZOOM),
      });
    }
    previousSelectTime.current = selectTime;
  }, [selectedDeviceId, selectTime, position]);

  return null;
}
