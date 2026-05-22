import type { ReactNode } from 'react';
import { useId } from 'react';
import { Label } from './label';

interface FieldProps {
  label: string;
  /** Receives the id to wire onto the control via `htmlFor`. */
  children: (id: string) => ReactNode;
  error?: string;
  /** Render the control inline with the label (used for checkboxes/switches). */
  inline?: boolean;
}

export function Field({ label, children, error, inline }: FieldProps) {
  const id = useId();
  if (inline) {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {children(id)}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
