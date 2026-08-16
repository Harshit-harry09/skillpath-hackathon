'use client';
// updated

import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';

export function SmoothScrolling({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,           // instant 0ms input response with organic deceleration
        smoothWheel: true,
        syncTouch: false,    // keep native 120Hz hardware momentum on trackpads/mobile
        touchMultiplier: 1.8,
        infinite: false,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        wheelMultiplier: 1.0,
        prevent: (node) => {
          if (!node || typeof (node as HTMLElement).closest !== 'function') return false;
          const el = node as HTMLElement;
          return (
            el.hasAttribute('data-lenis-prevent') ||
            Boolean(el.closest('[data-lenis-prevent]')) ||
            Boolean(el.closest('.overflow-y-auto')) ||
            Boolean(el.closest('.overflow-x-auto')) ||
            Boolean(el.closest('.overflow-auto')) ||
            Boolean(el.closest('textarea')) ||
            Boolean(el.closest('pre')) ||
            Boolean(el.closest('table')) ||
            Boolean(el.closest('[role="dialog"]'))
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}