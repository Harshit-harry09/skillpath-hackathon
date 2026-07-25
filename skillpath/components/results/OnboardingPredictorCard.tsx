'use client';

import React from 'react';
import { Calendar, Target, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingPredictorCardProps {
  roleLabel: string;
}

export function OnboardingPredictorCard({ roleLabel }: OnboardingPredictorCardProps) {
  const milestones = [
    {
      period: 'First 30 Days',
      focus: 'System Ramp & Architecture',
      deliverables: [
        'Complete local environment setup and codebase walkthrough',
        'Ship first 2 production bug fixes or micro-features',
        'Audit database schemas & core API endpoints'
      ]
    },
    {
      period: 'Day 30 – 60',
      focus: 'Autonomous Feature Delivery',
      deliverables: [
        'Own core feature implementation from design spec to deployment',
        'Write automated integration test suite for target service',
        'Participate actively in team PR reviews and sprint planning'
      ]
    },
    {
      period: 'Day 60 – 90',
      focus: 'System Optimization & Mentorship',
      deliverables: [
        'Identify and resolve P99 latency bottleneck in core service',
        'Document developer setup guide for upcoming team hires',
        'Lead technical proposal (RFC) for next sprint architectural goal'
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">
            <Calendar size={20} />
          </span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
            30-60-90 Day Onboarding Roadmap
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
          Hiring Manager Blueprint
        </span>
      </div>

      <div className="space-y-6">
        {milestones.map((m) => (
          <div key={m.period} className="p-5 rounded-xl bg-canvas border border-hairline">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-body-md text-ink">{m.period}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-bold uppercase">
                {m.focus}
              </span>
            </div>
            <ul className="space-y-2">
              {m.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-body-xs text-muted">
                  <CheckCircle2 size={14} className="text-brand-teal shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
