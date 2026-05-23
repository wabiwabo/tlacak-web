import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2',
    'border whitespace-nowrap font-mono font-semibold uppercase tracking-[0.08em]',
    'text-xs',
    'transition-[background-color,border-color,color,box-shadow,opacity] duration-150',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-0',
    'disabled:pointer-events-none disabled:opacity-40',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_18px_rgba(0,255,200,0.45)]',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_18px_rgba(255,56,100,0.45)]',
        warning:
          'border-[var(--color-warning)] bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90 hover:shadow-[0_0_18px_rgba(255,170,0,0.45)]',
        outline:
          'border-border bg-transparent text-foreground hover:border-primary/70 hover:text-primary hover:bg-card',
        secondary:
          'border-border bg-card text-foreground hover:border-primary/60 hover:bg-secondary',
        ghost:
          'border-transparent bg-transparent text-foreground hover:bg-card hover:text-primary',
        link:
          'border-transparent bg-transparent text-primary underline-offset-4 hover:underline normal-case tracking-normal font-medium',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 px-2 text-[10px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 text-[13px] has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
