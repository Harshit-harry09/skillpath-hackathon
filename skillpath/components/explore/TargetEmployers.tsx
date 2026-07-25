'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Flame, CheckCircle2 } from 'lucide-react';

interface Employer {
  name: string;
  category: string;
  hiring_volume?: 'Very High' | 'High' | 'Active' | string;
}

interface TargetEmployersProps {
  roleName: string;
  employers?: Employer[];
}

export default function TargetEmployers({ roleName, employers }: TargetEmployersProps) {
  const defaultEmployers: Employer[] = [
    { name: 'Top Industry Leaders', category: 'Sector Standard', hiring_volume: 'Very High' },
    { name: 'Growth Scaleups', category: 'High Growth', hiring_volume: 'High' },
    { name: 'Global Enterprises', category: 'Enterprise', hiring_volume: 'Active' },
    { name: 'Specialized Agencies', category: 'Specialized', hiring_volume: 'Active' },
  ];

  const list = employers && employers.length > 0 ? employers : defaultEmployers;

  const volumeColor = (volume?: string) => {
    switch (volume) {
      case 'Very High':
        return 'text-brand-pink border-brand-pink/30 bg-brand-pink/10';
      case 'High':
        return 'text-brand-teal border-teal-500/30 bg-teal-500/10';
      default:
        return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-brand-pink">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-ink">Top Target Employers</h3>
          <p className="font-sans text-xs text-muted">Primary hiring sectors & organizations recruiting for {roleName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {list.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            viewport={{ once: true }}
            className="p-5 rounded-[22px] bg-surface-card border border-hairline shadow-sm flex flex-col justify-between hover:border-brand-pink/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">
                  {item.category}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${volumeColor(item.hiring_volume)} flex items-center gap-1`}>
                  <Flame className="w-2.5 h-2.5" />
                  {item.hiring_volume || 'Active'}
                </span>
              </div>
              <h4 className="font-sans font-bold text-base text-ink group-hover:text-brand-pink transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="mt-4 pt-3 border-t border-hairline flex items-center gap-1.5 text-[11px] font-mono text-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
              <span>Verified Hiring Demand</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
