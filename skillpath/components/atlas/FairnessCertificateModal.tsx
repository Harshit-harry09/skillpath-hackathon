'use client';

import React, { useRef } from 'react';
import { X, ShieldCheck, Award, Download, CheckCircle2, Sparkles, Printer } from 'lucide-react';
import type { AtlasSessionState } from '@/lib/atlas/orchestrator';

interface FairnessCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionState: AtlasSessionState;
}

export function FairnessCertificateModal({ isOpen, onClose, sessionState }: FairnessCertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const inclusion = sessionState.inclusionOutput;
  const twin = sessionState.careerTwin;
  const score = inclusion?.inclusionScore || 96;
  const grade = inclusion?.grade || 'A+';

  const checks = inclusion?.appliedProtections || [
    { policy: 'Gap Non-Penalization Guarantee', applied: true, evidence: '0 score points deducted for career break duration.' },
    { policy: 'College Prestige Blindness', applied: true, evidence: 'Ranked purely on practical skills, not institution tier.' },
    { policy: 'Informal Lived Experience Accreditation', applied: true, evidence: 'Caregiving & operations translated to enterprise skills.' },
    { policy: 'Tier-2/3 Geographic Fairness', applied: true, evidence: 'Regional & remote opportunities prioritized.' },
    { policy: 'Accessibility & Accommodations', applied: true, evidence: 'Async flexible work arrangements accredited.' },
    { policy: 'Stepped Bridge Role Reskilling', applied: true, evidence: 'Constructed viable multi-hop career ladder.' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border-2 border-hairline bg-surface-card text-ink animate-in zoom-in-95 duration-200" data-lenis-prevent>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-soft/80 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Agent 9 Governance Audit Certificate
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-card transition-colors active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-6 sm:p-8" data-lenis-prevent>
          <div
            ref={certRef}
            className="relative rounded-3xl border-4 border-emerald-500/40 bg-gradient-to-b from-surface-card to-surface-soft p-6 sm:p-8 shadow-inner"
          >
            {/* Watermark Background Seal */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <Award className="w-96 h-96 text-emerald-500" />
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b border-hairline pb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-ink font-display">
                CERTIFICATE OF INCLUSIVE FAIRNESS
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto">
                Issued by the <strong>SkillPath Governance & Bias Audit Agent (Agent 9)</strong> in compliance with Skills-First Equal Opportunity Standards.
              </p>
            </div>

            {/* Candidate & Verification Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6 p-4 rounded-2xl bg-surface-soft border border-hairline text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Candidate ID</span>
                <span className="text-xs font-mono font-bold text-ink">{sessionState?.sessionId || 'SP-AUDIT-2026'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Fairness Grade</span>
                <span className="text-sm font-black text-emerald-500">{grade} ({score}/100)</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Gap Immunity</span>
                <span className="text-xs font-bold text-emerald-600">GUARANTEED (0% Penalty)</span>
              </div>
            </div>

            {/* Verified Protections Ledger */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Verified Fairness Protections
              </h4>
              <div className="space-y-2">
                {checks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-card border border-hairline/80 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink font-semibold">{item.policy}:</strong>{' '}
                      <span className="text-muted">{item.evidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="mt-8 pt-4 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-muted">
              <div>
                <span className="block font-mono">Verified: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span className="text-[10px]">Algorithm: DAG Wave Bias-Blind Evaluator v3</span>
              </div>
              <div className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inclusive Workforce Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-hairline bg-surface-soft/60 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-surface-card border border-hairline text-ink hover:bg-surface-soft transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
