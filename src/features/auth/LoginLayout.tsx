import type { ReactNode } from 'react';

/** Two-pane auth chrome: brand panel + centred content area. Each form supplies its own <form>. */
export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-full">
      <div className="hidden w-72 flex-col items-start justify-end gap-3 border-r border-border bg-card p-10 cyber-grid lg:flex">
        <div className="cyber-label-bright cyber-glow">// ONEFLEET</div>
        <span className="text-2xl font-bold tracking-[0.18em] uppercase text-primary cyber-glow">
          Mission
          <br />
          Control.
        </span>
        <div className="cyber-label mt-4">
          v6 · Live tracking
          <br />
          247 units · 3 sectors
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background p-row">{children}</div>
    </main>
  );
}
