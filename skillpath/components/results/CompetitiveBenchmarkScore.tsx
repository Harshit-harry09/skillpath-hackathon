'use client';

import React, { useMemo } from 'react';
import { Trophy, Info } from 'lucide-react';

interface CompetitiveBenchmarkScoreProps {
  matchPct: number;
  freshnessScore?: number;
  gapCount: number;
  criticalCount: number;
}

/**
 * Honest tier labels based on the user's own inputs — NOT compared against
 * any peer candidate pool (which we don't have). No fake percentile claims.
 */
const TIERS = [
  { label: 'Strong Profile',    threshold: 80, color: 'text-emerald-900 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' },
  { label: 'Solid Profile',     threshold: 60, color: 'text-blue-900 dark:text-blue-300',      bg: 'bg-blue-100 dark:bg-blue-950/40',      border: 'border-blue-300 dark:border-blue-800' },
  { label: 'Developing Profile',threshold: 40, color: 'text-amber-900 dark:text-amber-300',   bg: 'bg-amber-100 dark:bg-amber-950/40',   border: 'border-amber-300 dark:border-amber-800' },
  { label: 'Needs Work',        threshold:  0, color: 'text-rose-900 dark:text-rose-300',    bg: 'bg-rose-100 dark:bg-rose-950/40',    border: 'border-rose-300 dark:border-rose-800' },
];

export function CompetitiveBenchmarkScore({
  matchPct, freshnessScore, gapCount, criticalCount,
}: CompetitiveBenchmarkScoreProps) {
  const score = useMemo(() => {
    const freshness = freshnessScore ?? 70;
    const gapPenalty = Math.min(criticalCount * 8, 30);
    return Math.max(0, Math.min(100, Math.round(matchPct * 0.5 + freshness * 0.3 - gapPenalty)));
  }, [matchPct, freshnessScore, criticalCount]);

  const tier = TIERS.find((t) => score >= t.threshold) ?? TIERS[TIERS.length - 1];

  const pillars = [
    { label: 'Skill Match',     value: matchPct,                          max: 100 },
    { label: 'Skill Freshness', value: freshnessScore ?? 70,              max: 100 },
    { label: 'Gap Risk Score',  value: Math.max(0, 100 - criticalCount * 15), max: 100 },
  ];

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
              <Trophy size={18} />
            </span>
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Profile Strength Score
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${tier.bg} ${tier.border} ${tier.color}`}>
            {tier.label}
          </span>
        </div>

        {/* Big Score */}
        <div className="flex items-center gap-6 mb-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shrink-0 ${tier.bg} ${tier.border}`}>
            <span className={`font-display text-3xl font-bold ${tier.color}`}>{score}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted mb-1">Composite Profile Score</p>
            <p className={`font-sans font-bold text-sm ${tier.color}`}>{tier.label} for this role</p>
          </div>
        </div>

        {/* Pillars */}
        <div className="space-y-3.5">
          {pillars.map((p) => (
            <div key={p.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-muted font-semibold">{p.label}</span>
                <span className="text-xs font-bold text-ink">{p.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden">
                <div className="h-full bg-brand-teal transition-all duration-700" style={{ width: `${p.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest disclaimer */}
      <div className="mt-6 flex items-start gap-2 pt-4 border-t border-hairline">
        <Info size={14} className="text-muted mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted leading-relaxed">
          Score reflects your match quality, skill freshness, and critical gap count for this specific role — not a comparison against any external candidate pool.
        </p>
      </div>
    </div>
  );
}
