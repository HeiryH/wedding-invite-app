'use client';
import { useSyncExternalStore } from 'react';

export type WebGLCapability = 'webgl2' | 'webgl' | 'none';
let capability: WebGLCapability | undefined;
function snapshot(): WebGLCapability {
  if (capability) return capability;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    capability = context ? ('texImage3D' in context ? 'webgl2' : 'webgl') : 'none';
    // This is a capability probe; the scene creates and owns its own context.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    capability = 'none';
  }
  return capability;
}
const subscribe = () => () => {};
const serverSnapshot = (): WebGLCapability => 'webgl2';

export function useWebGLSupport(): WebGLCapability {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
