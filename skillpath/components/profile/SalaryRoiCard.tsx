'use client';

import React from 'react';
import { DollarSign, TrendingUp, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import type { TrackedSkill } from '@/types/active-job';

export interface SalaryRoiCardProps {
  jobTitle: string;
  trackedSkills: TrackedSkill[];
  accentColor?: string;
}

export function SalaryRoiCard({ jobTitle, trackedSkills, accentColor = 'var(--color-brand-teal)' }: SalaryRoiCardProps) {
  // Estimate salary premiums based on skill characteristics if not explicitly stored
  const enrichedSkills = trackedSkills.map(s => {
    let estPremium = 12000;
    const lower = s.skill.toLowerCase();
    if (lower.includes('aws') || lower.includes('cloud') || lower.includes('kubernetes') || lower.includes('docker')) estPremium = 18000;
    if (lower.includes('react') || lower.includes('node') || lower.includes('python') || lower.includes('typescript')) estPremium = 14000;
    if (lower.includes('ai') || lower.includes('ml') || lower.includes('llm') || lower.includes('system design')) estPremium = 22000;

    return {
      ...s,
      premium: s.premium ?? estPremium,
    };
  });

  const totalPotential = enrichedSkills.reduce((acc, s) => acc + s.premium, 0);
  const unlockedValue = enrichedSkills
    .filter(s => s.state === 'learned')
    .reduce((acc, s) => acc + s.premium, 0);

  const remainingValue = totalPotential - unlockedValue;
  const pctUnlocked = totalPotential > 0 ? Math.round((unlockedValue / totalPotential) * 100) : 0;

  return (
    <div className="bg-surface-card border border-hairline rounded-[32px] p-8 space-y-6 shadow-sm overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
            <DollarSign size={20} />
          </div>
          <div>
            <h2 className="font-display text-title-md text-ink">Salary ROI Estimator</h2>
            <p className="font-sans text-body-sm text-muted">Estimated market value boost for {jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-mono text-sm font-bold">
          <TrendingUp size={16} />
          <span>+${Math.round(totalPotential / 1000)}k Total Potential</span>
        </div>
      </div>

      {/* Progress Bar & Value Counters */}
      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-baseline font-mono text-xs font-bold">
          <span className="text-brand-teal">Unlocked: +${(unlockedValue / 1000).toFixed(1)}k/yr ({pctUnlocked}%)</span>
          <span className="text-muted">Remaining Potential: +${(remainingValue / 1000).toFixed(1)}k/yr</span>
        </div>

        <div className="h-3 rounded-full bg-surface-soft overflow-hidden border border-hairline p-0.5">
          <div
            className="h-full rounded-full bg-brand-teal transition-all duration-700"
            style={{ width: `${pctUnlocked}%` }}
          />
        </div>
      </div>

      {/* High-Impact Value Breakdown */}
      <div className="space-y-3 relative z-10 pt-2 border-t border-hairline/40">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted block">
          Skill Value Breakdown
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {enrichedSkills.slice(0, 6).map(s => (
            <div
              key={s.skill}
              className={[
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-sans text-xs transition-colors',
                s.state === 'learned'
                  ? 'bg-brand-teal/5 border-brand-teal/20 text-ink font-semibold'
                  : 'bg-surface-soft/40 border-hairline text-muted',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 truncate">
                {s.state === 'learned' ? (
                  <CheckCircle2 size={14} className="text-brand-teal shrink-0" />
                ) : (
                  <Zap size={14} className="text-primary shrink-0 opacity-50" />
                )}
                <span className="truncate">{s.skill}</span>
              </div>
              <span className="font-mono font-bold text-brand-teal shrink-0 ml-2">
                +${Math.round(s.premium / 1000)}k/yr
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
