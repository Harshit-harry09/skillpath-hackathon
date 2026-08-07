// updated
// components/ReadinessRing.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface ReadinessRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ReadinessRing({
  score,
  size = 96,
  strokeWidth = 6,
  color = 'var(--color-brand-teal)',
}: ReadinessRingProps) {
  const r          = (size - strokeWidth) / 2;
  const circ       = 2 * Math.PI * r;
  const motionVal  = useMotionValue(0);
  const dashOffset = useTransform(motionVal, v => circ - (v / 100) * circ);
  
  // Robust state for text display to ensure it counts up smoothly
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate both the ring and the numeric label
    const controls = animate(motionVal, score, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as any,
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return () => controls.stop();
  }, [score, motionVal]); // Critical: Maintain constant array size

  return (
    <div className="relative aspect-square" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-strong"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {/* Numeric label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold text-ink leading-none"
          style={{ fontSize: size * 0.22 }}
        >
          {displayValue}
        </span>
        <span
          className="text-muted font-sans font-bold uppercase tracking-widest"
          style={{ fontSize: size * 0.09 }}
        >
          %
        </span>
      </div>
    </div>
  );
}
