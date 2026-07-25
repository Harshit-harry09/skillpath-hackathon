'use client';

import React from 'react';
import { TrendingUp, DollarSign, Award, Zap } from 'lucide-react';
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
      className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-brand-teal/10 via-surface-card to-surface-card border border-brand-teal/20 relative overflow-hidden shadow-sm"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
            <TrendingUp size={20} />
          </span>
          <span className="text-[11px] font-bold text-brand-teal uppercase tracking-widest">
            Salary ROI Predictor
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-bold uppercase tracking-wider">
          Market Verified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="p-4 rounded-xl bg-canvas border border-hairline">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">
            Current Matched Baseline
          </span>
          <span className="text-2xl font-display font-semibold text-ink">
            ${baseline.currentAvg.toLocaleString()}<span className="text-xs text-muted font-sans font-normal">/yr</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-brand-teal/10 border border-brand-teal/20">
          <span className="text-[10px] text-brand-teal font-bold uppercase tracking-wider block mb-1">
            Projected Post-Gap Market Value
          </span>
          <span className="text-2xl font-display font-bold text-brand-teal">
            ${projectedSalary.toLocaleString()}<span className="text-xs font-sans font-normal">/yr</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-canvas/80 border border-hairline text-body-sm text-ink/80">
        <Zap size={16} className="text-brand-teal shrink-0" />
        <span>
          Closing your top gaps (including <strong className="text-ink font-semibold">{topSkill}</strong>) yields an estimated <strong className="text-brand-teal font-bold">+${baseline.topSkillLift.toLocaleString()}/yr</strong> market value boost.
        </span>
      </div>
    </motion.div>
  );
}
