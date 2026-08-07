'use client';

import React from 'react';
import AsciiFire from '@/components/ui/ascii-fire';

export function AsciiFireSection() {
  return (
    <div
      className="relative z-10 w-full -mt-44 sm:-mt-56 md:-mt-72 py-0 overflow-hidden select-none pointer-events-none"
      style={{
        background: 'transparent',
      }}
    >
      {/* Taller ASCII Flame layer extending behind the feature cards */}
      <div className="relative w-full h-[280px] sm:h-[340px] md:h-[420px]">
        <AsciiFire
          intensity={140}
          thickness={4}
          embers={true}
          sparks={true}
          charset="classic"
          turbulence={40}
          decay={9}
        />
        {/* Soft edge masking for seamless blend */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 80%, var(--color-surface-soft) 100%)',
          }}
        />
      </div>
    </div>
  );
}
