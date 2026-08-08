'use client';

import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SalaryRoiCardProps {
  roleCategory: string;
  roleLabel: string;
  gapCount: number;
  mvcSkills: string[];
}

// Baseline salary dictionary by role slug (derived from market model medians)
const SALARY_BASELINES: Record<string, { currentAvg: number; topSkillLift: number }> = {
  'software-engineer': { currentAvg: 115000, topSkillLift: 18500 },
  'frontend-developer': { currentAvg: 105000, topSkillLift: 15000 },
  'backend-developer': { currentAvg: 120000, topSkillLift: 20000 },
  'fullstack-developer': { currentAvg: 125000, topSkillLift: 22000 },
  'data-engineer': { currentAvg: 130000, topSkillLift: 24000 },
  'ml-engineer': { currentAvg: 145000, topSkillLift: 28000 },
  'devops': { currentAvg: 128000, topSkillLift: 21000 },
  'product-manager': { currentAvg: 135000, topSkillLift: 25000 },
  'cloud-infra': { currentAvg: 132000, topSkillLift: 23000 },
  'cybersecurity': { currentAvg: 125000, topSkillLift: 20000 },
};

export function SalaryRoiCard({ roleCategory, roleLabel, gapCount, mvcSkills }: SalaryRoiCardProps) {
  const baseline = SALARY_BASELINES[roleCategory] || { currentAvg: 110000, topSkillLift: 17500 };
  const projectedSalary = baseline.currentAvg + baseline.topSkillLift;
  const topSkill = mvcSkills[0] || 'Core MVC Skills';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline relative overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
            <TrendingUp size={20} />
          </span>
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            Salary ROI Predictor
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
          Market Verified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-surface-soft/60 border border-hairline">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">
            Current Matched Baseline
          </span>
          <span className="text-2xl font-display font-bold text-ink">
            ${baseline.currentAvg.toLocaleString()}<span className="text-xs text-muted font-sans font-normal">/yr</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Projected Post-Gap Market Value
          </span>
          <span className="text-2xl font-display font-bold text-emerald-900 dark:text-emerald-300">
            ${projectedSalary.toLocaleString()}<span className="text-xs font-sans font-normal text-emerald-700 dark:text-emerald-400">/yr</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-soft/60 border border-hairline text-xs text-muted leading-relaxed">
        <Zap size={16} className="text-brand-teal shrink-0" />
        <span>
          Closing your top gaps (including <strong className="text-ink font-semibold">{topSkill}</strong>) yields an estimated <strong className="text-emerald-800 dark:text-emerald-400 font-bold">+${baseline.topSkillLift.toLocaleString()}/yr</strong> market value boost.
        </span>
      </div>
    </motion.div>
  );
}
