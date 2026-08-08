// components/profile/StatsBar.tsx
'use client';

import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Target, Clock } from 'lucide-react';
import type { ProfileStats } from '@/types/profile';

interface StatsBarProps {
  stats: ProfileStats;
  accentColor?: string;
}

export function StatsBar({ stats, accentColor = 'var(--color-brand-teal)' }: StatsBarProps) {
  const items = [
    {
      icon:  CheckCircle2,
      value: stats.skills_learned,
      label: 'Learned',
      color: 'text-brand-teal',
    },
    {
      icon:  Flame,
      value: stats.streak_count,
      label: 'Streak',
      color: 'text-brand-pink',
      suffix: stats.streak_count > 0 ? '🔥' : '',
    },
    {
      icon:  Target,
      value: `${stats.market_fit}%`,
      label: 'Readiness',
      color: 'text-primary',
    },
    {
      icon:  Clock,
      value: `~${stats.weeks_remaining}w`,
      label: 'Remaining',
      color: 'text-brand-ochre',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
          className="flex flex-col gap-2 px-6 py-5 rounded-[24px] border border-hairline bg-surface-card shadow-sm hover:shadow-md transition-shadow cursor-default group"
        >
          <div className="flex items-center justify-between">
            <item.icon size={16} className={`${item.color} transition-transform group-hover:scale-110`} />
            <div className="w-1.5 h-1.5 rounded-full bg-hairline" />
          </div>
          <div className="mt-2">
            <span className="font-mono text-[32px] font-bold text-ink leading-none tracking-tighter block">
              {item.value}{item.suffix}
            </span>
            <span className="font-sans text-[10px] text-muted uppercase tracking-[0.2em] font-bold mt-1 block">
              {item.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
