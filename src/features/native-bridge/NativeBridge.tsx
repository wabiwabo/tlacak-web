import { useEffect, useLayoutEffect, useRef } from 'react';
import { notificationTokenListeners } from './native-interface';
import { useSessionStore, useUpdateUser } from '@/entities/session';
import type { User } from '@/entities/session';

/** Headless component that syncs native push tokens onto the current user. */
export function NativeBridge() {
  const user = useSessionStore((state) => state.user);
  const updateUser = useUpdateUser();

  const userRef = useRef<User | null>(user);
  const mutateRef = useRef(updateUser.mutate);

  useLayoutEffect(() => {
    userRef.current = user;
    mutateRef.current = updateUser.mutate;
  });

  useEffect(() => {
    const listener = (token: string) => {
      const current = userRef.current;
      if (!current) {
        return;
      }
      window.localStorage.setItem('notificationToken', token);
      const existing = String(current.attributes.notificationTokens ?? '');
      const tokens = existing ? existing.split(',') : [];
      if (!tokens.includes(token)) {
        mutateRef.current({
          ...current,
          attributes: {
            ...current.attributes,
            notificationTokens: [...tokens.slice(-2), token].join(','),
          },
        });
      }
    };
    notificationTokenListeners.add(listener);
    return () => {
      notificationTokenListeners.delete(listener);
    };
  }, []);

  return null;
}
