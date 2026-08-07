'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Compass, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: '01', title: 'Analyze',
    desc: 'Our engine ingests your target role and current experience, parsing them into high-dimensional skill vectors with market context.',
    icon: <FileText className="w-7 h-7" />, accent: '#ff4d8b',
  },
  {
    num: '02', title: 'Score',
    desc: 'We calculate the delta between where you are and where you need to be — ranking missing skills by real market demand and salary impact.',
    icon: <Cpu className="w-7 h-7" />, accent: '#2DD4BF',
  },
  {
    num: '03', title: 'Execute',
    desc: 'Receive a deterministic, week-by-week roadmap to bridge the gap. No guesswork, no fluff — just pure execution.',
    icon: <Compass className="w-7 h-7" />, accent: '#b8a4ed',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 md:py-28 px-4 sm:px-8 lg:px-24 flex justify-center" style={{ background: 'var(--color-surface-soft)' }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />

      <div className="max-w-[1280px] w-full">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 md:mb-20">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-1 w-16 rounded" style={{ background: 'var(--color-brand-pink)', borderRadius: '2px' }} />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>The Methodology</span>
          </div>
          <h2 className="font-black leading-[0.95] tracking-tighter" style={{ fontSize: 'clamp(40px, 6vw, 72px)', color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
            A deterministic path<br />
            <span style={{ color: 'var(--color-brand-pink)' }}>to your dream role.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          <div className="absolute top-[72px] left-[16.66%] right-[16.66%] h-[3px] hidden md:block pointer-events-none" style={{ background: 'var(--bold-border)', zIndex: 0 }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col"
              style={{ padding: i === 1 ? '0 24px' : '0' }}
            >
              <div
                className="flex-1 flex flex-col p-8 md:p-10"
                style={{
                  background: 'var(--color-surface-card)',
                  border: '3px solid var(--bold-border)',
                  borderRadius: '20px',
                  boxShadow: `6px 6px 0 ${step.accent}`,
                  marginBottom: i < steps.length - 1 ? '24px' : '0',
                }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: step.accent, border: '3px solid var(--bold-border)', boxShadow: '4px 4px 0 var(--bold-border)', color: 'white' }}
                  >
                    {step.icon}
                  </div>
                  <span className="font-black leading-none select-none" style={{ fontSize: '80px', letterSpacing: '-0.05em', color: step.accent, opacity: 0.18, lineHeight: 1 }}>
                    {step.num}
                  </span>
                </div>

                <h3 className="font-black mb-4" style={{ fontSize: '28px', color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{step.title}</h3>
                <p className="font-medium text-[15px] leading-relaxed flex-1" style={{ color: 'var(--color-muted)' }}>{step.desc}</p>

                <div className="mt-8 pt-5 flex items-center gap-2" style={{ borderTop: '2px solid var(--color-hairline)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: step.accent }} />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: step.accent }}>Step {step.num}</span>
                  {i < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-auto" style={{ color: step.accent, opacity: 0.5 }} />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />
    </section>
  );
}
