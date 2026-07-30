// components/SkillTrackRow.tsx
'use client';

import { useState } from 'react';
import { Check, Loader2, Zap, Circle, CircleDot } from 'lucide-react';
import type { TrackedSkill, SkillState } from '@/types/active-job';

interface SkillTrackRowProps {
  skill: TrackedSkill;
  accentColor: string;
  onStateChange: (skill: string, state: SkillState) => Promise<void>;
}

const stateConfig = {
  not_started: {
    icon: Circle,
    label: 'Not started',
    classes: 'text-muted border-hairline bg-transparent hover:border-muted/50',
  },
  in_progress: {
    icon: CircleDot,
    label: 'In progress',
    classes: 'text-primary border-primary/30 bg-primary/5',
  },
  learned: {
    icon: Check,
    label: 'Learned',
    classes: 'text-brand-teal border-brand-teal/30 bg-brand-teal/10',
  },
};

const nextState: Record<SkillState, SkillState> = {
  not_started: 'in_progress',
  in_progress: 'learned',
  learned:     'not_started',
};

export function SkillTrackRow({ skill, accentColor, onStateChange }: SkillTrackRowProps) {
  const [loading, setLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<SkillState | null>(null);
  const currentSkillState = optimisticState ?? skill.state;
  const cfg = stateConfig[currentSkillState];
  const Icon = cfg.icon;

  const handleToggle = async () => {
    if (loading) return;
    const targetState = nextState[currentSkillState];
    setOptimisticState(targetState);
    setLoading(true);
    try {
      await onStateChange(skill.skill, targetState);
    } catch (error) {
      console.error("Failed to update skill state:", error);
      setOptimisticState(null); // Rollback on failure
    } finally {
      setLoading(false);
      setOptimisticState(null);
    }
  };

  return (
    <div className={[
      'flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all duration-200',
      currentSkillState === 'learned' ? 'bg-brand-teal/5 border-brand-teal/15' : 'bg-surface-card border-hairline',
    ].join(' ')}>

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={[
          'shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200',
          cfg.classes,
        ].join(' ')}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" />
          : <Icon size={13} className={currentSkillState === 'learned' ? 'stroke-[2.5]' : ''} />
        }
      </button>

      {/* Skill name */}
      <div className="flex-1 min-w-0">
        <span className={[
          'font-sans text-body-sm font-semibold block truncate transition-colors',
          currentSkillState === 'learned' ? 'line-through text-muted' : 'text-ink',
        ].join(' ')}>
          {skill.skill}
        </span>
        <span className="font-sans text-[10px] text-muted uppercase tracking-widest">
          {cfg.label} · {skill.weeks_to_learn}w
        </span>
      </div>

      {/* MVC badge + priority */}
      <div className="flex items-center gap-2 shrink-0">
        {skill.in_mvc && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[9px] text-brand-teal font-bold tracking-widest uppercase">
            <Zap size={8} className="fill-current" />
            MVC
          </span>
        )}
        <div className="flex gap-[3px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: i < (6 - skill.priority) ? accentColor : 'var(--color-surface-strong)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
