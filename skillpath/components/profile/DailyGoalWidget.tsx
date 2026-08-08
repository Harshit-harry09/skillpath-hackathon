// components/profile/DailyGoalWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy } from 'lucide-react';

interface DailyGoalWidgetProps {
  streakCount: number;
  lastDate: string;
}

const DAILY_TARGET = 3;
const STORAGE_KEY  = 'daily_ticks';

export function DailyGoalWidget({ streakCount, lastDate }: DailyGoalWidgetProps) {
  const [todayTicks, setTodayTicks] = useState(0);

  const loadTicks = () => {
    const today   = new Date().toISOString().split('T')[0];
    const stored  = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setTodayTicks(0);
      return;
    }
    const parsed  = JSON.parse(stored);
    if (parsed.date === today) {
      setTodayTicks(parsed.count);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setTodayTicks(0);
    }
  };

  useEffect(() => {
    loadTicks();
    const handleCustomEvent = () => loadTicks();
    window.addEventListener('daily_tick', handleCustomEvent);
    return () => window.removeEventListener('daily_tick', handleCustomEvent);
  }, []);

  const pct         = Math.min(1, todayTicks / DAILY_TARGET);
  const done        = todayTicks >= DAILY_TARGET;
  const streakAlive = lastDate === new Date().toISOString().split('T')[0];

  return (
    <div className={[
      'relative rounded-[32px] border overflow-hidden px-8 py-7 transition-all duration-500 shadow-sm',
      done
        ? 'border-brand-teal/30 bg-brand-teal/5 shadow-[0_8px_32px_rgba(26,188,156,0.08)]'
        : 'border-hairline bg-surface-card',
    ].join(' ')}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        {done ? <Trophy size={120} /> : <Star size={120} />}
      </div>

      {/* Top row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Star size={14} className={done ? 'text-brand-teal fill-current' : 'text-muted'} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              Focus Protocol
            </span>
          </div>
          <p className="font-display text-title-md text-ink tracking-tight">
            {done ? 'Daily objective achieved' : `Master ${DAILY_TARGET} units today`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-soft border border-hairline shadow-inner">
          <Flame size={15} className={streakAlive ? 'text-brand-pink fill-current' : 'text-muted'} />
          <span className="font-mono text-[16px] font-bold text-ink">{streakCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-surface-strong overflow-hidden mb-5 relative z-10 p-0.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: done ? 'var(--color-brand-teal)' : 'var(--color-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
        />
      </div>

      {/* Tick indicators */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {Array.from({ length: DAILY_TARGET }).map((_, i) => (
            <div
              key={i}
              className={[
                'w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm',
                i < todayTicks 
                  ? 'bg-brand-teal scale-110' 
                  : 'bg-surface-strong',
              ].join(' ')}
            />
          ))}
        </div>
        <span className="font-mono text-[12px] text-muted font-bold ml-2">
          {todayTicks} <span className="opacity-40">/</span> {DAILY_TARGET}
        </span>
        
        {streakCount > 0 && !streakAlive && (
          <motion.span 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto font-sans text-[10px] text-brand-pink font-bold uppercase tracking-widest animate-pulse"
          >
            Action required: Maintain streak
          </motion.span>
        )}
        {done && (
          <span className="ml-auto font-sans text-[10px] text-brand-teal font-bold uppercase tracking-widest">
            Protocol complete
          </span>
        )}
      </div>
    </div>
  );
}

export function incrementDailyTick() {
  if (typeof window === 'undefined') return 0;
  const today  = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STORAGE_KEY);
  const parsed = stored ? JSON.parse(stored) : { date: today, count: 0 };
  const count  = parsed.date === today ? parsed.count + 1 : 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
  window.dispatchEvent(new Event('daily_tick'));
  return count;
}
