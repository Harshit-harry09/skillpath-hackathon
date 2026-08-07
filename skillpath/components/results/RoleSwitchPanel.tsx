'use client';
// updated

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, ChevronDown, ChevronUp, Check, Zap, Clock } from 'lucide-react';
import { compareToSimilarRoles } from '@/lib/role-matcher';
import type { RoleMatch } from '@/lib/role-matcher';

interface RoleSwitchPanelProps {
  resumeSkills: string[];
  resumeText: string;
  currentRoleSlug: string;
  currentRoleLabel: string;
}

export function RoleSwitchPanel({
  resumeSkills,
  currentRoleSlug,
  currentRoleLabel,
}: RoleSwitchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const comparisons = useMemo(() => {
    if (!resumeSkills.length || !currentRoleSlug) return [];
    return compareToSimilarRoles(resumeSkills, currentRoleSlug);
  }, [resumeSkills, currentRoleSlug]);

  if (comparisons.length <= 1) return null;

  return (
    <div className="rounded-3xl border border-hairline bg-surface-card shadow-sm overflow-hidden group relative">
      {/* Background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-lavender/5 rounded-full blur-3xl group-hover:bg-brand-lavender/10 transition-colors" />

      <div className={`px-5 md:px-8 pt-6 md:pt-8 flex items-center justify-between relative z-20 ${isExpanded ? 'pb-4 md:pb-6' : 'pb-6 md:pb-8'}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 group/info relative shrink-0">
            <ArrowRightLeft size={16} className="text-muted cursor-help" />
            <h3 className="font-display text-[11px] text-ink font-bold uppercase tracking-widest">
              Market Adjacency
            </h3>
            <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-ink text-on-primary text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl font-sans leading-tight">
              See how your current profile performs against other high-growth roles in the market.
            </div>
          </div>

          {!isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="px-2 py-0.5 rounded bg-brand-lavender/10 text-brand-lavender text-[9px] font-bold uppercase tracking-widest border border-brand-lavender/20">
                {comparisons.length - 1} Alternatives Mapped
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-surface-soft transition-colors text-muted hover:text-ink cursor-pointer flex items-center justify-center relative z-30"
          title={isExpanded ? "Minimize" : "Expand"}
          type="button"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="market-adjacency-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 md:px-8 pb-6 md:pb-8 space-y-4">
              {comparisons.map((role, i) => (
                <div
                  key={role.role_key}
                  className={[
                    'w-full px-4 md:px-5 py-3 md:py-4 rounded-2xl border transition-all duration-200',
                    role.is_current
                      ? 'bg-ink/[0.03] border-ink/10 ring-1 ring-ink/5'
                      : 'bg-surface-soft/40 border-hairline hover:bg-surface-soft hover:border-muted/30',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={[
                        'font-sans text-body-xs font-bold uppercase tracking-wide',
                        role.is_current ? 'text-ink' : 'text-muted',
                      ].join(' ')}>
                        {role.display_name}
                      </span>
                      {role.is_current && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-sm bg-ink text-on-primary text-[8px] font-bold uppercase tracking-widest">
                          Target
                        </span>
                      )}
                      {!role.is_current && role.easier_than_current && (
                        <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-brand-teal/10 text-brand-teal text-[8px] font-bold uppercase tracking-widest">
                          <Check size={8} strokeWidth={3} />
                          Stronger Match
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-ink tabular-nums">
                      {role.match_pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 rounded-full bg-surface-strong overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${role.match_pct}%` }}
                      transition={{ duration: 1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className={[
                        'h-full rounded-full',
                        role.is_current ? 'bg-ink' : 'bg-brand-teal',
                      ].join(' ')}
                    />
                  </div>

                  {/* Skills Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Zap size={10} className="text-brand-teal" />
                      <span className="font-sans text-[10px] text-muted font-medium">
                        <span className="text-ink font-bold">{role.matched_skills.length} out of {role.total_required}</span> matched
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={10} className="text-brand-pink" />
                      <span className="font-sans text-[10px] text-muted font-medium">
                        <span className="text-ink font-bold">{role.weeks_estimate}w</span> effort
                      </span>
                    </div>
                  </div>

                  {/* Missing Skills Tags (Compact) */}
                  {!role.is_current && role.missing_skills.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-hairline flex flex-wrap gap-1">
                      {role.missing_skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-1.5 py-0.5 rounded-sm bg-surface-soft border border-hairline text-[8px] text-muted font-bold uppercase tracking-wider">
                          +{skill}
                        </span>
                      ))}
                      {role.missing_skills.length > 3 && (
                        <span className="text-[8px] text-muted font-bold self-center ml-1">
                          +{role.missing_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
