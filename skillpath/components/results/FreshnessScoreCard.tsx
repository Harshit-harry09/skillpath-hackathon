'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle2, Share2, Sparkles, TrendingDown, ChevronRight } from 'lucide-react';
import type { FreshnessResult, ExpiredSkill } from '@/lib/skill-expiry';

interface FreshnessScoreCardProps {
  data: FreshnessResult;
}

export function FreshnessScoreCard({ data }: FreshnessScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `My resume freshness score is ${data.score}/100! 📅\n${data.verdict}\n\nCheck yours at SkillPath.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-surface-card border border-hairline rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header Section */}
      <div className="p-8 border-b border-hairline bg-surface-soft/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-ochre/10 flex items-center justify-center">
              <Calendar className="text-brand-ochre w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-title-md text-ink uppercase tracking-wider flex items-center gap-2">
                Resume Freshness
                <span className="px-2 py-0.5 rounded-full bg-brand-ochre/10 text-brand-ochre text-[10px] font-bold">BETA</span>
              </h2>
              <p className="font-sans text-body-sm text-muted">
                {data.verdict}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display text-title-lg text-ink">
                {data.score}<span className="text-muted/40 text-title-md">/100</span>
              </div>
            </div>
            <button 
              onClick={handleShare}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-sans text-button ${
                copied 
                  ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal' 
                  : 'bg-ink text-on-primary border-transparent hover:opacity-90'
              }`}
            >
              {copied ? 'Copied!' : <><Share2 size={18} /> Share</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-10">
        
        {/* Aging Skills Section */}
        {data.expiring_skills.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle size={18} className="text-brand-pink" />
              <h3 className="font-display text-nav-link text-ink uppercase tracking-widest">
                Aging Skills (Consider updating)
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {data.expiring_skills.map((skill) => (
                <div key={skill.skill} className="group p-5 rounded-2xl bg-surface-soft/20 border border-hairline/50 hover:border-brand-pink/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-body-md font-bold text-ink">{skill.display}</span>
                      <TrendingDown size={14} className="text-brand-pink" />
                      <span className="text-brand-pink font-bold text-[12px]">Dropped {skill.decline}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted text-[11px] font-sans">
                      <span>Was in {skill.peak_freq}% of JDs</span>
                      <ChevronRight size={10} />
                      <span className="text-ink font-bold">Now {skill.latest_freq}%</span>
                    </div>
                  </div>

                  {/* Visual Drop Bar */}
                  <div className="w-full h-2 bg-hairline rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: `${skill.peak_freq}%` }}
                      animate={{ width: `${skill.latest_freq}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-brand-pink"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-pink/5 border border-brand-pink/10 text-brand-pink text-[11px] font-bold uppercase">
                      Verdict: {skill.verdict}
                    </div>
                    {skill.replacement && (
                      <div className="flex items-center gap-2 text-[11px] font-sans text-muted">
                        <Sparkles size={12} className="text-brand-teal" />
                        Modern equivalent: <span className="text-ink font-bold">{skill.replacement}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-brand-teal w-8 h-8" />
             </div>
             <h3 className="font-display text-title-sm text-ink mb-2">Impeccable Tech Stack!</h3>
             <p className="font-sans text-body-sm text-muted max-w-sm">
                Every skill on your resume is currently in high demand. Your tech stack is perfectly aligned with modern industry standards.
             </p>
          </div>
        )}

        {/* Strong Skills Section */}
        {data.stable_skills.length > 0 && (
          <div className="pt-8 border-t border-hairline">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-brand-teal" />
              <h3 className="font-display text-nav-link text-ink uppercase tracking-widest">
                Stable & Rising Skills
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.stable_skills.map((skill) => (
                <span key={skill} className="px-3 py-1.5 rounded-full bg-surface-soft border border-hairline text-ink text-[12px] font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer / Tip */}
      <div className="p-4 bg-surface-soft/50 border-t border-hairline flex items-center justify-center gap-2 text-[10px] text-muted font-sans italic">
        <TrendingDown size={12} />
        Market data is refreshed monthly from aggregate job post trends.
      </div>
    </div>
  );
}
