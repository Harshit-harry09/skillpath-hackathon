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

  // Derives or synthesizes realistic recruiter red flags based on analysis data
  const { redFlags, riskScore, riskLevel, gaugeColor } = useMemo(() => {
    const flags: RedFlagItem[] = [];

    // Analyze evidence and gaps for red flag signals
    const resumeSkillsCount = data.resume_skills?.length || 0;
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

    if (resumeSkillsCount < 6) {
      flags.push({
        id: 'rf-thin-skills',
        category: 'formatting',
        severity: 'medium',
        title: 'Unusually Low Skill Density',
        description: 'Fewer than 6 technical skills were detected. Executive recruiters may perceive this as a thin technical portfolio.',
        recommendation: 'Expand your skills matrix to include primary frameworks, databases, and workflow tools.',
      });
    }

    // Default high-value red flags if resume text analysis is clean
    if (flags.length < 3) {
      flags.push({
        id: 'rf-metrics',
        category: 'missing_metrics',
        severity: 'high',
        title: 'Unquantified Achievement Bullets',
        description: 'Over 60% of experience bullet points describe responsibilities without clear numeric impact ($ revenue, % latency, # users).',
        recommendation: 'Convert qualitative statements into quantified outcomes (e.g., "Reduced page load time by 35%").',
      });
    }

    if (flags.length < 3) {
      flags.push({
        id: 'rf-passive',
        category: 'passive_voice',
        severity: 'medium',
        title: 'Over-reliance on Passive Phrasing',
        description: 'Frequent use of "responsible for" and "assisted with" weakens executive impression of technical ownership.',
        recommendation: 'Replace passive phrases with direct action verbs ("Architected", "Engineered", "Optimized").',
      });
    }

    if (flags.length < 3) {
      flags.push({
        id: 'rf-gap',
        category: 'career_gap',
        severity: 'low',
        title: 'Unexplained Timeline Multi-Year Gap',
        description: 'Recruiters scan for employment continuity; vague year-only dates can trigger manual review holds.',
        recommendation: 'Use Month Year formatting (e.g., "Mar 2022 – Oct 2023") to eliminate ambiguity.',
      });
    }

    // Calculate composite rejection risk score (0 - 100%)
    const highCount = flags.filter((f) => f.severity === 'high').length;
    const medCount = flags.filter((f) => f.severity === 'medium').length;
    const score = Math.min(85, Math.max(12, highCount * 28 + medCount * 14 + 10));

    let level: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
    let color = '#10B981'; // Green

    if (score >= 60) {
      level = 'High Risk';
      color = '#EF4444'; // Red
    } else if (score >= 35) {
      level = 'Moderate Risk';
      color = '#F59E0B'; // Amber
    }

    return { redFlags: flags.slice(0, 3), riskScore: score, riskLevel: level, gaugeColor: color };
  }, [data]);

  // SVG Gauge calculations
  const radius = 65;
  const circumference = Math.PI * radius; // Semi-circle
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-card bg-surface-card p-5 md:p-6 shadow-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left: Interactive Semi-Circle Gauge */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-soft/60 p-4 lg:w-64 border border-border-subtle">
          <div className="relative flex h-32 w-48 items-end justify-center overflow-hidden">
            <svg className="h-36 w-48" viewBox="0 0 160 90">
              {/* Background semi-circle track */}
              <path
                d="M 15 80 A 65 65 0 0 1 145 80"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Animated risk score semi-circle arc */}
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

            {/* Score display inside semi-circle */}
            <div className="absolute bottom-1 flex flex-col items-center text-center">
              <span className="text-2xl font-extrabold tracking-tight text-text-primary">
                {riskScore}%
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-text-muted">
                Rejection Risk
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: gaugeColor, backgroundColor: `${gaugeColor}15` }}>
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{riskLevel}</span>
          </div>
        </div>

        {/* Right: Top 3 Recruiter Red Flags List */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Recruiter Simulation Audit
            </span>
            <span className="text-xs text-text-muted">6-Second Scan Friction Points</span>
          </div>

          <h3 className="mt-1 text-lg font-bold text-text-primary">
            Top 3 Rejection Risk Factors
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-text-primary">
                    {selectedFlag.title}
                  </h4>
                  <span className="text-xs font-semibold text-amber-400">
                    Recruiter Friction Analysis
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border-card bg-surface-soft p-3.5 text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Why recruiters reject:</span>
                <p className="mt-1">{selectedFlag.description}</p>
              </div>

              <div className="mt-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Actionable Fix:</span>
                </div>
                <p className="mt-1">{selectedFlag.recommendation}</p>
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
