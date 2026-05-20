import { Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '@/entities/session';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TermsGate } from './TermsGate';
import { NativeBridge, nativePostMessage } from '@/features/native-bridge';

export function AppShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const desktop = useMediaQuery('(min-width: 768px)');

  async function handleLogout() {
    await logout.mutateAsync();
    nativePostMessage('logout');
    navigate('/login');
  }

  return (
    <TermsGate>
      {/* SocketController / CachingController / UpdateController attach here in later plans. */}
      <NativeBridge />
      <div className="flex h-full flex-col md:flex-row">
        {desktop && <Sidebar onLogout={handleLogout} />}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
        {!desktop && <BottomNav onLogout={handleLogout} />}
      </div>
    </TermsGate>
  );
}
