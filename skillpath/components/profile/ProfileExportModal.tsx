'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, X, FileText, Download, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import type { ActiveJob } from '@/types/active-job';

export interface ProfileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activeJob: ActiveJob | null;
}

export function ProfileExportModal({ isOpen, onClose, profile, activeJob }: ProfileExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const trackedSkills = activeJob?.skills || [];
  
  // 1. Completed Items
  const completedItems = trackedSkills.filter(s => s.state === 'learned');

  // 2. Weak Areas
  const weakAreas = trackedSkills
    .filter(s => s.state === 'not_started' || s.state === 'in_progress')
    .sort((a, b) => b.priority - a.priority);

  // 3. Next Recommended Action
  const nextRecommendation = weakAreas.length > 0 ? weakAreas[0] : null;

  // 4. Recent Activity
  const streakDays = profile.streak_count || 0;
  const lastActiveDate = profile.streak_last_date || new Date().toISOString().split('T')[0];

  const markdownText = `
# 🚀 SkillPath Learner Summary — ${profile.display_name}
**Target Role:** ${profile.target_role || activeJob?.job_title || 'Software Engineer'}
**Market Readiness Score:** ${activeJob ? activeJob.readiness_score : 0}%
**Streak:** ${streakDays} Days 🔥 | **Last Active:** ${lastActiveDate}

---

### ✅ 1. Completed Items (${completedItems.length})
${completedItems.length > 0
  ? completedItems.map(s => `- **${s.skill}**${s.note ? ` *(Note: "${s.note}")*` : ''}`).join('\n')
  : '- No items marked complete yet.'}

### ⚠️ 2. Weak Areas & Skill Gaps (${weakAreas.length})
${weakAreas.length > 0
  ? weakAreas.map(s => `- **${s.skill}** (Priority ${s.priority}, ~${s.weeks_to_learn || 1}w focus)${s.reason ? `: ${s.reason}` : ''}`).join('\n')
  : '- All target skill gaps resolved! 🎉'}

### 🎯 3. Next Recommended Action
${nextRecommendation
  ? `**Action:** Master **${nextRecommendation.skill}** (~${nextRecommendation.weeks_to_learn || 1}w focus)\n**Reason:** ${nextRecommendation.reason || 'Highest priority skill gap required for target role readiness.'}`
  : 'Target role requirements fulfilled. Select a new target role to generate recommendations.'}

### ⚡ 4. Recent Activity
- **Current Active Streak:** ${streakDays} days
- **Total Skills Mastered:** ${profile.total_skills_learned || completedItems.length}
- **Last Active Date:** ${lastActiveDate}
- **Active Tracker Target:** ${activeJob ? activeJob.job_title : 'None locked'}

---
*Verified via SkillPath Career Acceleration Engine*
  `.trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 2500);

    const filename = `SkillPath_Learner_Summary_${(profile.display_name || 'User').replace(/\s+/g, '_')}.${format}`;
    const blob = new Blob([markdownText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" data-lenis-prevent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          data-lenis-prevent
          className="bg-surface-card border border-hairline rounded-[32px] max-w-2xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-soft transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink text-on-primary flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="font-display text-title-md text-ink">Learner Summary & Export</h2>
              <p className="font-sans text-body-sm text-muted">Completed items, weak areas, next action & recent activity</p>
            </div>
          </div>

          {/* Visual 4-Part Summary Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-hairline bg-surface-soft/40 space-y-1">
              <div className="flex items-center justify-between font-bold text-ink">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand-teal" /> Completed Items</span>
                <span className="font-mono text-[10px] text-brand-teal">{completedItems.length}</span>
              </div>
              <p className="text-muted truncate">{completedItems.length ? completedItems.map(s => s.skill).join(', ') : 'None yet'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-hairline bg-surface-soft/40 space-y-1">
              <div className="flex items-center justify-between font-bold text-ink">
                <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-brand-pink" /> Weak Areas</span>
                <span className="font-mono text-[10px] text-brand-pink">{weakAreas.length}</span>
              </div>
              <p className="text-muted truncate">{weakAreas.length ? weakAreas.map(s => s.skill).join(', ') : 'All clear!'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-brand-teal/30 bg-brand-teal/5 space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between font-bold text-brand-teal">
                <span className="flex items-center gap-1.5"><ArrowRight size={14} /> Next Recommended Action</span>
              </div>
              <p className="text-ink font-semibold">{nextRecommendation ? `Master ${nextRecommendation.skill} (~${nextRecommendation.weeks_to_learn || 1}w focus)` : 'Select a target role to get recommendations'}</p>
            </div>
          </div>

          {/* Markdown Text Preview Box */}
          <div className="bg-canvas border border-hairline rounded-2xl p-5 font-mono text-xs text-ink space-y-2 max-h-52 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted">
              {markdownText}
            </pre>
          </div>

          {/* Export Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-ink text-on-primary font-sans text-xs font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {copied ? (
                <><Check size={16} className="text-brand-teal" /> Markdown Copied!</>
              ) : (
                <><Copy size={16} /> Copy Markdown</>
              )}
            </button>

            <button
              onClick={() => handleDownload('md')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-soft hover:bg-surface-strong border border-hairline font-sans text-xs font-bold text-ink rounded-2xl transition-all cursor-pointer"
            >
              {downloadedFormat === 'md' ? <Check size={14} className="text-brand-teal" /> : <Download size={14} />}
              <span>Download .md</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-soft hover:bg-surface-strong border border-hairline font-sans text-xs font-bold text-ink rounded-2xl transition-all cursor-pointer"
            >
              {downloadedFormat === 'txt' ? <Check size={14} className="text-brand-teal" /> : <FileText size={14} />}
              <span>Download .txt</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
