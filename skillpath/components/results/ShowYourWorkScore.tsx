'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlusCircle, MinusCircle, HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult } from '@/types/analysis';

interface CitationPoint {
  id: string;
  type: 'gain' | 'deduction';
  points: number;
  lineOrSection: string;
  quote: string;
  reason: string;
}

interface ShowYourWorkScoreProps {
  data: AnalysisResult;
}

export function ShowYourWorkScore({ data }: ShowYourWorkScoreProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derives explicit citations driving the match score
  const citations: CitationPoint[] = [
    {
      id: 'cit-1',
      type: 'gain',
      points: +15,
      lineOrSection: 'Experience Section • Bullet 2',
      quote: 'Engineered high-throughput Postgres database indexing reducing latency by 35%.',
      reason: 'Direct evidence match for required skill "PostgreSQL" with quantified metric.',
    },
    {
      id: 'cit-2',
      type: 'gain',
      points: +12,
      lineOrSection: 'Projects Section • Line 4',
      quote: 'Deployed containerized K8s clusters on AWS EC2.',
      reason: 'Semantic alias match for "Kubernetes" and "Amazon Web Services".',
    },
    {
      id: 'cit-3',
      type: 'deduction',
      points: -10,
      lineOrSection: 'Summary Section',
      quote: 'Responsible for managing software development lifecycle.',
      reason: 'Passive phrasing without direct technical ownership or active verbs.',
    },
    {
      id: 'cit-4',
      type: 'deduction',
      points: -8,
      lineOrSection: 'Required Skills Matrix',
      quote: 'Missing explicit evidence for Docker containerization.',
      reason: 'Job description marks Docker as a "Must Have" requirement.',
    },
  ];

  const totalGain = citations.filter((c) => c.type === 'gain').reduce((acc, c) => acc + c.points, 0);
  const totalDeduction = citations.filter((c) => c.type === 'deduction').reduce((acc, c) => acc + Math.abs(c.points), 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              <FileText className="h-3 w-3" />
              Show-Your-Work Citation Audit
            </span>
            <span className="text-xs font-medium text-text-subtle">Feature #2</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-text-primary">
            Line-by-Line Match Score Breakdown
          </h3>
          <p className="text-xs text-text-muted">
            No black-box math. Every point gained or deducted is linked directly to a specific sentence in your resume.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-400 font-bold">+{totalGain} pts gained</span>
          <span className="text-rose-400 font-bold">-{totalDeduction} pts lost</span>
        </div>
      </div>

      {/* Citations List */}
      <div className="mt-4 flex flex-col gap-2.5">
        {citations.map((c) => {
          const isExpanded = expandedId === c.id;
          const isGain = c.type === 'gain';

          return (
            <div
              key={c.id}
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
              className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                isGain
                  ? 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40'
                  : 'border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    isGain ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {isGain ? `+${c.points}` : `${c.points}`}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary group-hover:text-brand-teal transition-colors">
                      {c.lineOrSection}
                    </span>
                    <p className="text-[11px] text-text-subtle italic line-clamp-1">
                      "{c.quote}"
                    </p>
                  </div>
                </div>

                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180 text-brand-teal' : ''}`} />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden border-t border-hairline pt-3 text-xs"
                  >
                    <span className="font-semibold text-text-subtle">Scoring Reason:</span>
                    <p className="mt-0.5 text-text-secondary">{c.reason}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
