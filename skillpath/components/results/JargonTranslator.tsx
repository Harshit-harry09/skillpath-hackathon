'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ArrowRight, Check, Sparkles } from 'lucide-react';

interface JargonTranslation {
  id: string;
  internalTerm: string;
  industryTerm: string;
  context: string;
}

export function JargonTranslator() {
  const [translations, setTranslations] = useState<JargonTranslation[]>([
    {
      id: 'j-1',
      internalTerm: 'Project Falcon',
      industryTerm: 'Distributed Real-Time Payment Gateway Service',
      context: 'External recruiters do not recognize internal company project names.',
    },
    {
      id: 'j-2',
      internalTerm: 'HyperDB Cluster',
      industryTerm: 'Sharded PostgreSQL Database Cluster',
      context: 'Translates proprietary database name into standard open-source stack term.',
    },
  ]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
          <Languages className="h-3 w-3" />
          Jargon-to-Industry Term Translator
        </span>
        <span className="text-xs font-medium text-text-subtle">Feature #7</span>
      </div>

      <h3 className="text-base font-bold text-text-primary">
        Internal Corporate Codenames Translated ({translations.length})
      </h3>
      <p className="text-xs text-text-muted mt-0.5">
        Converts internal company acronyms into industry-standard terms that recruiters and ATS algorithms recognize.
      </p>

      {/* Translations Grid */}
      <div className="mt-4 flex flex-col gap-2.5">
        {translations.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-soft/60 p-3.5"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className="rounded bg-rose-950/40 border border-rose-500/30 px-2 py-1 font-mono font-bold text-rose-300">
                "{item.internalTerm}"
              </span>
              <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
              <span className="rounded bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 font-mono font-bold text-emerald-300">
                "{item.industryTerm}"
              </span>
            </div>

            <span className="text-[11px] text-text-subtle italic">
              {item.context}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
