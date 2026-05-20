import { useEffect } from 'react';
import { toast } from 'sonner';
import { Toaster } from './sonner';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';

/** Strips a leading Java exception class chain from a multi-line error message. */
function formatMessage(raw: string): string {
  const firstLine = raw.split('\n')[0] ?? raw;
  return firstLine.replace(/^(?:(?:[\w$]+\.)*[\w$]+(?:Exception|Error)?:\s*)+/i, '');
}

export function ErrorToaster() {
  const next = useErrorsStore((state) => state.errors[0]);
  const pop = useErrorsStore((state) => state.pop);

  useEffect(() => {
    if (next !== undefined) {
      toast.error(formatMessage(next));
      pop();
    }
  }, [next, pop]);

  return <Toaster position="bottom-center" richColors />;
}
