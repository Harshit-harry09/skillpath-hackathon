'use client';

import React, { useMemo } from 'react';
import { Target } from 'lucide-react';

interface KeywordDensityCheckerProps {
  resumeText: string;
  mvcSkills: string[];
}

export function KeywordDensityChecker({ resumeText, mvcSkills }: KeywordDensityCheckerProps) {
  const results = useMemo(() => {
    const text = resumeText.toLowerCase();
    return mvcSkills.map(skill => {
      const re = new RegExp(`\\b${skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const count = (text.match(re) || []).length;
      return { skill, count, present: count > 0 };
    }).sort((a, b) => b.count - a.count);
  }, [resumeText, mvcSkills]);

  const present = results.filter(r => r.present).length;
  const pct = mvcSkills.length > 0 ? Math.round((present / mvcSkills.length) * 100) : 0;
  const maxCount = Math.max(...results.map(r => r.count), 1);

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary"><Target size={18} /></span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">JD Keyword Density Checker</span>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            pct >= 70 ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal'
            : pct >= 40 ? 'bg-brand-ochre/10 border-brand-ochre/20 text-brand-ochre'
                        : 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
          }`}>
            {pct}% Keyword Match
          </span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
          {results.map(r => (
            <div key={r.skill} className="flex items-center gap-3">
              <span className="w-28 text-body-xs font-semibold text-ink shrink-0 truncate">{r.skill}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-soft overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${r.present ? 'bg-brand-teal' : 'bg-hairline'}`}
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold w-6 text-right ${r.present ? 'text-brand-teal' : 'text-brand-pink'}`}>
                {r.count}×
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted mt-4">
        Keywords with <span className="text-brand-pink font-bold">0×</span> appear nowhere in your resume — add them to boost ATS pass rate.
      </p>
    </div>
  );
}
