import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  nativePostMessage,
  loginTokenListeners,
  notificationTokenListeners,
  nativeNotificationListeners,
  isNativeEnvironment,
} from '../native-interface';

const win = window as unknown as Record<string, unknown>;

afterEach(() => {
  vi.restoreAllMocks();
  delete win.appInterface;
  delete win.webkit;
  loginTokenListeners.clear();
  notificationTokenListeners.clear();
  nativeNotificationListeners.clear();
});

describe('native-interface', () => {
  it('registers the three window globals on import', () => {
    expect(typeof window.handleLoginToken).toBe('function');
    expect(typeof window.updateNotificationToken).toBe('function');
    expect(typeof window.handleNativeNotification).toBe('function');
  });

  it('window.handleLoginToken dispatches to every registered listener', () => {
    const seen: string[] = [];
    loginTokenListeners.add((token) => seen.push(token));
    window.handleLoginToken!('abc');
    expect(seen).toEqual(['abc']);
  });

  it('window.handleNativeNotification dispatches the message', () => {
    const seen: string[] = [];
    nativeNotificationListeners.add((message) => seen.push(message));
    window.handleNativeNotification!('hello');
    expect(seen).toEqual(['hello']);
  });

  it('isNativeEnvironment is false with no bridge present', () => {
    expect(isNativeEnvironment()).toBe(false);
  });

  it('isNativeEnvironment is true when window.appInterface exists', () => {
    win.appInterface = { postMessage: vi.fn() };
    expect(isNativeEnvironment()).toBe(true);
  });

  it('nativePostMessage routes to the Android appInterface', () => {
    const postMessage = vi.fn();
    win.appInterface = { postMessage };
    nativePostMessage('logout');
    expect(postMessage).toHaveBeenCalledWith('logout');
  });

  it('nativePostMessage routes to the iOS webkit handler when present', () => {
    const postMessage = vi.fn();
    win.webkit = {
      messageHandlers: { appInterface: { postMessage } },
    };
    nativePostMessage('server|https://x.test');
    expect(postMessage).toHaveBeenCalledWith('server|https://x.test');
  });

  it('nativePostMessage is a no-op outside a native environment', () => {
    expect(() => nativePostMessage('authentication')).not.toThrow();
  });
});
