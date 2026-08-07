'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, UserCheck, Briefcase, ChevronRight } from 'lucide-react';

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
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
          <Award className="h-3 w-3" />
          Seniority-Aware Rubric Calibration
        </span>
        <span className="text-xs font-medium text-text-subtle">Feature #6</span>
      </div>

      <h3 className="text-base font-bold text-text-primary">
        Target Seniority Tier Calibration
      </h3>
      <p className="text-xs text-text-muted mt-0.5">
        Prevents applying Senior/Staff metric expectations to Junior applicants.
      </p>

      {/* Seniority Selector Pills */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {levels.map((lvl) => {
          const isSelected = activeLevel === lvl.id;
          return (
            <motion.button
              key={lvl.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lvl.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-border-subtle bg-surface-soft/60 hover:border-hairline'
              }`}
            >
              <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-text-primary'}`}>
                {lvl.label}
              </span>
              <span className="mt-1 text-[10px] text-text-muted leading-tight line-clamp-2">
                {lvl.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
