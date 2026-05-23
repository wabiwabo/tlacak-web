import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full border border-input bg-card/40 px-3 py-2 text-sm',
        'font-mono tracking-wide text-foreground',
        'transition-[color,box-shadow,border-color] outline-none',
        'placeholder:text-muted-foreground placeholder:tracking-wide',
        'focus-visible:border-primary focus-visible:bg-card focus-visible:shadow-[0_0_0_1px_rgba(0,255,200,0.45),0_0_14px_rgba(0,255,200,0.18)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_rgba(255,56,100,0.45)]',
        className,
      )}
      {...props}
    />
  );
}
