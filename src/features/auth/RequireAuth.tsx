import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionQuery, useSessionStore } from '@/entities/session';
import { useDocumentLoader } from '@/shared/lib/use-document-loader';

function AuthLoader() {
  useDocumentLoader();
  return null;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const { isPending, data: sessionData } = useSessionQuery();
  const user = useSessionStore((state) => state.user);
  const server = useSessionStore((state) => state.server);

  // isPending: query in flight. Also wait if the query resolved with a user but
  // the store effect hasn't fired yet (effects run after render).
  if (isPending || (sessionData != null && !user)) {
    return <AuthLoader />;
  }
  if (!user) {
    window.sessionStorage.setItem('postLogin', pathname + search);
    return <Navigate to={server?.newServer ? '/register' : '/login'} replace />;
  }
  return children;
}
