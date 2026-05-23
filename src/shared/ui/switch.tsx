import { Switch as SwitchPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border bg-card transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary/15 data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_rgba(0,255,200,0.35)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-muted-foreground transition-transform',
          'data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
