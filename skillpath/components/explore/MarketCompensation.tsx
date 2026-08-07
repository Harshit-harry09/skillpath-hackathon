'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface SalaryRange {
  entry?: string;
  mid?: string;
  senior?: string;
  currency?: string;
}

interface MarketCompensationProps {
  roleName: string;
  salaryRange?: SalaryRange;
}

export default function MarketCompensation({ roleName, salaryRange }: MarketCompensationProps) {
  const currency = salaryRange?.currency || 'USD';
  const entry = salaryRange?.entry || '$65,000';
  const mid = salaryRange?.mid || '$105,000';
  const senior = salaryRange?.senior || '$155,000';

  const tiers = [
    {
      title: 'Entry / Junior',
      amount: entry,
      pct: '45%',
      badge: '0–2 Yrs Experience',
      color: 'from-teal-500/20 to-teal-500/30 border-teal-500/30 text-teal-400',
      barColor: 'bg-brand-teal',
    },
    {
      title: 'Mid-Level',
      amount: mid,
      pct: '72%',
      badge: '2–5 Yrs Experience',
      color: 'from-indigo-500/20 to-indigo-600/30 border-indigo-500/30 text-indigo-400',
      barColor: 'bg-indigo-500',
      recommended: true,
    },
    {
      title: 'Senior / Lead',
      amount: senior,
      pct: '95%',
      badge: '5+ Yrs Experience',
      color: 'from-pink-500/20 to-pink-500/30 border-pink-500/30 text-brand-pink',
      barColor: 'bg-brand-pink',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-brand-teal">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-ink">Market Compensation Matrix</h3>
          <p className="font-sans text-xs text-muted">Calibrated annual compensation bounds for {roleName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className={`relative p-6 rounded-[24px] bg-surface-card border border-hairline shadow-sm overflow-hidden group hover:border-teal-500/40 transition-all ${
              tier.recommended ? 'ring-1 ring-teal-500/30 shadow-[0_0_25px_rgba(45,212,191,0.08)]' : ''
            }`}
          >
            {/* Top gradient glow */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tier.color}`} />

            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                {tier.title}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border bg-canvas ${tier.color}`}>
                {tier.badge}
              </span>
            </div>

            <div className="mb-6">
              <div className="font-display text-3xl md:text-4xl text-ink font-bold tracking-tight mb-1">
                {tier.amount}
              </div>
              <span className="text-[11px] font-mono text-muted uppercase">Base Salary ({currency})</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2 bg-hairline rounded-full overflow-hidden relative mb-2">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: tier.pct }}
                transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                className={`h-full rounded-full ${tier.barColor}`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-muted">
              <span>Market Floor</span>
              <span>Benchmark Tier</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
