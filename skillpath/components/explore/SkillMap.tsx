'use client';
// updated

import { motion } from 'framer-motion';

interface Skill {
  name: string;
  importance: 'essential' | 'high' | 'medium' | 'growing';
  weeks_to_learn: number;
  frequency_pct: number;
  note?: string;
}

const importanceColors = {
  essential: 'text-brand-teal border-brand-teal/20 bg-brand-teal/5',
  high: 'text-brand-pink border-brand-pink/20 bg-brand-pink/5',
  medium: 'text-muted border-hairline bg-surface-soft',
  growing: 'text-brand-ochre border-brand-ochre/20 bg-brand-ochre/5',
};

function SkillRow({ skill, index }: { skill: Skill; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group py-6 border-b border-hairline last:border-0"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-sans font-semibold text-lg text-ink">{skill.name}</span>
            <span className={`font-sans font-bold text-[10px] uppercase tracking-widest border px-3 py-1 rounded-full ${importanceColors[skill.importance]}`}>
              {skill.importance}
            </span>
          </div>
          {skill.note && (
            <p className="font-sans text-body-sm text-muted">{skill.note}</p>
          )}
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end min-w-[90px]">
            <span className="font-sans font-bold text-[10px] text-muted uppercase tracking-widest">Effort</span>
            <span className="font-sans font-semibold text-body-md text-ink">{skill.weeks_to_learn} weeks</span>
          </div>
          
          <div className="w-40 h-1.5 bg-hairline rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.frequency_pct}%` }}
              transition={{ delay: 0.5 + index * 0.05, duration: 1 }}
              className="absolute inset-y-0 left-0 bg-brand-teal"
            />
          </div>
          
          <div className="flex flex-col items-end min-w-[70px]">
            <span className="font-sans font-bold text-[10px] text-muted uppercase tracking-widest">Demand</span>
            <span className="font-sans font-semibold text-body-md text-ink">{skill.frequency_pct}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SkillMap({ categories }: { categories: Record<string, Skill[]> }) {
  const categoryLabels: Record<string, string> = {
    technical_core: 'Technical — Core',
    technical_tools: 'Technical — Tools',
    analytical: 'Analytical',
    soft_skills: 'Soft Skills',
  };

  return (
    <div className="space-y-20">
      {Object.entries(categories).map(([key, skills]) => (
        skills.length > 0 && (
          <div key={key}>
            <span className="font-sans font-bold text-[11px] text-ink tracking-[0.2em] uppercase mb-8 block border-l-4 border-brand-teal pl-6">
              {categoryLabels[key] || key.replace(/_/g, ' ')}
            </span>
            <div className="bg-surface-card border border-hairline rounded-[32px] p-8 md:p-12 shadow-sm">
              {skills.map((skill, i) => (
                <SkillRow key={skill.name} skill={skill} index={i} />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
