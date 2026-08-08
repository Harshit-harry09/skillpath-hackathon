'use client';
// updated

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, CheckCircle, ChevronRight, Info, AlertCircle } from 'lucide-react';
import type { AnalysisResult } from '@/types/analysis';

interface RecruiterRedFlagRadarProps {
  data: AnalysisResult;
}

export interface RedFlagItem {
  id: string;
  category: 'career_gap' | 'missing_metrics' | 'formatting' | 'passive_voice' | 'seniority_mismatch';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export function RecruiterRedFlagRadar({ data }: RecruiterRedFlagRadarProps) {
  const [selectedFlag, setSelectedFlag] = useState<RedFlagItem | null>(null);

  // Derive flags exclusively from real backend audit fields
  const { redFlags, riskScore, riskLevel, gaugeColor } = useMemo(() => {
    const flags: RedFlagItem[] = [];

    // 1. Real fraud/formatting flags from the ATS fraud detector
    const fraudAudit = data.fraud_audit;
    if (fraudAudit) {
      if (fraudAudit.hidden_text_detected) {
        flags.push({
          id: 'rf-hidden-text',
          category: 'formatting',
          severity: 'high',
          title: 'Hidden Text Detected in Resume',
          description: 'White text or zero-opacity text was found in the PDF. ATS systems flag this as keyword stuffing, which triggers automatic rejection at most enterprise applicant tracking systems.',
          recommendation: 'Remove all hidden text layers from your PDF. Rebuild the resume from scratch in a single-column Word document or Google Docs.',
        });
      }

      if (fraudAudit.keyword_stuffing_score > 0.6) {
        flags.push({
          id: 'rf-keyword-stuffing',
          category: 'formatting',
          severity: 'high',
          title: `High Keyword Stuffing Score (${Math.round(fraudAudit.keyword_stuffing_score * 100)}%)`,
          description: 'Your resume appears to contain an unusually dense repetition of keywords relative to its natural text length, which ATS fraud detectors flag.',
          recommendation: 'Reduce keyword repetition. Each skill should appear organically in context, not listed multiple times in a hidden section.',
        });
      }

      for (const issue of fraudAudit.formatting_issues.slice(0, 2)) {
        flags.push({
          id: `rf-fmt-${flags.length}`,
          category: 'formatting',
          severity: 'medium',
          title: 'Formatting Issue Detected',
          description: issue,
          recommendation: 'Reformat using a clean ATS-safe template: single column, standard section headers, no tables or text boxes.',
        });
      }

      for (const flagText of fraudAudit.fraud_flags.slice(0, 1)) {
        flags.push({
          id: `rf-fraud-${flags.length}`,
          category: 'formatting',
          severity: 'high',
          title: 'Potential Fraud Flag',
          description: flagText,
          recommendation: 'Review and correct the flagged section. Recruiters are trained to spot fabricated or inflated credentials.',
        });
      }
    }

    // 2. Career gaps from real experience analysis
    const expAnalysis = data.experience_analysis;
    if (expAnalysis) {
      const longGaps = (expAnalysis.employment_gaps || []).filter((g) => g.months >= 4);
      if (longGaps.length > 0) {
        const longest = longGaps.reduce((a, b) => (a.months > b.months ? a : b));
        flags.push({
          id: 'rf-career-gap',
          category: 'career_gap',
          severity: longest.months >= 8 ? 'high' : 'medium',
          title: `${longest.months}-Month Employment Gap Detected`,
          description: `A ${longest.months}-month gap (${longest.start} – ${longest.end}) was detected in your work history. Unexplained gaps trigger manual recruiter review holds.`,
          recommendation: 'Add a brief explanation in your resume (freelance projects, upskilling, caregiving). Use exact month/year dates to reduce ambiguity.',
        });
      }

      if (expAnalysis.career_progression === 'flat') {
        flags.push({
          id: 'rf-flat-career',
          category: 'seniority_mismatch',
          severity: 'medium',
          title: 'Flat Career Progression Detected',
          description: 'Your work history shows similar titles across multiple roles without visible growth in seniority or scope, which may signal stagnation to a recruiter.',
          recommendation: 'Emphasize expanding scope in each role — team size grown, budget owned, system scale increased. Reframe titles if they underrepresent your actual responsibilities.',
        });
      }
    }

    // 3. Missing contact fields from real contact info
    const contact = data.contact_info;
    if (contact) {
      const missingFields: string[] = [];
      if (!contact.linkedin_url) missingFields.push('LinkedIn URL');
      if (!contact.email) missingFields.push('Email');
      if (!contact.github_url && (data.role_category?.includes('engineer') || data.role_category?.includes('developer'))) {
        missingFields.push('GitHub URL');
      }
      if (missingFields.length > 0) {
        flags.push({
          id: 'rf-missing-contact',
          category: 'formatting',
          severity: missingFields.includes('Email') ? 'high' : 'low',
          title: `Missing Contact Fields: ${missingFields.join(', ')}`,
          description: `The following contact fields were not found in your resume header: ${missingFields.join(', ')}. Recruiters expect these to be immediately visible.`,
          recommendation: `Add ${missingFields.join(' and ')} to your resume header section.`,
        });
      }
    }

    // 4. Missing must-have skills gap (from real skill data)
    const gaps = data.skill_gaps || [];
    const missingMustHaves = gaps.filter((g) => g.importance === 'must_have');
    if (missingMustHaves.length >= 2) {
      flags.push({
        id: 'rf-musthave',
        category: 'seniority_mismatch',
        severity: 'high',
        title: `Missing ${missingMustHaves.length} Core "Must-Have" Competencies`,
        description: `The job posting explicitly requires ${missingMustHaves.slice(0, 2).map((m) => m.skill).join(' and ')}, which are absent or unproven in your resume.`,
        recommendation: `Add verifiable project experience or explicit coursework highlighting ${missingMustHaves[0]?.skill || 'core requirements'}.`,
      });
    }

    // Take top 3 most severe flags
    const sorted = [...flags].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
    const topFlags = sorted.slice(0, 3);

    // Calculate composite rejection risk score
    if (topFlags.length === 0) {
      return {
        redFlags: [],
        riskScore: 0,
        riskLevel: 'Low Risk' as const,
        gaugeColor: '#10B981',
      };
    }

    const highCount = topFlags.filter((f) => f.severity === 'high').length;
    const medCount = topFlags.filter((f) => f.severity === 'medium').length;
    const score = Math.min(85, Math.max(12, highCount * 28 + medCount * 14 + 10));

    let level: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
    let color = '#10B981';
    if (score >= 60) { level = 'High Risk'; color = '#EF4444'; }
    else if (score >= 35) { level = 'Moderate Risk'; color = '#F59E0B'; }

    return { redFlags: topFlags, riskScore: score, riskLevel: level, gaugeColor: color };
  }, [data]);

  const radius = 65;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  // No real flags detected
  if (redFlags.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Recruiter Simulation Audit
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-text-primary">No Recruiter Red Flags Detected</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {data.fraud_audit
                ? 'Your resume passed fraud detection, formatting checks, and contact field verification.'
                : 'Complete the analysis with AI enrichment enabled for a full recruiter simulation audit.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        {/* Left: Interactive Semi-Circle Gauge */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-soft/60 p-4 lg:w-64 border border-border-subtle">
          <div className="relative flex h-32 w-48 items-end justify-center overflow-hidden">
            <svg className="h-36 w-48" viewBox="0 0 160 90">
              <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
              <motion.path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center text-center">
              <span className="text-2xl font-extrabold tracking-tight text-text-primary">{riskScore}%</span>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-text-muted">Rejection Risk</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: gaugeColor, backgroundColor: `${gaugeColor}15` }}>
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{riskLevel}</span>
          </div>
        </div>

        {/* Right: Red Flags List */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Recruiter Simulation Audit
            </span>
            <span className="text-xs text-text-muted">Derived from real resume analysis</span>
          </div>

          <h3 className="mt-1 text-lg font-bold text-text-primary">
            Top {redFlags.length} Rejection Risk Factor{redFlags.length > 1 ? 's' : ''}
          </h3>

          <div className="mt-3.5 flex flex-col gap-2.5">
            {redFlags.map((flag, index) => (
              <motion.div
                key={flag.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedFlag(flag)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle bg-surface-soft/80 p-3 transition-all hover:border-amber-500/40 hover:bg-surface-soft"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    flag.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    flag.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-amber-300 transition-colors">
                        {flag.title}
                      </h4>
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        flag.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                        flag.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {flag.severity} Severity
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-text-subtle line-clamp-1">
                      {flag.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted group-hover:text-amber-400 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Red Flag Fix Drawer/Modal */}
      <AnimatePresence>
        {selectedFlag && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedFlag(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-surface-card p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">{selectedFlag.title}</h4>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Recruiter Friction Analysis</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-hairline bg-surface-soft p-3.5 text-xs text-muted">
                <span className="font-semibold text-ink">Why recruiters reject:</span>
                <p className="mt-1">{selectedFlag.description}</p>
              </div>

              <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-300 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Actionable Fix:</span>
                </div>
                <p className="mt-1 font-medium">{selectedFlag.recommendation}</p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedFlag(null)}
                  className="rounded-xl border border-border-subtle bg-surface-soft px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-card transition-colors"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
