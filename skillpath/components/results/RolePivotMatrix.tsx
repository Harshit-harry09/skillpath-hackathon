'use client';

import React, { useMemo } from 'react';
import { GitCompare, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface RolePivotMatrixProps {
  resumeSkills: string[];
  currentRoleLabel: string;
}

const ADJACENT_PIVOTS: Record<string, Array<{ role: string; mvc: string[]; salaryDelta: number }>> = {
  'software-engineer': [
    { role: 'Backend Engineer', mvc: ['SQL', 'Node.js', 'PostgreSQL', 'Redis'], salaryDelta: 12000 },
    { role: 'Data Engineer', mvc: ['SQL', 'Python', 'Apache Spark', 'Snowflake'], salaryDelta: 24000 },
    { role: 'Cloud Architect / DevOps', mvc: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], salaryDelta: 28000 },
  ],
  'frontend-developer': [
    { role: 'Fullstack Engineer', mvc: ['Node.js', 'PostgreSQL', 'Express', 'REST API'], salaryDelta: 18000 },
    { role: 'UI/UX Engineer', mvc: ['Figma', 'Design Systems', 'Tailwind', 'Accessibility'], salaryDelta: 10000 },
  ],
};

export function RolePivotMatrix({ resumeSkills, currentRoleLabel }: RolePivotMatrixProps) {
  const pivots = useMemo(() => {
    const defaultPivots = ADJACENT_PIVOTS['software-engineer'];
    const skillsLower = new Set(resumeSkills.map(s => s.toLowerCase()));

    return defaultPivots.map(p => {
      const matched = p.mvc.filter(skill => skillsLower.has(skill.toLowerCase()));
      const overlapPct = Math.round((matched.length / p.mvc.length) * 100);
      return {
        ...p,
        matchedCount: matched.length,
        overlapPct,
      };
    });
  }, [resumeSkills]);

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
            <GitCompare size={20} />
          </span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
            Role Pivot Matrix & Skill Overlap
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-bold uppercase tracking-wider">
          Adjacent Paths
        </span>
      </div>

      <div className="space-y-4">
        {pivots.map((p) => (
          <div key={p.role} className="p-5 rounded-xl bg-canvas border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-sans font-semibold text-body-md text-ink">{p.role}</span>
                <span className="text-[11px] font-bold text-brand-teal">+{p.overlapPct}% skill overlap</span>
              </div>
              <p className="text-body-xs text-muted">
                Requires: <span className="text-ink font-medium">{p.mvc.join(', ')}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-body-xs font-bold">
                +${p.salaryDelta.toLocaleString()}/yr
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
