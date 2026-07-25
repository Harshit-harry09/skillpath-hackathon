'use client';

import { motion } from 'framer-motion';

interface MarketMomentum {
  growth_pct?: string;
  trend_status?: string;
  demand_insight?: string;
}

interface ExploreData {
  total_weeks: number;
  market_momentum?: MarketMomentum;
  skill_map: {
    categories: Record<string, any[]>;
    most_demanded_skill: string;
    fastest_growing_skill: string;
  };
}

export default function ExploreStats({ data }: { data: ExploreData }) {
  const totalSkills = Object.values(data.skill_map.categories).reduce((acc, cat) => acc + cat.length, 0);
  const momentum = data.market_momentum || { growth_pct: '+24% YoY', trend_status: 'High Demand' };

  const stats = [
    { label: 'Market Momentum', value: momentum.growth_pct || '+24% YoY', detail: momentum.trend_status || 'High Demand', isMomentum: true },
    { label: 'Time from zero', value: `${data.total_weeks} weeks`, detail: 'at 1hr / day' },
    { label: 'Skills to master', value: totalSkills.toString(), detail: 'curated for this role' },
    { label: 'Most in demand', value: data.skill_map.most_demanded_skill, detail: 'found in 90%+ JDs' },
    { label: 'Fastest growing', value: data.skill_map.fastest_growing_skill, detail: 'increasing market value' },
  ];

  return (
    <div className="my-16">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-y border-hairline">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex flex-col"
          >
            <span className="font-sans font-bold text-[10px] text-muted uppercase tracking-[0.2em] mb-3">{stat.label}</span>
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-display text-display-sm text-ink ${stat.isMomentum ? 'text-teal-400 font-extrabold' : ''}`}>{stat.value}</span>
              {stat.isMomentum && (
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
              )}
            </div>
            <span className="font-sans font-semibold text-[11px] text-brand-teal uppercase tracking-wider">{stat.detail}</span>
          </motion.div>
        ))}
      </div>
      {data.market_momentum?.demand_insight && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs font-sans text-muted text-center italic mt-4"
        >
          💡 {data.market_momentum.demand_insight}
        </motion.p>
      )}
    </div>
  );
}
