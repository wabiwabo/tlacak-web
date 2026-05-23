import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Search } from 'lucide-react';
import { visibleNavItems } from './nav-items';
import { useSessionStore } from '@/entities/session';
import { useLiveStore } from '@/features/main/model/live-store';
import { useMapUiStore } from '@/features/main/model/map-ui-store';
import { useFilterStore } from '@/features/main/model/filter-store';
import { cn } from '@/shared/lib/cn';

function isActive(pathname: string, item: { id: string; path?: string }): boolean {
  if (item.id === 'map') {
    return pathname === '/';
  }
  return Boolean(item.path && pathname.startsWith(item.path.split('?')[0] ?? item.path));
}

export function TopBar({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);
  const events = useLiveStore((state) => state.events);
  const setEventsOpen = useMapUiStore((state) => state.setEventsOpen);
  const keyword = useFilterStore((state) => state.keyword);
  const setKeyword = useFilterStore((state) => state.setKeyword);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!user || !server) {
    return null;
  }

  const items = visibleNavItems(user, server);
  const initials =
    (user.name ?? user.email ?? '?')
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?';

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm cyber-grid print:hidden">
      {/* Brand */}
      <NavLink to="/" className="flex items-baseline gap-2 pe-4 border-e border-border me-2 self-stretch">
        <span className="cyber-label cyber-text-bright text-[10px]">//</span>
        <span className="text-sm font-bold tracking-[0.22em] uppercase text-primary cyber-glow">
          ONEFLEET
        </span>
        <span className="ml-1 cyber-blink text-primary text-xs" aria-hidden />
      </NavLink>

      {/* Primary nav */}
      <nav className="flex items-center gap-1">
        {items
          .filter((item) => item.id !== 'logout' && item.id !== 'account')
          .map((item) => {
            const to = item.path ?? '/';
            const active = isActive(pathname, item);
            return (
              <NavLink
                key={item.id}
                to={to}
                className={cn(
                  'relative px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors',
                  active
                    ? 'text-primary cyber-glow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(item.labelKey)}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-px bg-primary cyber-box-glow opacity-80" />
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Search */}
      <div className="ml-auto flex h-9 max-w-md flex-1 items-center gap-2 border border-border bg-background/60 px-3 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="flex-1 bg-transparent font-mono text-xs tracking-wide text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={t('sharedSearchDevices')}
          aria-label={t('sharedSearchDevices')}
        />
        <kbd className="font-mono text-[10px] text-muted-foreground tracking-wider border border-border px-1 py-px">⌘ K</kbd>
      </div>

      {/* Bell + alerts count */}
      <button
        type="button"
        onClick={() => setEventsOpen(true)}
        aria-label={t('reportEvents')}
        className="relative inline-flex h-9 w-9 items-center justify-center border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {events.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center border border-destructive bg-destructive/15 px-1 font-mono text-[9px] font-bold text-destructive cyber-glow-alert">
            {events.length > 99 ? '99+' : events.length}
          </span>
        )}
      </button>

      {/* User chip */}
      <button
        type="button"
        onClick={() => navigate(`/settings/user/${user.id}`)}
        className="inline-flex items-center gap-2 border border-border bg-background/60 px-2 py-1.5 text-left transition-colors hover:border-primary/60"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center bg-primary/15 border border-primary/40 font-mono text-[10px] font-bold text-primary cyber-glow">
          {initials}
        </span>
        <span className="hidden lg:flex flex-col leading-none">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground">
            {user.name ?? user.email ?? '?'}
          </span>
          <span className="cyber-label mt-0.5">
            {user.administrator ? 'ADMIN' : 'OPERATOR'}
          </span>
        </span>
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="cyber-label hover:text-destructive transition-colors px-2"
      >
        {t('loginLogout')}
      </button>

      {/* Live clock */}
      <div className="hidden xl:flex flex-col items-end leading-tight border-l border-border ps-4 ms-1 self-stretch justify-center">
        <span className="font-mono text-xs font-semibold text-foreground tracking-wider">
          {hh}:{mm}:<span className="text-primary cyber-glow">{ss}</span>
        </span>
        <span className="cyber-label mt-0.5">LIVE · WIB</span>
      </div>
    </header>
  );
}
