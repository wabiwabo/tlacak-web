import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 border font-mono font-semibold uppercase tracking-[0.16em]',
    'text-[10px] leading-none px-2 py-1 whitespace-nowrap',
    'transition-colors',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-primary/60 bg-primary/10 text-primary',
        moving: 'border-primary/60 bg-primary/10 text-primary',
        idle: 'border-[var(--color-warning)]/60 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
        stopped:
          'border-[var(--color-cyber-purple)]/60 bg-[var(--color-cyber-purple)]/10 text-[var(--color-cyber-purple)]',
        offline: 'border-muted-foreground/40 bg-muted/40 text-muted-foreground',
        alert:
          'border-destructive/70 bg-destructive/10 text-destructive cyber-glow-alert',
        warning:
          'border-[var(--color-warning)]/70 bg-[var(--color-warning)]/10 text-[var(--color-warning)] cyber-glow-warn',
        outline: 'border-border bg-transparent text-foreground',
        ghost: 'border-transparent bg-transparent text-muted-foreground',
      },
      size: {
        default: 'text-[10px] px-2 py-1',
        sm: 'text-[9px] px-1.5 py-0.5',
        lg: 'text-[11px] px-2.5 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    bracketed?: boolean;
  };

function Badge({
  className,
  variant = 'default',
  size = 'default',
  bracketed = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {bracketed && <span aria-hidden>[</span>}
      {children}
      {bracketed && <span aria-hidden>]</span>}
    </span>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
