// components/profile/ResumeSnapshot.tsx
'use client';

import { useState } from 'react';
import { FileText, ChevronDown, CheckCircle2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackedSkill } from '@/types/active-job';

interface ResumeSnapshotProps {
  analysisId: string;
  existingSkills: string[];       // from original resume
  trackedSkills:  TrackedSkill[]; // from active job
}

export function ResumeSnapshot({
  analysisId,
  existingSkills,
  trackedSkills,
}: ResumeSnapshotProps) {
  const [expanded, setExpanded] = useState(true);
  const gained = trackedSkills.filter(s => s.state === 'learned');
  const inProgress = trackedSkills.filter(s => s.state === 'in_progress');

  return (
    <div className="rounded-[32px] border border-hairline bg-surface-card overflow-hidden shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-8 py-6 hover:bg-surface-soft/30 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <FileText size={18} />
          </div>
          <div>
            <span className="font-display text-title-sm text-ink block">Evolution Profile</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                {existingSkills.length} base units
              </span>
              <div className="w-1 h-1 rounded-full bg-hairline" />
              <span className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">
                {gained.length} upgrades gained
              </span>
            </div>
          </div>
        </div>
        <motion.div 
          animate={{ rotate: expanded ? 180 : 0 }} 
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
          className="w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center text-muted"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-hairline border-t border-hairline">
              {/* Original skills */}
              <div className="bg-surface-card px-8 py-7">
                <div className="flex items-center gap-2 mb-5">
                   <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                   <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                    Original Core
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {existingSkills.map(skill => (
                    <div key={skill} className="flex items-center gap-3 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-ink/10 group-hover:bg-ink transition-colors shrink-0" />
                      <span className="font-sans text-body-sm text-muted group-hover:text-ink transition-colors">{skill}</span>
                    </div>
                  ))}
                  {existingSkills.length === 0 && (
                    <p className="font-sans text-body-sm text-muted/50 italic">
                      No baseline data available
                    </p>
                  )}
                </div>
              </div>

              {/* Gained skills */}
              <div className="bg-surface-card px-8 py-7 border-l border-hairline">
                <div className="flex items-center gap-2 mb-5">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                   <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal">
                    Targeted Expansion
                  </p>
                </div>
                <div className="space-y-4">
                  {gained.length > 0 && (
                    <div className="space-y-2.5">
                      {gained.map(s => (
                        <div key={s.skill} className="flex items-center gap-3 bg-brand-teal/5 border border-brand-teal/10 px-3 py-2 rounded-xl">
                          <CheckCircle2 size={14} className="text-brand-teal shrink-0" />
                          <span className="font-sans text-body-sm text-ink font-semibold flex-1">{s.skill}</span>
                          <span className="font-mono text-[9px] text-brand-teal font-bold uppercase tracking-widest">
                            Mastered
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {inProgress.length > 0 && (
                    <div className="space-y-2.5">
                      {inProgress.map(s => (
                        <div key={s.skill} className="flex items-center gap-3 bg-surface-soft border border-hairline px-3 py-2 rounded-xl">
                          <Zap size={14} className="text-primary shrink-0" />
                          <span className="font-sans text-body-sm text-muted flex-1">{s.skill}</span>
                          <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-widest">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {gained.length === 0 && inProgress.length === 0 && (
                    <div className="py-8 text-center rounded-2xl border border-dashed border-hairline bg-surface-soft/30">
                      <p className="font-sans text-body-sm text-muted italic">
                        Initialize learning to see growth
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
