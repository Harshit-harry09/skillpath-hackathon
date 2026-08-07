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
        lerp: 0.08,          // lower = silkier trail (0.1 is default, 0.05 is dreamy)
        duration: 1.4,       // how long the scroll animation lasts
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 1.5, // makes mobile swipe feel more responsive
        infinite: false,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        wheelMultiplier: 0.9, // slightly dampened wheel = feels premium not sluggish
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out — fast start, graceful stop
      }}
    >
      {children}
    </ReactLenis>
  );
}