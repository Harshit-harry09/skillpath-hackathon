'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { CONFIDENCE_LEVELS } from '@/lib/confidence-reweighter';
import type { ConfidenceLevel } from '@/types/analysis';

interface ConfidenceStripProps {
  skill: string;
  value: ConfidenceLevel;
  onChange: (skill: string, level: ConfidenceLevel) => void;
  accentColor?: string;
}

/**
 * A 5-pill horizontal selector for self-assessing skill confidence.
 * Uses the neumorphic design language with tactile micro-interactions.
 */
export function ConfidenceStrip({ skill, value, onChange, accentColor }: ConfidenceStripProps) {
  const activeIdx = CONFIDENCE_LEVELS.findIndex(l => l.key === value);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-1.5">
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted shrink-0">
          Your level
        </span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {CONFIDENCE_LEVELS.map((level, idx) => {
          const isActive = level.key === value;
          const isStrong = level.key === 'strong';

          return (
            <motion.button
              key={level.key}
              onClick={() => onChange(skill, level.key)}
              whileTap={{ scale: 0.94 }}
              className={[
                'relative px-3 py-1.5 rounded-md font-sans text-[11px] font-semibold',
                'border transition-all duration-200 select-none',
                isActive
                  ? isStrong
                    ? 'bg-brand-teal text-on-primary border-brand-teal shadow-sm'
                    : 'bg-ink text-on-primary border-ink shadow-sm'
                  : 'bg-surface-soft text-muted border-hairline hover:border-muted/40 hover:text-ink',
              ].join(' ')}
              style={
                isActive && accentColor && !isStrong
                  ? { backgroundColor: accentColor, borderColor: accentColor }
                  : undefined
              }
            >
              {level.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
