'use client';

import React from 'react';

// Children render immediately — individual sections handle their own entrance animations.
// Removing the global opacity gate was the primary LCP fix (5.9s → <1s).
export function AppWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
