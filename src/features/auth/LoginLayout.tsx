import type { ReactNode } from 'react';

/** Two-pane auth chrome: brand panel + centred form card. */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-full">
      <div className="hidden w-72 items-center justify-center bg-primary text-primary-foreground lg:flex">
        <span className="text-2xl font-semibold tracking-wide">Traccar</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-row">
        <form className="flex w-full max-w-sm flex-col gap-4 p-6">{children}</form>
      </div>
    </main>
  );
}
