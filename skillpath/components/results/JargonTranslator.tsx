'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ArrowRight, Check, Sparkles, Info } from 'lucide-react';
import { TECH_ALIASES } from '@/lib/data/fuzzy-dictionary';

interface JargonTranslation {
  id: string;
  internalTerm: string;
  industryTerm: string;
  context: string;
}

interface JargonTranslatorProps {
  resumeSkills?: string[];
}

/**
 * Detects probable internal codenames by finding resume skills/tokens
 * that have no match in the industry alias dictionary.
 * Only shows translations when real data is found.
 */
function detectProbableCodenames(skills: string[]): JargonTranslation[] {
  const results: JargonTranslation[] = [];
  const allAliases = new Set(
    Object.keys(TECH_ALIASES).map((k) => k.toLowerCase())
  );
  const allCanonicals = new Set(
    Object.values(TECH_ALIASES).map((v) => v.toLowerCase())
  );

  for (const skill of skills) {
    const lower = skill.toLowerCase().trim();
    // Skip short tokens or known industry terms
    if (skill.length < 4) continue;
    if (allAliases.has(lower) || allCanonicals.has(lower)) continue;

    // Heuristic: looks like an internal codename if it's title-cased, has no spaces,
    // and is not a common English word pattern
    const looksLikeCodename =
      /^[A-Z][a-z]+[A-Z]/.test(skill) || // CamelCase like HyperDB
      (/^[A-Z]{2,}$/.test(skill) && skill.length >= 4) || // All-caps acronym like FALCON
      (skill.includes(' ') && skill.split(' ').every((w) => /^[A-Z]/.test(w)) && skill.split(' ').length <= 3); // Title Case short phrase

    if (looksLikeCodename) {
      results.push({
        id: `codename-${skill}`,
        internalTerm: skill,
        industryTerm: `[Recruiter-facing equivalent needed for "${skill}"]`,
        context: `This term may be an internal project name or proprietary system. External recruiters and ATS may not recognize it — consider replacing with a standard industry equivalent.`,
      });
    }
  }

  return results.slice(0, 5);
}

export function JargonTranslator({ resumeSkills = [] }: JargonTranslatorProps) {
  const translations = detectProbableCodenames(resumeSkills);

  if (translations.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            <Languages className="h-3 w-3" />
            Jargon-to-Industry Term Translator
          </span>
        </div>
        <h3 className="text-base font-bold text-text-primary">
          Internal Codename Check
        </h3>
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center gap-2">
          <Info className="h-6 w-6 text-muted" />
          <p className="text-xs text-text-muted max-w-sm">
            No probable internal codenames detected in your resume skills. All extracted skills appear to be standard industry terms that ATS systems will recognize.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
          <Languages className="h-3 w-3" />
          Jargon-to-Industry Term Translator
        </span>
      </div>

      <h3 className="text-base font-bold text-text-primary">
        Probable Internal Codenames Detected ({translations.length})
      </h3>
      <p className="text-xs text-text-muted mt-0.5">
        These terms from your resume may be internal project names or proprietary system names that ATS scanners won&apos;t recognize. Consider replacing them with standard industry equivalents.
      </p>

      {/* Translations Grid */}
      <div className="mt-4 flex flex-col gap-2.5">
        {translations.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border border-border-subtle bg-surface-soft/60 p-3.5"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className="rounded-md bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-300 px-2 py-1 font-mono font-bold">
                &ldquo;{item.internalTerm}&rdquo;
              </span>
              <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
              <span className="rounded bg-surface-soft border border-hairline px-2.5 py-1 font-sans text-[11px] text-muted italic">
                Replace with industry-standard term
              </span>
            </div>

            <span className="text-[11px] text-text-subtle max-w-xs">
              {item.context}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
