'use client';
// updated

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  barClassName = 'bg-brand-teal'
}) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  const containerClass = className.includes('h-') ? className : `h-2 ${className}`;

  return (
    <div className={`relative w-full rounded-sm bg-surface-soft overflow-hidden border border-hairline ${containerClass}`}>
      {/* Main Bar */}
      <motion.div
        className={`relative h-full rounded-sm ${barClassName}`}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as any }}
      />
    </div>
  );
};
