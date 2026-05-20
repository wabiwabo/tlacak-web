import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleNavItems } from './nav-items';
import { useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

export function BottomNav({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  if (!user || !server) {
    return null;
  }

  const items = visibleNavItems(user, server);

  function handleSelect(id: string, path?: string) {
    if (id === 'logout') {
      onLogout();
    } else if (id === 'account') {
      navigate(`/settings/user/${user!.id}`);
    } else {
      navigate(path ?? '/');
    }
  }

  function isActive(id: string, path?: string): boolean {
    if (id === 'map') {
      return pathname === '/';
    }
    return Boolean(path && pathname.startsWith(path.split('?')[0] ?? path));
  }

  return (
    <nav className="flex border-t border-border bg-background print:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={isActive(item.id, item.path) ? 'page' : undefined}
          onClick={() => handleSelect(item.id, item.path)}
          className={cn(
            'flex-1 py-2 text-xs',
            isActive(item.id, item.path) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </nav>
  );
}
