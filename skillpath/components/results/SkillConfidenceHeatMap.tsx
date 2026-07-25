'use client';

import React from 'react';
import { Thermometer } from 'lucide-react';
import type { ConfidenceLevel } from '@/types/analysis';

type Level = ConfidenceLevel;

const LEVELS: { key: Level; label: string; bg: string; border: string; text: string }[] = [
  { key: 'never_used',  label: 'Never Used',  bg: 'bg-surface-soft',       border: 'border-hairline',          text: 'text-muted'       },
  { key: 'heard_of_it', label: 'Heard of It', bg: 'bg-brand-ochre/10',     border: 'border-brand-ochre/30',    text: 'text-brand-ochre' },
  { key: 'used_it',     label: 'Used It',     bg: 'bg-brand-teal/10',      border: 'border-brand-teal/30',     text: 'text-brand-teal'  },
  { key: 'comfortable', label: 'Confident',   bg: 'bg-primary/10',         border: 'border-primary/30',        text: 'text-primary'     },
  { key: 'strong',      label: 'Expert',      bg: 'bg-brand-pink/10',      border: 'border-brand-pink/30',     text: 'text-brand-pink'  },
];

const CYCLE_ORDER: Level[] = ['never_used', 'heard_of_it', 'used_it', 'comfortable', 'strong'];

const LEVEL_LABELS: Record<Level, string> = {
  never_used: 'Never Used',
  heard_of_it: 'Heard of It',
  used_it: 'Used It',
  comfortable: 'Confident',
  strong: 'Expert',
};

interface SkillConfidenceHeatMapProps {
  mvcSkills: string[];
  gapSkills: string[];
  assessments?: Record<string, ConfidenceLevel>;
  onConfidenceChange?: (skill: string, level: ConfidenceLevel) => void;
}

export function SkillConfidenceHeatMap({
  mvcSkills,
  gapSkills,
  assessments = {},
  onConfidenceChange,
}: SkillConfidenceHeatMapProps) {
  const allSkills = Array.from(new Set([...mvcSkills, ...gapSkills])).slice(0, 24);

  const toggle = (skill: string) => {
    const cur = assessments[skill] || 'never_used';
    const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(cur) + 1) % CYCLE_ORDER.length];
    if (onConfidenceChange) {
      onConfidenceChange(skill, next);
    }
  };

  const getLevelStyle = (skill: string) => {
    const curLevel = assessments[skill] || 'never_used';
    const l = LEVELS.find(x => x.key === curLevel) ?? LEVELS[0];
    return `${l.bg} ${l.border} ${l.text}`;
  };

  const counts = LEVELS.map(l => ({
    ...l,
    count: allSkills.filter(s => (assessments[s] || 'never_used') === l.key).length,
  }));

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary"><Thermometer size={18} /></span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Skill Confidence Heat Map</span>
          </div>
          <span className="text-[11px] text-muted font-medium">Click skill to cycle level</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {counts.map(l => (
            <span key={l.key} className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${l.bg} ${l.border} ${l.text}`}>
              {l.label} {l.count > 0 && <span className="opacity-70">({l.count})</span>}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-wrap gap-2">
          {allSkills.map(skill => {
            const lvl = assessments[skill] || 'never_used';
            return (
              <button
                key={skill}
                onClick={() => toggle(skill)}
                className={`px-3 py-2 rounded-xl border text-body-xs font-semibold transition-all hover:scale-105 active:scale-95 ${getLevelStyle(skill)}`}
              >
                {skill}
                {lvl !== 'never_used' && (
                  <span className="ml-1.5 text-[10px] opacity-80 uppercase font-bold">
                    ({LEVEL_LABELS[lvl]})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-muted mt-4">
        Interactive state sync: Marking skills as <strong className="text-primary font-bold">Confident</strong> or <strong className="text-brand-pink font-bold">Expert</strong> instantly recalculates your Readiness Score, Salary ROI & Benchmark rank across all tabs.
      </p>
    </div>
  );
}
