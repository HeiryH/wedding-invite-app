import { act, cleanup, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test } from 'vitest';
import { storeValue, useBrowserReady, useStoredValue } from './useStoredValue';

afterEach(() => { cleanup(); localStorage.clear(); });
function Snapshot() { return <span>{String(useBrowserReady())}:{useStoredValue('flag', 'pending')}</span>; }
test('uses explicit server snapshots and reads existing browser storage', () => {
  localStorage.setItem('flag', 'existing');
  expect(renderToString(<Snapshot />)).toBe('<span>false<!-- -->:<!-- -->pending</span>');
  const hook = renderHook(() => [useBrowserReady(), useStoredValue('flag')]);
  expect(hook.result.current).toEqual([true, 'existing']);
  act(() => storeValue('flag', 'updated'));
  expect(hook.result.current).toEqual([true, 'updated']);
  act(() => { localStorage.setItem('flag', 'another-tab'); window.dispatchEvent(new StorageEvent('storage')); });
  expect(hook.result.current).toEqual([true, 'another-tab']);
});
