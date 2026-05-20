import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Loader } from '@/shared/ui';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { QueryParamGate } from '@/features/auth/QueryParamGate';
import { AppShell } from '@/features/shell';

function lazyRoute(loader: () => Promise<{ default: ComponentType }>): ReactElement {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

export const routes: RouteObject[] = [
  { path: '/login', element: lazyRoute(() => import('@/pages/LoginPage')) },
  { path: '/register', element: lazyRoute(() => import('@/pages/RegisterPage')) },
  { path: '/reset-password', element: lazyRoute(() => import('@/pages/ResetPasswordPage')) },
  { path: '/change-server', element: lazyRoute(() => import('@/pages/ChangeServerPage')) },
  {
    path: '/',
    element: (
      <QueryParamGate>
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      </QueryParamGate>
    ),
    children: [{ index: true, element: lazyRoute(() => import('@/pages/MainPage')) }],
  },
  { path: '*', element: lazyRoute(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
