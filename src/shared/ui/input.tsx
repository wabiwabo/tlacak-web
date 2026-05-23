import * as React from 'react';

import { cn } from '@/shared/lib/cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 border border-input bg-card/40 px-3 py-1 text-sm',
        'font-mono tracking-wide text-foreground',
        'transition-[color,box-shadow,border-color] outline-none',
        'selection:bg-primary/30 selection:text-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'placeholder:text-muted-foreground placeholder:tracking-wide',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary focus-visible:bg-card focus-visible:shadow-[0_0_0_1px_rgba(0,255,200,0.45),0_0_14px_rgba(0,255,200,0.18)]',
        'aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_rgba(255,56,100,0.45)]',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
