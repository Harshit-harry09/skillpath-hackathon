'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle2, Share2, Sparkles, TrendingDown, ChevronRight } from 'lucide-react';
import type { FreshnessResult } from '@/lib/skill-expiry';

interface FreshnessScoreCardProps {
  data: FreshnessResult;
}

export function FreshnessScoreCard({ data }: FreshnessScoreCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `My resume freshness score is ${data.score}/100! 📅\n${data.verdict}\n\nCheck yours at SkillPath.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-surface-card border border-hairline rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header Section */}
      <div className="p-6 md:p-8 border-b border-hairline bg-surface-soft/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0">
              <Calendar className="text-amber-800 dark:text-amber-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-base text-ink font-bold uppercase tracking-wider flex items-center gap-2">
                Resume Freshness
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[10px] font-bold">BETA</span>
              </h2>
              <p className="font-sans text-xs text-muted mt-0.5">
                {data.verdict}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-ink">
                {data.score}<span className="text-muted/60 text-sm">/100</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleShare}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-sans text-xs font-bold cursor-pointer ${
                copied 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
                  : 'bg-ink text-on-primary border-transparent hover:opacity-90 shadow-xs'
              }`}
            >
              {copied ? 'Copied!' : <><Share2 size={16} /> Share</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Aging Skills Section */}
        {data.expiring_skills.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-rose-800 dark:text-rose-400" />
              <h3 className="font-display text-xs text-ink uppercase tracking-widest font-bold">
                Aging Skills (Consider updating)
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {data.expiring_skills.map((skill) => (
                <div key={skill.skill} className="group p-4 rounded-xl bg-surface-soft/40 border border-hairline hover:border-rose-300 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-sans text-xs font-bold text-ink">{skill.display}</span>
                      <TrendingDown size={14} className="text-rose-700 dark:text-rose-400" />
                      <span className="text-rose-800 dark:text-rose-400 font-bold text-xs">Dropped {skill.decline}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted text-xs font-sans">
                      <span>Was in {skill.peak_freq}% of JDs</span>
                      <ChevronRight size={12} />
                      <span className="text-ink font-bold">Now {skill.latest_freq}%</span>
                    </div>
                  </div>

                  {/* Visual Drop Bar */}
                  <div className="w-full h-2 bg-hairline rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: `${skill.peak_freq}%` }}
                      animate={{ width: `${skill.latest_freq}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-rose-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-[10px] font-bold uppercase">
                      Verdict: {skill.verdict}
                    </div>
                    {skill.replacement && (
                      <div className="flex items-center gap-2 text-xs font-sans text-muted">
                        <Sparkles size={14} className="text-brand-teal" />
                        Modern equivalent: <span className="text-ink font-bold">{skill.replacement}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center text-center">
             <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mb-3">
                <CheckCircle2 className="text-emerald-800 dark:text-emerald-400 w-7 h-7" />
             </div>
             <h3 className="font-display text-sm font-bold text-ink mb-1">Impeccable Tech Stack!</h3>
             <p className="font-sans text-xs text-muted max-w-sm leading-relaxed">
                Every skill on your resume is currently in high demand. Your tech stack is perfectly aligned with modern industry standards.
             </p>
          </div>
        )}

        {/* Strong Skills Section */}
        {data.stable_skills.length > 0 && (
          <div className="pt-6 border-t border-hairline">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-800 dark:text-emerald-400" />
              <h3 className="font-display text-xs text-ink uppercase tracking-widest font-bold">
                Stable & Rising Skills
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.stable_skills.map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-xl bg-surface-soft border border-hairline text-ink text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer / Tip */}
      <div className="p-3.5 bg-surface-soft/50 border-t border-hairline flex items-center justify-center gap-2 text-[11px] text-muted font-sans italic">
        <TrendingDown size={12} />
        Market data is refreshed monthly from aggregate job post trends.
      </div>
    </div>
  );
}
