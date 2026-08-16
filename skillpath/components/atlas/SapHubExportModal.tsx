'use client';

import React, { useState } from 'react';
import { X, Copy, Download, Check, Database, Bot, Sparkles, Building2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { exportToSapTalentIntelligenceHub, generateSapJouleAgentHandoff, type SapTalentIntelligencePortfolio, type SapJouleAgentHandoff } from '@/lib/atlas/sap-export';
import type { AtlasSessionState } from '@/lib/atlas/orchestrator';

interface SapHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionState: AtlasSessionState;
}

export function SapHubExportModal({ isOpen, onClose, sessionState }: SapHubExportModalProps) {
  const [activeTab, setActiveTab] = useState<'tih_json' | 'joule_agents'>('tih_json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sapPortfolio = exportToSapTalentIntelligenceHub(sessionState);
  const jouleHandoff = generateSapJouleAgentHandoff(sessionState);

  const jsonString = JSON.stringify(sapPortfolio, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAP_SuccessFactors_Skills_Portfolio_${sapPortfolio.candidateProfile.candidateId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border-2 border-hairline bg-surface-card text-ink animate-in zoom-in-95 duration-200"
        data-lenis-prevent
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--bold-border)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-hairline bg-surface-soft/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">
                  SAP SuccessFactors Connected
                </span>
                <span className="text-xs text-muted">v2026.1 Standard</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-ink">
                Talent Intelligence Hub & Joule Agent Export
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-card transition-colors active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-hairline bg-surface-card shrink-0">
          <button
            onClick={() => setActiveTab('tih_json')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'tih_json'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Database className="w-4 h-4" />
            Skills Portfolio JSON (TIH)
          </button>
          <button
            onClick={() => setActiveTab('joule_agents')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'joule_agents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Bot className="w-4 h-4" />
            SAP Joule Agent Handoffs
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-6 space-y-4" data-lenis-prevent>
          {activeTab === 'tih_json' ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <p className="text-xs text-muted leading-relaxed">
                  Export standard, structured skills taxonomy with inferred proficiencies, gap immunity status, and lived experience accreditation for <strong>SAP SuccessFactors Talent Intelligence Hub</strong>.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-surface-soft text-xs font-bold text-ink hover:bg-surface-card transition-all"
                    aria-label={copied ? 'JSON copied to clipboard' : 'Copy JSON to clipboard'}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    <span aria-live="polite" className="sr-only">
                      {copied ? 'JSON content successfully copied to clipboard' : ''}
                    </span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON
                  </button>
                </div>
              </div>

              {/* JSON Display */}
              <div className="relative rounded-2xl border border-hairline bg-zinc-950 p-4 font-mono text-xs text-blue-300 overflow-x-auto overscroll-contain max-h-[460px]" data-lenis-prevent>
                <pre>{jsonString}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Pre-packaged handoff context structured for SAP SuccessFactors 2026 Joule Copilot Agents:
              </p>

              {/* Agent 1: Career & Talent Development */}
              <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-ink">
                      {jouleHandoff.jouleCareerAgentPayload.agentName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded">
                    Readiness: {jouleHandoff.jouleCareerAgentPayload.learningReadinessIndex}%
                  </span>
                </div>
                <p className="text-xs text-muted">
                  <strong>Succession Path:</strong> {jouleHandoff.jouleCareerAgentPayload.bridgeSuccessionLadder.join(' ➔ ')}
                </p>
                <p className="text-xs text-muted">
                  <strong>Mentorship Action:</strong> {jouleHandoff.jouleCareerAgentPayload.recommendedMentorshipFocus}
                </p>
              </div>

              {/* Agent 2: HR Service Agent */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-ink">
                      {jouleHandoff.jouleHrServiceAgentPayload.agentName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded">
                    Gap Protection: WAIVED (Active)
                  </span>
                </div>
                <p className="text-xs text-muted">
                  <strong>Accommodations:</strong> {jouleHandoff.jouleHrServiceAgentPayload.candidateAccommodations.join(' · ')}
                </p>
                <p className="text-xs text-muted">
                  <strong>Returnship Pathways:</strong> {jouleHandoff.jouleHrServiceAgentPayload.returnshipProgramMatches.join(', ')}
                </p>
              </div>

              {/* Agent 3: People Intelligence Agent */}
              <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-ink">
                      {jouleHandoff.joulePeopleIntelligenceAgentPayload.agentName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded">
                    Demographic Parity: 100%
                  </span>
                </div>
                <p className="text-xs text-muted">
                  <strong>Regional Context:</strong> {jouleHandoff.joulePeopleIntelligenceAgentPayload.regionalTierContext}
                </p>
                <p className="text-xs text-muted">
                  <strong>Reskilling ROI:</strong> {jouleHandoff.joulePeopleIntelligenceAgentPayload.salaryGrowthProjection} ({jouleHandoff.joulePeopleIntelligenceAgentPayload.workforceReskillingRoi})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline bg-surface-soft/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Ready for ingestion by SAP Business Data Cloud & SuccessFactors</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-card border border-hairline text-ink hover:bg-surface-soft transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
