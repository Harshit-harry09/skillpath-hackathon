// components/results/SkillTrackRow.tsx
'use client';

import { useState } from 'react';
import { Check, Loader2, Zap, Circle, CircleDot, FileText, Save, Check as CheckIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackedSkill, SkillState } from '@/types/active-job';

interface SkillTrackRowProps {
  skill: TrackedSkill;
  accentColor: string;
  onStateChange: (skill: string, state: SkillState, note?: string) => Promise<void>;
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
    label: 'Completed',
    classes: 'text-brand-teal border-brand-teal/30 bg-brand-teal/10',
  },
};

export function SkillTrackRow({ skill, accentColor, onStateChange }: SkillTrackRowProps) {
  const [loading, setLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<SkillState | null>(null);
  const [showNoteBox, setShowNoteBox] = useState(Boolean(skill.note));
  const [noteText, setNoteText] = useState(skill.note || '');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const currentSkillState = optimisticState ?? skill.state;
  const cfg = stateConfig[currentSkillState];

  const handleStateSelect = async (targetState: SkillState) => {
    if (loading || targetState === currentSkillState) return;
    setOptimisticState(targetState);
    setLoading(true);
    try {
      await onStateChange(skill.skill, targetState, noteText);
    } catch (error) {
      console.error("Failed to update skill state:", error);
      setOptimisticState(null);
    } finally {
      setLoading(false);
      setOptimisticState(null);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await onStateChange(skill.skill, currentSkillState, noteText);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className={[
      'rounded-xl border transition-all duration-200 p-4 space-y-3',
      currentSkillState === 'learned' ? 'bg-brand-teal/5 border-brand-teal/15' : 'bg-surface-card border-hairline',
    ].join(' ')}>
      <div className="flex items-center gap-4">
        {/* State options pill */}
        <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-hairline shrink-0">
          <button
            onClick={() => handleStateSelect('not_started')}
            disabled={loading}
            className={[
              'px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
              currentSkillState === 'not_started' ? 'bg-muted/20 text-ink' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            NS
          </button>
          <button
            onClick={() => handleStateSelect('in_progress')}
            disabled={loading}
            className={[
              'px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
              currentSkillState === 'in_progress' ? 'bg-primary text-on-primary' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            IP
          </button>
          <button
            onClick={() => handleStateSelect('learned')}
            disabled={loading}
            className={[
              'px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
              currentSkillState === 'learned' ? 'bg-brand-teal text-on-primary' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            CP
          </button>
        </div>

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

        {/* Note trigger & Priority */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowNoteBox(v => !v)}
            className="p-1.5 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink transition-colors"
            title="Toggle Reflection Note"
          >
            <FileText size={14} className={noteText ? 'text-primary' : ''} />
          </button>

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

      {/* Expandable note box */}
      <AnimatePresence>
        {showNoteBox && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-2 pt-2 border-t border-hairline/40"
          >
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Reflections, progress notes, or key takeaways..."
              rows={2}
              className="w-full p-2.5 bg-surface-soft border border-hairline rounded-lg font-sans text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary transition-all resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-muted">
                {skill.note_updated_at ? `Updated ${new Date(skill.note_updated_at).toLocaleDateString()}` : 'Saved to cloud'}
              </span>
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="flex items-center gap-1 px-3 py-1 bg-ink text-on-primary font-sans text-[10px] font-bold rounded hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                {noteSaved ? <CheckIcon size={12} className="text-brand-teal" /> : <Save size={12} />}
                <span>{noteSaved ? 'Saved' : savingNote ? 'Saving...' : 'Save Note'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
