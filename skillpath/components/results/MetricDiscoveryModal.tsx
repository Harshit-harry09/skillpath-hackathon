'use client';
// updated

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
  bulletText = '',
  isOpen,
  onClose,
  onApplyMetric,
}: MetricDiscoveryModalProps) {
  const [userAnswer1, setUserAnswer1] = useState('');  
  const [userAnswer2, setUserAnswer2] = useState('');

  if (!isOpen) return null;

  // Build a real preview from what the user actually typed
  const baseBullet = bulletText.trim() || 'Delivered project outcome';
  const hasMetrics = userAnswer1.trim() || userAnswer2.trim();
  const metricParts: string[] = [];
  if (userAnswer1.trim()) metricParts.push(`handling over ${userAnswer1.trim()} daily requests/users`);
  if (userAnswer2.trim()) metricParts.push(`improving performance by ${userAnswer2.trim()}`);
  const generatedBullet = hasMetrics
    ? `${baseBullet.replace(/\.$/, '')}, ${metricParts.join(', ')}.`
    : baseBullet;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-lenis-prevent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-brand-teal/40 bg-surface-card p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 shrink-0 pb-3 border-b border-hairline">
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

          {/* Scrollable Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent"
            data-lenis-prevent
          >

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
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-3.5 text-xs text-emerald-950 dark:text-emerald-200">
          <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Generated Verified Metric Bullet:
          </span>
          <p className="mt-1 font-mono text-[11px] leading-relaxed font-semibold">
            "{generatedBullet}"
          </p>
        </div>

          </div>

          {/* Footer */}
          <div className="pt-4 mt-2 border-t border-hairline flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-hairline bg-surface-soft px-4 py-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="h-3.5 w-3.5" /> Apply & Copy Metric
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
