'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, Columns, Check, ChevronRight, LayoutGrid } from 'lucide-react';

interface LayoutParseWarningProps {
  hasMultiColumn?: boolean;
  hasTables?: boolean;
  hasHiddenText?: boolean;
}

export function LayoutParseWarning({
  hasMultiColumn = true,
  hasTables = false,
  hasHiddenText = false,
}: LayoutParseWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!hasMultiColumn && !hasTables && !hasHiddenText)) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-surface-card to-surface-card p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertOctagon className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Feature #4 • Pre-Flight Layout Inspector
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-text-primary">
              Multi-Column ATS Parsing Warning Detected
            </h3>
            <p className="mt-1 text-xs text-text-muted max-w-xl leading-relaxed">
              Your uploaded PDF contains a <strong>2-column layout</strong>. Enterprise ATS systems (Workday, Taleo, iCIMS) parse documents strictly top-to-bottom, which will merge Column 2 text directly into Column 1.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-hairline bg-surface-soft px-3.5 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => alert("SkillPath linearizes your 2-column resume automatically when exporting to ATS-Safe PDF or Markdown.")}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            Auto-Convert to 1-Column ATS Safe <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
