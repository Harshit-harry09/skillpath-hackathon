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
        {CONFIDENCE_LEVELS.map((level) => {
          const isActive = level.key === value;
          const isStrong = level.key === 'strong';
          const sanitizedSkill = skill.replace(/[^a-zA-Z0-9]/g, '_');

          return (
            <motion.button
              key={level.key}
              type="button"
              onClick={() => onChange(skill, level.key)}
              whileTap={{ scale: 0.95 }}
              className={[
                'relative px-3 py-1.5 rounded-md font-sans text-[11px] font-semibold',
                'border transition-colors duration-150 select-none cursor-pointer',
                isActive
                  ? 'text-on-primary border-transparent'
                  : 'bg-surface-soft text-muted border-hairline hover:border-muted/40 hover:text-ink',
              ].join(' ')}
            >
              {isActive && (
                <motion.div
                  layoutId={`confidence-pill-${sanitizedSkill}`}
                  className={`absolute inset-0 rounded-md ${
                    isStrong ? 'bg-brand-teal' : 'bg-ink'
                  }`}
                  style={
                    accentColor && !isStrong
                      ? { backgroundColor: accentColor }
                      : undefined
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{level.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
