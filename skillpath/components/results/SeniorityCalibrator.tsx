'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

export type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'staff' | 'executive';

interface SeniorityCalibratorProps {
  onLevelChange?: (level: SeniorityLevel) => void;
}

export function SeniorityCalibrator({ onLevelChange }: SeniorityCalibratorProps) {
  const [activeLevel, setActiveLevel] = useState<SeniorityLevel>('senior');

  const levels: Array<{ id: SeniorityLevel; label: string; desc: string }> = [
    { id: 'entry', label: 'Junior (0-2 yrs)', desc: 'Evaluates core syntax, project completion & execution speed.' },
    { id: 'mid', label: 'Mid-Level (2-5 yrs)', desc: 'Evaluates feature ownership, testing, and autonomy.' },
    { id: 'senior', label: 'Senior (5-8 yrs)', desc: 'Evaluates system design, mentorship, and metrics.' },
    { id: 'staff', label: 'Staff/Principal (8+ yrs)', desc: 'Evaluates multi-team architecture & strategic impact.' },
    { id: 'executive', label: 'Executive (Director+)', desc: 'Evaluates P&L, organizational design, and hiring scale.' },
  ];

  const handleSelect = (lvl: SeniorityLevel) => {
    setActiveLevel(lvl);
    if (onLevelChange) onLevelChange(lvl);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-300 dark:border-purple-800 bg-purple-100 dark:bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-900 dark:text-purple-300">
          <Award className="h-3.5 w-3.5" />
          Seniority-Aware Rubric Calibration
        </span>
        <span className="text-[11px] font-mono font-bold text-muted">Feature #6</span>
      </div>

      <h3 className="text-base font-bold text-ink">
        Target Seniority Tier Calibration
      </h3>
      <p className="text-xs text-muted mt-1 leading-relaxed">
        Prevents applying Senior/Staff metric expectations to Junior applicants.
      </p>

      {/* Seniority Selector Pills (2-column layout to prevent cramped text overlap) */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {levels.map((lvl) => {
          const isSelected = activeLevel === lvl.id;
          return (
            <motion.button
              key={lvl.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lvl.id)}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-600 bg-purple-100 dark:bg-purple-950/60 dark:border-purple-500 shadow-xs'
                  : 'border-hairline bg-surface-soft/60 hover:bg-surface-soft hover:border-purple-300'
              }`}
            >
              <span className={`text-xs font-bold ${isSelected ? 'text-purple-950 dark:text-purple-100' : 'text-ink'}`}>
                {lvl.label}
              </span>
              <span className={`mt-1 text-[11px] leading-tight ${isSelected ? 'text-purple-900 dark:text-purple-300 font-medium' : 'text-muted'}`}>
                {lvl.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
