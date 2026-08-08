'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Target, Trophy, Sparkles, FileText, CheckCircle2, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TrackedSkill } from '@/types/active-job';

export interface ProfileBadgesProps {
  streakCount: number;
  skillsLearned: number;
  readinessScore: number;
  trackedSkills: TrackedSkill[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  isUnlocked: boolean;
  progressText: string;
}

export function ProfileBadges({ streakCount, skillsLearned, readinessScore, trackedSkills }: ProfileBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const hasNotes = trackedSkills.some(s => Boolean(s.note));
  const hasTarget = trackedSkills.length > 0;

  const badges: Badge[] = [
    {
      id: 'pathfinder',
      name: 'Market Pathfinder',
      description: 'Pin a target job role to launch your tailored career acceleration path.',
      icon: Target,
      color: 'text-primary bg-primary/10 border-primary/20',
      isUnlocked: hasTarget,
      progressText: hasTarget ? 'Target role locked' : 'Pin a target job to unlock',
    },
    {
      id: 'streak',
      name: 'Consistency Master',
      description: 'Maintain a 3+ day learning streak by completing daily units.',
      icon: Flame,
      color: 'text-brand-pink bg-brand-pink/10 border-brand-pink/20',
      isUnlocked: streakCount >= 3,
      progressText: `${streakCount} / 3 days streak`,
    },
    {
      id: 'crusher',
      name: 'Skill Crusher',
      description: 'Master at least 5 target skill requirements.',
      icon: Trophy,
      color: 'text-brand-teal bg-brand-teal/10 border-brand-teal/20',
      isUnlocked: skillsLearned >= 5,
      progressText: `${skillsLearned} / 5 skills mastered`,
    },
    {
      id: 'sniper',
      name: 'Target Sniper',
      description: 'Achieve a 75%+ Market Readiness score for your target role.',
      icon: Sparkles,
      color: 'text-brand-ochre bg-brand-ochre/10 border-brand-ochre/20',
      isUnlocked: readinessScore >= 75,
      progressText: `${readinessScore}% / 75% readiness`,
    },
    {
      id: 'architect',
      name: 'Reflective Architect',
      description: 'Document key learnings or reflections on at least 1 skill card.',
      icon: FileText,
      color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
      isUnlocked: hasNotes,
      progressText: hasNotes ? 'Reflection note saved' : 'Add a reflection note to unlock',
    },
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  return (
    <div className="bg-surface-card border border-hairline rounded-[32px] p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
            <Award size={20} />
          </div>
          <div>
            <h2 className="font-display text-title-md text-ink">Career Mastery Badges</h2>
            <p className="font-sans text-body-sm text-muted">Milestones earned along your journey</p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-surface-soft border border-hairline font-mono text-xs font-bold text-ink">
          {unlockedCount} / {badges.length} Unlocked
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {badges.map(badge => {
          const Icon = badge.icon;

          return (
            <motion.button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={[
                'flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden',
                badge.isUnlocked
                  ? `${badge.color} shadow-sm`
                  : 'bg-surface-soft/40 border-hairline opacity-50 grayscale hover:opacity-80 hover:grayscale-0',
              ].join(' ')}
            >
              {!badge.isUnlocked && (
                <div className="absolute top-2 right-2 text-muted">
                  <Lock size={12} />
                </div>
              )}
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 bg-surface-card shadow-xs">
                <Icon size={20} />
              </div>
              <span className="font-sans text-xs font-bold leading-snug text-ink line-clamp-1">
                {badge.name}
              </span>
              <span className="font-mono text-[9px] font-semibold text-muted mt-1">
                {badge.isUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Modal detail */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-card border border-hairline rounded-[28px] p-7 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${selectedBadge.color} shadow-md`}>
                <selectedBadge.icon size={32} />
              </div>

              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                  {selectedBadge.isUnlocked ? '🏆 Achievement Unlocked' : '🔒 Locked Milestone'}
                </span>
                <h3 className="font-display text-title-lg text-ink">{selectedBadge.name}</h3>
              </div>

              <p className="font-sans text-body-sm text-muted leading-relaxed">
                {selectedBadge.description}
              </p>

              <div className="px-4 py-2.5 rounded-xl bg-surface-soft border border-hairline font-mono text-xs font-bold text-ink">
                {selectedBadge.progressText}
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-3 bg-ink text-on-primary font-sans text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Close Badge Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
