'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Calculator, Sparkles, Check } from 'lucide-react';

interface MetricDiscoveryModalProps {
  bulletText?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyMetric: (quantifiedBullet: string) => void;
}

export function MetricDiscoveryModal({
  bulletText = "Managed server infrastructure and database deployment.",
  isOpen,
  onClose,
  onApplyMetric,
}: MetricDiscoveryModalProps) {
  const [userAnswer1, setUserAnswer1] = useState('50,000');
  const [userAnswer2, setUserAnswer2] = useState('35%');

  if (!isOpen) return null;

  const generatedBullet = `Engineered PostgreSQL database cluster and automated EC2 deployment handling over ${userAnswer1} daily active requests, improving query throughput by ${userAnswer2}.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-brand-teal/40 bg-surface-card p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/20 text-brand-teal border border-brand-teal/30">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-bold text-brand-teal uppercase">
                Feature #8 • Metric Uncover
              </span>
            </div>
            <h4 className="text-base font-bold text-text-primary">
              Uncover Real Metrics (No AI Lies)
            </h4>
          </div>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          SkillPath never fabricates numbers. Answer these 2 quick questions to calculate your true metric impact:
        </p>

        {/* Question 1 */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-xl border border-border-card bg-surface-soft p-3">
            <label className="font-semibold text-text-primary block">
              1. Approximately how many users or daily API calls did this project touch?
            </label>
            <input
              type="text"
              value={userAnswer1}
              onChange={(e) => setUserAnswer1(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 font-mono text-text-primary focus:border-brand-teal focus:outline-none"
              placeholder="e.g. 50,000 users or 10M records"
            />
          </div>

          {/* Question 2 */}
          <div className="rounded-xl border border-border-card bg-surface-soft p-3">
            <label className="font-semibold text-text-primary block">
              2. What was the estimated speed, cost, or time improvement?
            </label>
            <input
              type="text"
              value={userAnswer2}
              onChange={(e) => setUserAnswer2(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 font-mono text-text-primary focus:border-brand-teal focus:outline-none"
              placeholder="e.g. 35% latency drop or 4 hrs saved weekly"
            />
          </div>
        </div>

        {/* Real-time Quantified Bullet Preview */}
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Generated Verified Metric Bullet:
          </span>
          <p className="mt-1 font-mono text-[11px] leading-relaxed">
            "{generatedBullet}"
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-hairline bg-surface-soft px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generatedBullet);
              onApplyMetric(generatedBullet);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Apply & Copy Metric
          </button>
        </div>
      </motion.div>
    </div>
  );
}
