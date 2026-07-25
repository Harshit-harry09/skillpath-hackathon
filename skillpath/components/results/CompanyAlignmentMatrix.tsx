'use client';

import React, { useMemo } from 'react';
import { Building2, Rocket } from 'lucide-react';

interface CompanyAlignmentMatrixProps {
  resumeText: string;
}

export function CompanyAlignmentMatrix({ resumeText }: CompanyAlignmentMatrixProps) {
  const alignment = useMemo(() => {
    if (!resumeText) return { startupScore: 50, enterpriseScore: 50 };
    const text = resumeText.toLowerCase();

    const startupKeywords = ['fast-paced', 'mvp', 'prototype', 'startup', 'agile', 'scrum', 'full-stack', 'autonomy', 'iteration', 'lead', 'built'];
    const enterpriseKeywords = ['governance', 'compliance', 'security', 'microservices', 'ci/cd', 'kubernetes', 'architecture', 'scale', 'enterprise', 'system design', 'monitoring'];

    const startupHits = startupKeywords.filter(k => text.includes(k)).length;
    const enterpriseHits = enterpriseKeywords.filter(k => text.includes(k)).length;

    const total = Math.max(1, startupHits + enterpriseHits);
    const startupScore = Math.round((startupHits / total) * 100);
    const enterpriseScore = 100 - startupScore;

    return { startupScore, enterpriseScore };
  }, [resumeText]);

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
              <Building2 size={20} />
            </span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
              Company Culture Alignment Matrix
            </span>
          </div>
          <span className="text-body-xs font-semibold text-brand-teal">
            {alignment.startupScore > alignment.enterpriseScore ? 'Startup Leaning' : 'Enterprise Leaning'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-brand-pink">
                <Rocket size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Startup / Scale-up</span>
              </div>
              <span className="text-2xl font-display font-bold text-ink">{alignment.startupScore}%</span>
            </div>
            <p className="text-[11px] text-muted mt-2 font-sans">Emphasis on speed, prototyping & autonomy</p>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-brand-teal">
                <Building2 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Big Tech / Enterprise</span>
              </div>
              <span className="text-2xl font-display font-bold text-ink">{alignment.enterpriseScore}%</span>
            </div>
            <p className="text-[11px] text-muted mt-2 font-sans">Emphasis on scale, security & architecture</p>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-surface-soft overflow-hidden flex">
          <div className="bg-brand-pink transition-all duration-500" style={{ width: `${alignment.startupScore}%` }} />
          <div className="bg-brand-teal transition-all duration-500" style={{ width: `${alignment.enterpriseScore}%` }} />
        </div>
      </div>

      <p className="text-[10px] text-muted mt-4">
        Tailor your application strategy to align with your target organization size.
      </p>
    </div>
  );
}
