'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, ChevronRight, Info, Star } from 'lucide-react';
import { ConfidenceStrip } from './ConfidenceStrip';
import type { SkillGap, ConfidenceLevel } from '@/types/analysis';

interface SelfAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gaps: SkillGap[];
  resumeSkills: string[];
  mvcSkills: string[];
  assessments: Record<string, ConfidenceLevel>;
  onConfidenceChange: (skill: string, level: ConfidenceLevel) => void;
  roleName: string;
}

export function SelfAssessmentModal({
  isOpen,
  onClose,
  gaps,
  resumeSkills,
  mvcSkills,
  assessments,
  onConfidenceChange,
  roleName
}: SelfAssessmentModalProps) {
  const [step, setStep] = useState(1); // 1: Welcome/Resume Skills, 2: Skill Gaps
  
  // Only ask about resume skills that are actually required for this role (matches)
  const requiredResumeSkills = resumeSkills.filter(skill => 
    mvcSkills?.some((mvc: string) => mvc.toLowerCase() === skill.toLowerCase())
  );

  const allSkills = [
    ...requiredResumeSkills.map(s => ({ skill: s, isGap: false })),
    ...gaps.map(g => ({ skill: g.skill, isGap: true }))
  ];

  const totalSkills = allSkills.length;
  const assessedCount = Object.keys(assessments).length;
  const progress = Math.round((assessedCount / totalSkills) * 100);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="self-assessment-title"
          data-lenis-prevent
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => {}} // Disable closing by clicking outside to force assessment
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-surface-card border border-hairline rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-hairline bg-surface-soft/50 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h2 id="self-assessment-title" className="font-display text-title-lg text-ink">Personalize Your Path</h2>
                    <p className="font-sans text-body-sm text-muted">
                      Self-assess your skills for the <span className="text-primary font-bold">{roleName}</span> role.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Progress</span>
                      <div className="w-32 h-1.5 bg-hairline rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                   </div>
                   <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-ink text-on-primary rounded-xl font-sans font-bold text-button hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-ink/20"
                   >
                     Calculate Score
                     <ChevronRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto min-h-0 p-8 overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent"
              data-lenis-prevent
            >
              <div className="space-y-12 pb-8">
                
                {/* Section 1: Verified Skills */}
                {requiredResumeSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 size={18} className="text-brand-teal" />
                      <h3 className="font-display text-title-md text-ink uppercase tracking-wider">
                        Matched Resume Skills ({requiredResumeSkills.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredResumeSkills.map((skill) => (
                        <div key={skill} className="p-5 rounded-2xl bg-surface-soft/30 border border-hairline/50 flex flex-col gap-4">
                          <span className="font-sans text-body-md font-bold text-ink">{skill}</span>
                          <ConfidenceStrip 
                            skill={skill}
                            value={assessments[skill] ?? 'strong'} 
                            onChange={onConfidenceChange}
                            accentColor="var(--color-brand-teal)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Identified Gaps */}
                {gaps.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Info size={18} className="text-primary" />
                      <h3 className="font-display text-title-md text-ink uppercase tracking-wider">
                        Required Gaps ({gaps.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gaps.map((gap) => (
                        <div key={gap.skill} className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-body-md font-bold text-ink">{gap.skill}</span>
                            {gap.in_mvc && <Star size={12} className="text-primary fill-primary/20" />}
                          </div>
                          <ConfidenceStrip 
                            skill={gap.skill}
                            value={assessments[gap.skill] ?? 'never_used'} 
                            onChange={onConfidenceChange}
                            accentColor="var(--color-primary)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer Tip */}
            <div className="p-6 bg-surface-soft border-t border-hairline flex items-center justify-center gap-3 text-muted text-caption italic">
              <Sparkles size={14} className="text-primary/40" />
              Your readiness score and learning plan priority will be updated instantly based on your choices.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
