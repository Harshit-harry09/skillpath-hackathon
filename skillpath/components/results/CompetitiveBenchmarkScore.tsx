'use client';
// updated

import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';

interface CompetitiveBenchmarkScoreProps {
  matchPct: number;
  freshnessScore?: number;
  gapCount: number;
  criticalCount: number;
}

const TIERS = [
  { label: 'Top 10%', threshold: 85, color: 'text-brand-teal', bg: 'bg-brand-teal/10', border: 'border-brand-teal/30' },
  { label: 'Top 25%', threshold: 65, color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/30'    },
  { label: 'Top 50%', threshold: 40, color: 'text-brand-ochre',bg: 'bg-brand-ochre/10',border: 'border-brand-ochre/30'},
  { label: 'Bottom',  threshold:  0, color: 'text-brand-pink', bg: 'bg-brand-pink/10', border: 'border-brand-pink/30' },
];

export function CompetitiveBenchmarkScore({
  matchPct, freshnessScore, gapCount, criticalCount,
}: CompetitiveBenchmarkScoreProps) {
  const score = useMemo(() => {
    const freshness = freshnessScore ?? 70;
    const gapPenalty = Math.min(criticalCount * 8, 30);
    return Math.max(0, Math.min(100, Math.round(matchPct * 0.5 + freshness * 0.3 - gapPenalty)));
  }, [matchPct, freshnessScore, criticalCount]);

  const tier = TIERS.find(t => score >= t.threshold) ?? TIERS[TIERS.length - 1];

  const pillars = [
    { label: 'Skill Match',      value: matchPct,        max: 100 },
    { label: 'Skill Freshness',  value: freshnessScore ?? 70, max: 100 },
    { label: 'Gap Risk',         value: Math.max(0, 100 - criticalCount * 15), max: 100 },
  ];

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary"><Trophy size={18} /></span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Competitive Benchmark Score</span>
          </div>
          <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${tier.bg} ${tier.border} ${tier.color}`}>
            {tier.label} of Candidates
          </span>
        </div>

        {/* Big Score */}
        <div className="flex items-center gap-6 mb-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shrink-0 ${tier.bg} ${tier.border}`}>
            <span className={`font-display text-3xl font-bold ${tier.color}`}>{score}</span>
          </div>
          <div>
            <p className="text-body-sm text-muted mb-1">Composite Candidate Score</p>
            <p className={`font-sans font-semibold text-body-md ${tier.color}`}>{tier.label} of applicants for this role</p>
          </div>
        </div>

        {/* Pillars */}
        <div className="space-y-3">
          {pillars.map(p => (
            <div key={p.label}>
              <div className="flex justify-between mb-1">
                <span className="text-body-xs text-muted font-semibold">{p.label}</span>
                <span className="text-body-xs font-bold text-ink">{p.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${p.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted mt-4">
        Benchmark relative to candidate pool requirements.
      </p>
    </div>
  );
}
