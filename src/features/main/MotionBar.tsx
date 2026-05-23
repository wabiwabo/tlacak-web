import { useMotionStore } from '@/features/live';
import { cn } from '@/shared/lib/cn';

const SEGMENT_CLASS: Record<string, string> = {
  moving: 'bg-primary',
  idle: 'bg-[var(--color-warning)]',
  stopped: 'bg-[var(--color-cyber-purple)]',
};

export function MotionBar({ deviceId }: { deviceId: number }) {
  const segments = useMotionStore((state) => state.segments[deviceId] ?? []);

  return (
    <span className="inline-flex h-1.5 w-28 border border-border bg-background/40 align-middle">
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(SEGMENT_CLASS[segment.type] ?? 'bg-muted-foreground', 'opacity-80')}
          style={{ flexGrow: segment.value, minWidth: segments.length > 16 ? 0 : 3 }}
        />
      ))}
    </span>
  );
}
