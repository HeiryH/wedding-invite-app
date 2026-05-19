'use client';
import { useState, useEffect } from 'react';

export type WebGLCapability = 'webgl2' | 'webgl' | 'none';

export function useWebGLSupport(): WebGLCapability {
  const [capability, setCapability] = useState<WebGLCapability>('webgl2');

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      if (canvas.getContext('webgl2')) {
        setCapability('webgl2');
      } else if (canvas.getContext('webgl')) {
        setCapability('webgl');
      } else {
        setCapability('none');
      }
    } catch {
      setCapability('none');
    }
  }, []);

  return capability;
}
