'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressiveBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'top' | 'bottom' | 'left' | 'right';
  blurLayers?: number;
  maxBlur?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  maxBlur = 24,
  className,
  children,
  ...props
}: ProgressiveBlurProps) {
  const layers = Array.from({ length: blurLayers });

  return (
    <div className={cn('relative', className)} {...props}>
      {children}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {layers.map((_, i) => {
          const step = (i + 1) / blurLayers;
          const blurAmount = step * maxBlur;

          const stop1 = Math.max(0, (i / blurLayers) * 100 - 10);
          const stop2 = Math.min(100, ((i + 1) / blurLayers) * 100 + 10);

          let maskGradient = '';
          if (direction === 'bottom') {
            maskGradient = `linear-gradient(to bottom, transparent ${stop1}%, black ${stop2}%)`;
          } else if (direction === 'top') {
            maskGradient = `linear-gradient(to top, transparent ${stop1}%, black ${stop2}%)`;
          } else if (direction === 'left') {
            maskGradient = `linear-gradient(to left, transparent ${stop1}%, black ${stop2}%)`;
          } else if (direction === 'right') {
            maskGradient = `linear-gradient(to right, transparent ${stop1}%, black ${stop2}%)`;
          }

          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blurAmount.toFixed(1)}px)`,
                WebkitBackdropFilter: `blur(${blurAmount.toFixed(1)}px)`,
                maskImage: maskGradient,
                WebkitMaskImage: maskGradient,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
