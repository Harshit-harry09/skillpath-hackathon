'use client';

import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimeToReadyEstimatorProps {
  gapCount: number;
  criticalCount: number;
}

const SCENARIOS = [
  { weeks: 4,  label: '4-Week Sprint',   color: 'text-brand-pink',  bg: 'bg-brand-pink/10',  border: 'border-brand-pink/20'  },
  { weeks: 8,  label: '8-Week Steady',   color: 'text-brand-ochre', bg: 'bg-brand-ochre/10', border: 'border-brand-ochre/20' },
  { weeks: 12, label: '12-Week Deep',    color: 'text-brand-teal',  bg: 'bg-brand-teal/10',  border: 'border-brand-teal/20'  },
];

export function TimeToReadyEstimator({ gapCount, criticalCount }: TimeToReadyEstimatorProps) {
  const hoursPerSkill = 8 + criticalCount * 2;
  const totalHours = Math.max(1, gapCount * hoursPerSkill);

  const scenarios = useMemo(() => SCENARIOS.map(s => ({
    ...s,
    hrsPerWeek: Math.ceil(totalHours / s.weeks),
  })), [totalHours]);

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal"><Clock size={18} /></span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Time-to-Ready Estimator</span>
        </div>

        <p className="text-body-sm text-muted mb-6">
          Based on <strong className="text-ink">{gapCount} skill gaps</strong> ({criticalCount} critical),
          you need approximately <strong className="text-ink">{totalHours} focused hours</strong> of study.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {scenarios.map(s => (
            <div key={s.weeks} className={`p-4 rounded-xl border ${s.bg} ${s.border} text-center flex flex-col justify-center`}>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.hrsPerWeek}h</p>
              <p className={`text-[10px] font-bold ${s.color} uppercase tracking-wider`}>/ week</p>
              <p className="text-body-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted mt-4 text-center">
        Estimate based on ~{hoursPerSkill}h per skill gap. Adjust based on your prior exposure.
      </p>
    </div>
  );
}
