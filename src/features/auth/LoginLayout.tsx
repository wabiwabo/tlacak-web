import type { ReactNode } from 'react';

/** Two-pane auth chrome: brand panel + centred content area. Each form supplies its own <form>. */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-full">
      <div className="hidden w-72 items-center justify-center bg-primary text-primary-foreground lg:flex">
        <span className="text-2xl font-semibold tracking-wide">Traccar</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-row">{children}</div>
    </main>
  );
}
