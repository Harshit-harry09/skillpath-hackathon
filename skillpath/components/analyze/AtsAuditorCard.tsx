'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';

interface AtsAuditorCardProps {
  resumeText: string;
}

export function AtsAuditorCard({ resumeText }: AtsAuditorCardProps) {
  const audit = useMemo(() => {
    if (!resumeText) return null;
    const text = resumeText.toLowerCase();

    // 1. Action Verbs Check
    const actionVerbs = [
      'spearheaded', 'architected', 'engineered', 'implemented', 'optimized',
      'developed', 'designed', 'automated', 'orchestrated', 'scaled',
      'deployed', 'refactored', 'built', 'reduced', 'increased', 'led'
    ];
    const foundVerbs = actionVerbs.filter(verb => text.includes(verb));
    const verbScore = Math.min(100, Math.round((foundVerbs.length / 5) * 100));

    // 2. Metrics & Quantifiability Check (% or numbers)
    const metricsMatches = text.match(/\d+%/g) || text.match(/\$\d+/g) || [];
    const metricsScore = Math.min(100, metricsMatches.length * 25);

    // 3. Section Headers Check
    const hasExperience = text.includes('experience') || text.includes('history') || text.includes('employment');
    const hasEducation = text.includes('education') || text.includes('degree') || text.includes('university');
    const hasSkills = text.includes('skills') || text.includes('competencies') || text.includes('technologies');

    const headerScore = ((hasExperience ? 1 : 0) + (hasEducation ? 1 : 0) + (hasSkills ? 1 : 0)) / 3 * 100;

    // Overall ATS Readiness Score
    const overallScore = Math.round((verbScore * 0.4) + (metricsScore * 0.3) + (headerScore * 0.3));

    return {
      overallScore,
      foundVerbsCount: foundVerbs.length,
      metricsCount: metricsMatches.length,
      hasExperience,
      hasEducation,
      hasSkills,
    };
  }, [resumeText]);

  if (!audit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline relative overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileSearch size={20} />
          </span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
            ATS Compatibility Audit
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          audit.overallScore >= 75
            ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal'
            : 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
        }`}>
          {audit.overallScore >= 75 ? 'ATS Optimized' : 'Needs Optimization'}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold text-ink">{audit.overallScore}</span>
          <span className="text-muted font-sans text-body-sm">/ 100</span>
        </div>
        <div className="flex-1">
          <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                audit.overallScore >= 75 ? 'bg-brand-teal' : 'bg-brand-pink'
              }`}
              style={{ width: `${audit.overallScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
          <CheckCircle2 size={16} className={audit.foundVerbsCount >= 3 ? 'text-brand-teal' : 'text-muted'} />
          <div>
            <span className="text-[10px] text-muted font-bold block uppercase">Strong Verbs</span>
            <span className="text-body-xs font-semibold text-ink">{audit.foundVerbsCount} detected</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
          <CheckCircle2 size={16} className={audit.metricsCount >= 2 ? 'text-brand-teal' : 'text-muted'} />
          <div>
            <span className="text-[10px] text-muted font-bold block uppercase">Quantified Metrics</span>
            <span className="text-body-xs font-semibold text-ink">{audit.metricsCount} metrics</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
          <ShieldCheck size={16} className="text-brand-teal" />
          <div>
            <span className="text-[10px] text-muted font-bold block uppercase">Standard Sections</span>
            <span className="text-body-xs font-semibold text-ink">
              {audit.hasExperience && audit.hasEducation && audit.hasSkills ? 'Pass' : 'Warning'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
