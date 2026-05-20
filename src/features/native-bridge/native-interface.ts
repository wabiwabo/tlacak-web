import { createSessionToken } from '@/entities/session';

type TokenListener = (token: string) => void;
type MessageListener = (message: string) => void;

interface AppInterface {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    appInterface?: AppInterface;
    webkit?: { messageHandlers?: { appInterface?: AppInterface } };
    handleLoginToken?: (token: string) => void;
    updateNotificationToken?: (token: string) => void;
    handleNativeNotification?: (message: string) => void;
  }
}

/** Listeners notified when the native app delivers a login token. */
export const loginTokenListeners = new Set<TokenListener>();
/** Listeners notified when the native app delivers a push-notification token. */
export const notificationTokenListeners = new Set<TokenListener>();
/** Listeners notified when the native app forwards a notification payload. */
export const nativeNotificationListeners = new Set<MessageListener>();

window.handleLoginToken = (token: string) => {
  loginTokenListeners.forEach((listener) => listener(token));
};
window.updateNotificationToken = (token: string) => {
  notificationTokenListeners.forEach((listener) => listener(token));
};
window.handleNativeNotification = (message: string) => {
  nativeNotificationListeners.forEach((listener) => listener(message));
};

/** Resolves the active native bridge handle, iOS (webkit) first then Android. */
function nativeHandle(): AppInterface | undefined {
  return window.webkit?.messageHandlers?.appInterface ?? window.appInterface;
}

/** True when running inside the iOS/Android wrapper app. */
export function isNativeEnvironment(): boolean {
  return nativeHandle() !== undefined;
}

/** Posts a protocol message to the native app; no-op in a plain browser. */
export function nativePostMessage(message: string): void {
  nativeHandle()?.postMessage(message);
}

/**
 * Mints a 6-month login token and hands it to the native app as `login|<token>`.
 * Sends `login|` (empty) on failure, matching the legacy contract.
 */
export async function generateLoginToken(): Promise<void> {
  if (!isNativeEnvironment()) {
    return;
  }
  let token = '';
  try {
    const expiration = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    token = await createSessionToken(expiration);
  } catch {
    // token stays '' on failure — matches legacy contract
  }
  nativePostMessage(`login|${token}`);
}
