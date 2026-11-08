'use client';

import { useCallback, useSyncExternalStore } from 'react';

const CHANGE = 'invite-storage-change';
function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener(CHANGE, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(CHANGE, notify);
  };
}

/** A string snapshot stays stable between storage changes and has an explicit SSR default. */
export function useStoredValue(key: string, serverValue: string | null = null) {
  const read = useCallback(() => localStorage.getItem(key), [key]);
  const server = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(subscribe, read, server);
}

export function storeValue(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(CHANGE));
}

const browserSnapshot = () => true;
const serverSnapshot = () => false;
const subscribeReady = () => () => {};
export function useBrowserReady() {
  return useSyncExternalStore(subscribeReady, browserSnapshot, serverSnapshot);
}
