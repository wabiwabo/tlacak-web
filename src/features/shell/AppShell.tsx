import { Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '@/entities/session';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { TermsGate } from './TermsGate';
import { NativeBridge, nativePostMessage } from '@/features/native-bridge';
import { SocketController, CachingController, MotionController } from '@/features/live';

export function AppShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const desktop = useMediaQuery('(min-width: 768px)');

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } catch {
      // Server-side session invalidation is best-effort; log out locally regardless.
    }
    nativePostMessage('logout');
    navigate('/login');
  }

  return (
    <TermsGate>
      <SocketController />
      <CachingController />
      <MotionController />
      <NativeBridge />
      <div className="flex h-full flex-col bg-background">
        {desktop && <TopBar onLogout={handleLogout} />}
        <div className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </div>
        {!desktop && <BottomNav onLogout={handleLogout} />}
      </div>
    </TermsGate>
  );
}
