"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // In development, Next.js frequently changes chunk filenames during HMR.
    // Registering a SW that caches navigations/chunks can cause ChunkLoadError.
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered: ', registration);
        },
        (error) => {
          console.log('SW registration failed: ', error);
        }
      );
    }
  }, []);

  return null;
}