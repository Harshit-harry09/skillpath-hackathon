'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Copy, Check, X, ArrowRight, RefreshCw } from 'lucide-react';

interface DeslopifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeSkills?: string[];
  resumeText?: string;
}

interface BuzzwordFix {
  buzzword: string;
  replacement: string;
  category: 'overused' | 'passive' | 'vague';
  reason: string;
  exampleOriginal: string;
  exampleImproved: string;
}

const BUZZWORD_CATALOG: BuzzwordFix[] = [
  {
    buzzword: 'Responsible for',
    replacement: 'Engineered / Directed',
    category: 'passive',
    reason: 'Describes a job description duty rather than what you actually accomplished.',
    exampleOriginal: 'Responsible for maintaining PostgreSQL database clusters.',
    exampleImproved: 'Engineered PostgreSQL clustering, maintaining 99.99% uptime across production.',
  },
  {
    buzzword: 'Spearheaded',
    replacement: 'Architected / Led',
    category: 'overused',
    reason: 'Overused buzzword on 40%+ of engineering resumes; recruiters read right past it.',
    exampleOriginal: 'Spearheaded the migration to microservices.',
    exampleImproved: 'Architected microservices migration, reducing deployment cycle times by 40%.',
  },
  {
    buzzword: 'Synergized',
    replacement: 'Integrated / Coordinated',
    category: 'vague',
    reason: 'Corporate jargon that obscures technical contributions.',
    exampleOriginal: 'Synergized cross-functional team workflows.',
    exampleImproved: 'Integrated CI/CD pipelines across 4 product teams, reducing integration errors.',
  },
  {
    buzzword: 'Utilized',
    replacement: 'Deployed / Configured',
    category: 'passive',
    reason: 'Passive tech verb that sounds weak compared to active engineering actions.',
    exampleOriginal: 'Utilized Docker and Kubernetes for apps.',
    exampleImproved: 'Deployed multi-container apps via Kubernetes, scaling to 10k concurrent users.',
  },
  {
    buzzword: 'Assisted with',
    replacement: 'Co-developed / Implemented',
    category: 'vague',
    reason: 'Diminishes technical ownership and sounds like passive observation.',
    exampleOriginal: 'Assisted with backend API optimizations.',
    exampleImproved: 'Co-developed GraphQL API endpoints, cutting payload size by 25%.',
  },
  {
    buzzword: 'Handled',
    replacement: 'Optimized / Resolved',
    category: 'vague',
    reason: 'Vague verb that conveys low technical complexity.',
    exampleOriginal: 'Handled client bug reports and server outages.',
    exampleImproved: 'Resolved critical P0 production outages, lowering MTTR to under 15 minutes.',
  },
];

export function DeslopifyModal({
  isOpen,
  onClose,
  resumeText = '',
}: DeslopifyModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customText, setCustomText] = useState(
    resumeText || 'Responsible for backend infrastructure. Spearheaded cloud migrations and utilized Docker daily.'
  );
  const [cleanedText, setCleanedText] = useState('');
  const [hasCleaned, setHasCleaned] = useState(false);

  const handleCleanText = () => {
    let result = customText;
    BUZZWORD_CATALOG.forEach((item) => {
      const regex = new RegExp(`\\b${item.buzzword}\\b`, 'gi');
      result = result.replace(regex, item.replacement.split(' / ')[0]);
    });
    setCleanedText(result);
    setHasCleaned(true);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface-card border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-hairline shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  Feature #1 • Passive Verb De-Slopifier
                </span>
                <h3 className="font-display text-title-md text-ink">
                  1-Click AI Buzzword De-Slopifier
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-soft text-muted hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
            <p className="text-body-xs text-muted leading-relaxed">
              Recruiters immediately skip candidates who overuse passive phrases like "responsible for" or corporate buzzwords like "synergized". Convert your bullets to active engineering verbs.
            </p>

            {/* Interactive De-Slopifier Workspace */}
            <div className="space-y-3 p-4 rounded-2xl bg-surface-soft/60 border border-hairline">
              <label className="text-xs font-bold text-ink block">
                Paste Bullet Points to De-Slopify:
              </label>
              <textarea
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setHasCleaned(false);
                }}
                rows={3}
                className="w-full rounded-xl border border-hairline bg-canvas p-3 font-mono text-xs text-ink focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Responsible for maintaining server infrastructure..."
              />
              <button
                type="button"
                onClick={handleCleanText}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                <Sparkles size={14} />
                <span>Replace Passive Slop with Active Verbs</span>
              </button>

              {hasCleaned && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check size={14} /> Cleaned Active Engineering Verbs:
                  </span>
                  <p className="font-mono text-[11px] text-emerald-200 leading-relaxed bg-canvas p-2.5 rounded-lg border border-hairline">
                    "{cleanedText}"
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanedText, 999)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                    >
                      {copiedIndex === 999 ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedIndex === 999 ? 'Copied!' : 'Copy De-Slopified Text'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog of Passive Verbs vs Active Alternatives */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Common Passive Buzzwords & Replacement Matrix:
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {BUZZWORD_CATALOG.map((item, idx) => (
                  <div
                    key={item.buzzword}
                    className="p-4 rounded-2xl bg-canvas border border-hairline space-y-2 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-bold line-through">
                          {item.buzzword}
                        </span>
                        <ArrowRight size={12} className="text-muted" />
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                          {item.replacement}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-muted">{item.reason}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-lg bg-surface-soft border border-hairline text-muted font-mono line-through">
                        ❌ {item.exampleOriginal}
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 font-mono">
                        ✅ {item.exampleImproved}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-hairline flex items-center justify-between shrink-0">
            <span className="text-[11px] text-muted">
              Engineering verbs increase resume recruiter scan scores.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-sans font-semibold text-button hover:bg-primary-active transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
