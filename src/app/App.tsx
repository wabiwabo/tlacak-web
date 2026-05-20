import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { ServerGate } from '@/features/auth/ServerGate';

export default function App() {
  return (
    <AppProviders>
      <ServerGate>
        <RouterProvider router={router} />
      </ServerGate>
    </AppProviders>
  );
}
