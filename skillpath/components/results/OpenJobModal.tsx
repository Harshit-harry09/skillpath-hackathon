'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, ExternalLink, ArrowRight, X, Briefcase, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export interface OpenJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  readinessScore: number;
  companyType?: string;
  analysisId?: string;
}

export function OpenJobModal({
  isOpen,
  onClose,
  jobTitle,
  readinessScore,
  companyType,
  analysisId,
}: OpenJobModalProps) {
  if (!isOpen) return null;

  const targetRoleQuery = encodeURIComponent(jobTitle || 'Software Engineer');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" data-lenis-prevent>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          data-lenis-prevent
          className="bg-surface-card border-2 border-brand-teal/40 rounded-[36px] max-w-lg w-full p-8 space-y-6 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Confetti Glow Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-brand-pink/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-soft transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Celebration Trophy Badge */}
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 rounded-full bg-brand-teal/10 border-2 border-brand-teal/30 flex items-center justify-center mx-auto mb-4 text-brand-teal shadow-lg"
            >
              <Trophy size={40} className="animate-bounce" />
            </motion.div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 font-mono text-xs font-bold text-brand-teal uppercase tracking-widest mb-2">
              <Sparkles size={13} />
              80%+ Readiness Target Achieved!
            </span>

            <h2 className="font-display text-display-xs text-ink tracking-tight mt-2">
              You&apos;re Ready to Apply!
            </h2>
            <p className="font-sans text-body-md text-muted mt-2 max-w-sm mx-auto leading-relaxed">
              Your resume matches <strong className="text-ink font-bold">{readinessScore}%</strong> of the key requirements for <strong className="text-ink font-bold">{jobTitle}</strong>.
            </p>
          </div>

          {/* Role Match Summary Box */}
          <div className="bg-surface-soft/60 border border-hairline rounded-2xl p-4 flex items-center justify-between text-left relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-card border border-hairline flex items-center justify-center text-brand-teal shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <span className="font-sans text-xs font-bold text-ink block">{jobTitle}</span>
                <span className="font-mono text-[10px] text-muted capitalize">{companyType || 'Full-time position'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-bold text-brand-teal block leading-none">{readinessScore}%</span>
              <span className="font-sans text-[9px] font-bold text-muted uppercase tracking-wider">Target Match</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 relative z-10 pt-2">
            <Link
              href={`/jobs?search=${targetRoleQuery}`}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-ink text-on-primary font-sans text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer group"
            >
              <Briefcase size={16} />
              <span>Explore Matching Open Jobs</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {analysisId && (
              <a
                href={`/results/${analysisId}#more-tools`}
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-hairline bg-surface-card hover:bg-surface-soft text-xs font-bold text-ink transition-colors cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Export Tailored Resume & Toolkit</span>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
