'use client';
// updated

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { TECH_ALIASES } from '@/lib/data/fuzzy-dictionary';
import type { AnalysisResult, AnalysisRequirement } from '@/types/analysis';

interface JDSynonymMatcherProps {
  data: AnalysisResult;
}

export interface MatchedAliasItem {
  id: string;
  requirementSkill: string;
  resumeSkill: string;
  quote?: string;
  confidence: number;
}

/**
 * Reverse alias map for canonical lookup
 */
const ALIAS_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [alias, canonical] of Object.entries(TECH_ALIASES)) {
    const key = canonical.toLowerCase();
    if (!map[key]) map[key] = [];
    map[key].push(alias);
  }
  return map;
})();

export function JDSynonymMatcher({ data }: JDSynonymMatcherProps) {
  const [selectedItem, setSelectedItem] = useState<MatchedAliasItem | null>(null);

  // Compute matched synonym pairs from analysis evidence & requirements
  const matchedAliases = useMemo<MatchedAliasItem[]>(() => {
    const items: MatchedAliasItem[] = [];

    // --- Fast-path: use resume_skills to find alias matches when no AI data ---
    if (!data.requirements || !data.evidence) {
      for (const resSkill of data.resume_skills || []) {
        const lowerRes = resSkill.toLowerCase().trim();
        const canonical = TECH_ALIASES[lowerRes];
        if (canonical && canonical.toLowerCase() !== lowerRes) {
          items.push({
            id: `alias-${resSkill}`,
            requirementSkill: canonical,
            resumeSkill: resSkill,
            quote: `Extracted from resume as "${resSkill}".`,
            confidence: 0.95,
          });
        }
      }
      // Return real matches only — no hardcoded fallback examples
      return items;
    }

    const requirementMap = new Map<string, AnalysisRequirement>();
    for (const req of data.requirements) {
      requirementMap.set(req.id, req);
    }

    if (data.matches) {
      for (const match of data.matches) {
        if (match.status === 'matched' || match.status === 'partially_matched') {
          const req = requirementMap.get(match.requirement_id);
          if (!req) continue;

          for (const evId of match.evidence_ids) {
            const ev = data.evidence.find((e) => e.id === evId);
            if (!ev) continue;

            const reqNorm = req.canonical_skill.toLowerCase().trim();
            const evNorm = ev.canonical_skill.toLowerCase().trim();
            const evRaw = ev.skill.toLowerCase().trim();

            const isDirectAlias = TECH_ALIASES[evRaw] === req.canonical_skill ||
              (ALIAS_MAP[reqNorm] && ALIAS_MAP[reqNorm].includes(evRaw));

            if (isDirectAlias || (reqNorm !== evNorm && evRaw.length > 0)) {
              items.push({
                id: `${match.requirement_id}-${ev.id}`,
                requirementSkill: req.canonical_skill || req.skill,
                resumeSkill: ev.skill || ev.canonical_skill,
                quote: ev.quote,
                confidence: Math.round(match.confidence * 100) / 100,
              });
            }
          }
        }
      }
    }

    const uniqueMap = new Map<string, MatchedAliasItem>();
    for (const item of items) {
      if (!uniqueMap.has(item.requirementSkill.toLowerCase())) {
        uniqueMap.set(item.requirementSkill.toLowerCase(), item);
      }
    }

    return Array.from(uniqueMap.values());
  }, [data]);

  if (matchedAliases.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-surface-card p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3 w-3" />
            JD Synonym Auto-Matcher
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <p className="text-xs text-text-muted max-w-sm">
            No abbreviation-to-canonical mismatches detected in your resume skills. All extracted terms already use standard industry names that ATS systems recognize.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-surface-card/60 to-surface-card p-5 md:p-6 shadow-[0_0_25px_rgba(16,185,129,0.12)]">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3 w-3 animate-pulse" />
              JD Synonym Auto-Matcher
            </span>
            <span className="text-xs font-medium text-text-subtle">
              SkillPath 2.0 Semantic Engine
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-text-primary">
            Alias-Matched Competencies ({matchedAliases.length})
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            Legacy ATS systems penalize these acronym variations. SkillPath matched them seamlessly to your credit.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <Zap className="h-3.5 w-3.5" />
          <span>100% Credit Restored</span>
        </div>
      </div>

      {/* Glowing Green Pills Grid */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        {matchedAliases.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedItem(item)}
            className="group relative flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 dark:border-emerald-800/60 dark:bg-emerald-950/40 px-3.5 py-2 text-left transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                {item.requirementSkill}
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400">
                Found as <code className="rounded bg-emerald-100 dark:bg-emerald-900/80 px-1 py-0.2 text-[10px] text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">"{item.resumeSkill}"</code>
              </span>
            </div>

            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-700 dark:text-emerald-400 ml-auto" />
          </motion.button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-300 dark:border-emerald-500/40 bg-surface-card p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">
                    {selectedItem.requirementSkill}
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">
                    Matched via alias <code className="font-mono">"{selectedItem.resumeSkill}"</code>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-hairline bg-surface-soft p-3.5 text-xs">
                <span className="font-semibold text-muted">Resume Evidence Quote:</span>
                <p className="mt-1 italic text-ink font-medium">
                  "{selectedItem.quote || 'Explicitly identified in technical proficiency skills matrix.'}"
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-3 text-xs text-emerald-950 dark:text-emerald-300">
                <HelpCircle className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                <span>
                  <strong>Why this matters:</strong> Traditional keyword scanners (Jobscan) flag <em>"{selectedItem.requirementSkill}"</em> as missing if your resume says <em>"{selectedItem.resumeSkill}"</em>. SkillPath's semantic engine maps aliases automatically.
                </span>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Close Insight
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
