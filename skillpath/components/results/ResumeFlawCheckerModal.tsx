'use client';
// updated

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldAlert,
  SpellCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import type { ResumeFlawItem, FlawAnalysisResponse } from '@/app/api/analyze-resume-flaws/route';

interface ResumeFlawCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeText?: string;
  roleLabel?: string;
}

export function ResumeFlawCheckerModal({
  isOpen,
  onClose,
  resumeText = '',
  roleLabel = 'Software Engineer',
}: ResumeFlawCheckerModalProps) {
  const [inputText, setInputText] = useState(resumeText);
  const [analysis, setAnalysis] = useState<FlawAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'formatting' | 'clarity' | 'red_flag'>('all');

  useEffect(() => {
    if (isOpen && !analysis) {
      runAnalysis(resumeText);
    }
  }, [isOpen, resumeText]);

  async function runAnalysis(textToAnalyze: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-resume-flaws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: textToAnalyze }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error('Failed to analyze resume flaws:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyFix = (fix: string, id: string) => {
    navigator.clipboard.writeText(fix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const flaws = analysis?.flaws || [];
  const filteredFlaws = activeTab === 'all' ? flaws : flaws.filter((f) => f.category === activeTab);

  const score = analysis?.overall_score ?? 80;
  const getScoreBadge = (s: number) => {
    if (s >= 85) return { label: 'High Quality', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (s >= 70) return { label: 'Minor Flaws Found', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Critical Errors Found', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };
  const scoreBadge = getScoreBadge(score);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface-card border border-hairline rounded-3xl p-6 md:p-8 max-w-2xl w-full relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-hairline shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
                <SpellCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest block">
                  AI Quality & Grammar Guard
                </span>
                <h3 className="font-display text-title-md text-ink">
                  Resume Flaw & Grammar Auditor
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

          {/* Body Content */}
          <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
            {/* Score & Summary Banner */}
            {analysis && !loading && (
              <div className="p-4 rounded-2xl bg-surface-soft/60 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-canvas border border-hairline flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-bold font-display text-ink">{score}</span>
                    <span className="text-[9px] text-muted font-bold uppercase">/100</span>
                  </div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-1 ${scoreBadge.color}`}>
                      {scoreBadge.label}
                    </span>
                    <p className="text-body-xs text-muted leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runAnalysis(inputText)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline bg-canvas text-xs font-semibold text-ink hover:bg-surface-soft transition-colors"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  Re-Scan
                </button>
              </div>
            )}

            {/* Input Toggle / Custom Resume Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-ink">Scanned Resume Excerpt:</label>
                <span className="text-muted text-[10px]">Edit text below to re-test</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                placeholder="Paste your resume text or bullet points here..."
                className="w-full rounded-xl border border-hairline bg-canvas p-3 font-mono text-xs text-ink focus:border-brand-teal focus:outline-none"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-hairline pb-3">
              {(
                [
                  { id: 'all', label: `All Flaws (${flaws.length})` },
                  { id: 'grammar', label: 'Grammar & Typos' },
                  { id: 'formatting', label: 'Formatting' },
                  { id: 'clarity', label: 'Passive & Clarity' },
                  { id: 'red_flag', label: 'ATS Red Flags' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-ink text-on-primary shadow-xs'
                      : 'bg-surface-soft text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-body-sm text-muted">Auditing grammar, syntax, and ATS red flags for {roleLabel}...</p>
              </div>
            ) : filteredFlaws.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <h4 className="font-bold text-ink text-body-md">No Flaws Detected in this Category!</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Your resume text passed all grammatical and structural rules in this section.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredFlaws.map((flaw) => (
                  <div
                    key={flaw.id}
                    className="p-4 rounded-2xl bg-canvas border border-hairline space-y-3 hover:border-brand-pink/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            flaw.severity === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : flaw.severity === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {flaw.severity}
                        </span>
                        <h4 className="text-xs font-bold text-ink">{flaw.title}</h4>
                      </div>
                      <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                        {flaw.category}
                      </span>
                    </div>

                    {/* Original Flaw Text */}
                    {flaw.original_text && (
                      <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15 text-[11px] text-rose-300 font-mono">
                        <span className="text-[10px] text-rose-400 font-bold block mb-0.5">Issue Excerpt:</span>
                        "{flaw.original_text}"
                      </div>
                    )}

                    <p className="text-xs text-muted leading-relaxed">{flaw.explanation}</p>

                    {/* 1-Click Suggested Fix */}
                    {flaw.suggested_fix && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} /> Suggested 1-Click Fix:
                          </span>
                          <p className="text-xs text-emerald-200 font-medium font-sans">
                            {flaw.suggested_fix}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyFix(flaw.suggested_fix, flaw.id)}
                          className="shrink-0 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                          title="Copy fix"
                        >
                          {copiedId === flaw.id ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-hairline flex items-center justify-between shrink-0">
            <span className="text-[11px] text-muted">
              AI checks for 12+ common recruiter reject triggers.
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
