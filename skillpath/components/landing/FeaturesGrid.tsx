'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Map, Building, Clock, Zap } from 'lucide-react';
import AsciiFire from '@/components/ui/ascii-fire';

const features = [
  { icon: <Brain className="w-6 h-6" />, title: 'Skills Discovery Agent', desc: 'Analyzes formal resumes & informal lived experience (caregiving, operations) using an adjacent skills knowledge graph. Surfaces ability, not pedigree.', accent: '#ff4d8b', num: '01' },
  { icon: <Target className="w-6 h-6" />, title: 'Market Intelligence Agent', desc: 'Monitors real-time skill demand, wage premiums, and emerging tier-2/3 Indian talent hubs to isolate high-value learning paths.', accent: '#2DD4BF', num: '02' },
  { icon: <Map className="w-6 h-6" />, title: 'Learning Pathway Agent', desc: 'Constructs adaptive week-by-week learning trajectories, stepped bridge-role ladders, and curated project milestones.', accent: '#b8a4ed', num: '03' },
  { icon: <Building className="w-6 h-6" />, title: 'Inclusive Matching Agent', desc: 'Matches candidates factoring accessibility (PwD), remote-first flexibility, and actively de-prioritizes institution brand names & gap lengths.', accent: '#e8b94a', num: '04' },
  { icon: <Clock className="w-6 h-6" />, title: 'Employer Readiness Agent', desc: 'Audits employer job descriptions for exclusionary jargon (rockstar, unbroken tenure) and surfaces HR accommodation action items.', accent: '#ff6b5a', num: '05' },
  { icon: <Zap className="w-6 h-6" />, title: 'Bias Audit Governance Agent', desc: 'A continuous governance layer monitoring demographic parity and issuing certified 10-dimension fairness audit scorecards.', accent: '#a4d4c5', num: '06' },
];

export function FeaturesGrid() {
  return (
    <section className="relative pt-16 pb-10 md:pt-24 md:pb-12 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
      {/* Background ASCII Flames rising from bottom behind cards */}
      <div className="absolute inset-x-0 bottom-0 h-[360px] sm:h-[420px] md:h-[500px] pointer-events-none z-0 opacity-90 select-none overflow-hidden">
        <AsciiFire
          intensity={140}
          thickness={4}
          embers={true}
          sparks={true}
          charset="classic"
          turbulence={40}
          decay={8}
        />
        {/* Soft edge masking for seamless top and bottom fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 80%, var(--color-canvas) 100%)',
          }}
        />
      </div>

      <div className="max-w-[1280px] w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1 w-10 rounded" style={{ background: '#2DD4BF' }} />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>Multi-Agent System</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-comico font-normal uppercase leading-[0.98] tracking-wide" style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', color: 'var(--color-ink)' }}>
              6 Autonomous Agents<br /><span style={{ color: '#2DD4BF' }}>collaborating for fairness.</span>
            </h2>
            <p className="font-zodiak text-[16px] max-w-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              A career orchestrator where each agent has a specialized role, clear boundaries, and explicit handoffs.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col p-7 md:p-8 relative z-10 overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              style={{ background: 'var(--color-surface-card)', border: '2px solid var(--bold-border)', borderRadius: '18px', boxShadow: `4px 4px 0 ${f.accent}` }}
            >
              <span className="absolute top-4 right-5 font-comico select-none pointer-events-none" style={{ fontSize: '72px', lineHeight: 1, color: f.accent, opacity: 0.1 }}>{f.num}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10" style={{ background: f.accent, border: '2px solid var(--bold-border)', boxShadow: `3px 3px 0 var(--bold-border)`, color: '#fff' }}>
                {f.icon}
              </div>
              <h3 className="font-comico font-normal uppercase mb-3 leading-tight relative z-10" style={{ fontSize: '18px', color: 'var(--color-ink)', letterSpacing: '0.02em' }}>{f.title}</h3>
              <p className="font-zodiak text-[15px] leading-relaxed flex-1 relative z-10" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
              <div className="mt-6 h-1 rounded-full" style={{ background: f.accent, width: '32px', opacity: 0.6 }} />
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}
