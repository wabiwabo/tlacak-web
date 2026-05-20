import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Loader } from '@/shared/ui/Loader';

function lazyRoute(loader: () => Promise<{ default: ComponentType }>): ReactElement {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

export const routes: RouteObject[] = [
  { path: '/', element: lazyRoute(() => import('@/pages/MainPage')) },
  { path: '/login', element: lazyRoute(() => import('@/pages/LoginPage')) },
  { path: '*', element: lazyRoute(() => import('@/pages/NotFoundPage')) },
];

export const router = createBrowserRouter(routes);
