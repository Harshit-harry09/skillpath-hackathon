'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PlusCircle, MinusCircle, HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult, AnalysisMatch, AnalysisEvidence } from '@/types/analysis';

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

/**
 * Derives honest citation points from real backend evidence + match data.
 * Falls back to ATS composite breakdown when no AI enrichment is present.
 */
function buildCitations(data: AnalysisResult): CitationPoint[] {
  const citations: CitationPoint[] = [];

  // --- Use real AI evidence + match data when available ---
  if (data.evidence?.length && data.matches?.length) {
    const evidenceMap = new Map<string, AnalysisEvidence>();
    for (const ev of data.evidence) evidenceMap.set(ev.id, ev);

    const requirementMap = new Map<string, string>();
    for (const req of data.requirements || []) {
      requirementMap.set(req.id, req.canonical_skill || req.skill);
    }

    for (const match of data.matches) {
      if (citations.length >= 6) break;
      const skill = requirementMap.get(match.requirement_id) || match.requirement_id;

      if (match.status === 'matched' || match.status === 'partially_matched' || match.status === 'transferable') {
        const ev = match.evidence_ids.map(id => evidenceMap.get(id)).find(Boolean);
        const pts = match.status === 'matched' ? 15
          : match.status === 'partially_matched' ? 9
          : 6;
        citations.push({
          id: `match-${match.requirement_id}`,
          type: 'gain',
          points: pts,
          lineOrSection: ev?.section ? `${ev.section} Section` : 'Resume',
          quote: ev?.quote || `Evidence found for "${skill}"`,
          reason: match.reason || `${match.status.replace('_', ' ')} for "${skill}" requirement.`,
        });
      } else if (match.status === 'missing' || match.status === 'contradicted') {
        const penalty = match.status === 'missing' ? -10 : -12;
        citations.push({
          id: `miss-${match.requirement_id}`,
          type: 'deduction',
          points: penalty,
          lineOrSection: 'Required Skills',
          quote: `"${skill}" not evidenced in resume.`,
          reason: match.reason || `No verified evidence for required skill "${skill}".`,
        });
      }
    }
  }

  // --- Use composite ATS score breakdown when AI evidence is absent ---
  if (citations.length === 0 && data.composite_ats_score) {
    const { breakdown, strengths, penalties } = data.composite_ats_score;
    const sections: Array<{ name: string; score: number; weight: number }> = [
      { name: 'Skills Coverage', score: breakdown.skills_score, weight: 0.3 },
      { name: 'Experience Depth', score: breakdown.experience_score, weight: 0.3 },
      { name: 'Education Fit', score: breakdown.education_score, weight: 0.15 },
      { name: 'Role Title Alignment', score: breakdown.title_score, weight: 0.15 },
      { name: 'Resume Formatting', score: breakdown.formatting_score, weight: 0.1 },
    ];

    sections.forEach(({ name, score, weight }, i) => {
      const maxPts = Math.round(weight * 100);
      const earnedPts = Math.round((score / 100) * maxPts);
      const lostPts = maxPts - earnedPts;

      citations.push({
        id: `ats-${i}`,
        type: earnedPts >= Math.round(maxPts * 0.6) ? 'gain' : 'deduction',
        points: earnedPts,
        lineOrSection: `${name} (${earnedPts}/${maxPts} pts)`,
        quote: (earnedPts >= Math.round(maxPts * 0.6) ? strengths[i] : penalties[i]) || `${score}% Sub-Score (${earnedPts}/${maxPts} ATS weight)`,
        reason: `ATS 5-Pillar evaluation: ${score}% match score contributing ${earnedPts} out of ${maxPts} total composite points.`,
      });
    });
  }

  return citations;
}

export function ShowYourWorkScore({ data }: ShowYourWorkScoreProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const citations = buildCitations(data);
  const hasRealData = Boolean(data.evidence?.length || data.composite_ats_score);

  const totalGain = citations.filter((c) => c.type === 'gain').reduce((acc, c) => acc + Math.abs(c.points), 0);
  const totalDeduction = citations.filter((c) => c.type === 'deduction').reduce((acc, c) => acc + Math.abs(c.points), 0);

  // No data at all — show pending state
  if (!hasRealData) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-hairline pb-4">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
            <FileText className="h-3 w-3" />
            Line-by-Line Score Breakdown
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-muted" />
          <p className="text-body-sm text-muted max-w-xs">
            Evidence-backed score breakdown will appear once AI analysis completes. Your deterministic gap score is shown in the overview above.
          </p>
        </div>
      </div>
    );
  }

  if (citations.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-hairline pb-4">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
            <FileText className="h-3 w-3" />
            Line-by-Line Score Breakdown
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-brand-teal" />
          <p className="text-body-sm text-muted max-w-xs">
            No requirement matches to cite yet. Complete the analysis and enable AI enrichment for detailed evidence quotes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              <FileText className="h-3 w-3" />
              {data.evidence?.length ? 'AI Evidence Citation Audit' : 'ATS Score Breakdown'}
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-text-primary">
            {data.evidence?.length ? 'Line-by-Line Match Score Breakdown' : 'ATS Composite Score Breakdown'}
          </h3>
          <p className="text-xs text-text-muted">
            {data.evidence?.length
              ? 'Every point gained or deducted is linked to a verified sentence in your resume.'
              : 'Score breakdown from local deterministic ATS pipeline analysis.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-800 dark:text-emerald-400 font-bold">+{totalGain} pts gained</span>
          <span className="text-rose-800 dark:text-rose-400 font-bold">-{totalDeduction} pts lost</span>
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
                  ? 'border-emerald-300 bg-emerald-50/80 hover:border-emerald-400 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                  : 'border-rose-300 bg-rose-50/80 hover:border-rose-400 dark:border-rose-800/40 dark:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    isGain
                      ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-rose-200 text-rose-900 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}>
                    {isGain ? `+${c.points}` : `${c.points}`}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-text-primary group-hover:text-brand-teal transition-colors">
                      {c.lineOrSection}
                    </span>
                    <p className="text-[11px] text-text-subtle italic line-clamp-1">
                      &ldquo;{c.quote}&rdquo;
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
