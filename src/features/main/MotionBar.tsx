import { useMotionStore } from '@/features/live';
import { cn } from '@/shared/lib/cn';

export function MotionBar({ deviceId }: { deviceId: number }) {
  const segments = useMotionStore((state) => state.segments[deviceId] ?? []);

  return (
    <span className="inline-flex h-2 w-32 bg-muted align-middle">
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(segment.type === 'moving' ? 'bg-emerald-500' : 'bg-rose-500')}
          style={{ flexGrow: segment.value, minWidth: segments.length > 16 ? 0 : 4 }}
        />
      ))}
    </span>
  );
}
