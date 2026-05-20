import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleNavItems } from './nav-items';
import { useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

function isActive(pathname: string, item: { id: string; path?: string }): boolean {
  if (item.id === 'map') {
    return pathname === '/';
  }
  return Boolean(item.path && pathname.startsWith(item.path.split('?')[0] ?? item.path));
}

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  if (!user || !server) {
    return null;
  }

  const items = visibleNavItems(user, server);

  return (
    <nav className="flex w-48 flex-col border-e border-border bg-muted/40 py-2 print:hidden">
      {items.map((item) => {
        const label = t(item.labelKey);
        const className = cn(
          'px-row py-2 text-start text-sm hover:bg-muted',
          isActive(pathname, item) && 'bg-muted font-medium text-primary',
        );
        if (item.id === 'logout') {
          return (
            <button key={item.id} type="button" className={className} onClick={onLogout}>
              {label}
            </button>
          );
        }
        const to = item.id === 'account' ? `/settings/user/${user.id}` : (item.path ?? '/');
        return (
          <NavLink key={item.id} to={to} className={className}>
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
