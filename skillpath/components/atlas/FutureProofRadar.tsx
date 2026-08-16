import { Radar } from 'lucide-react';
import { calculateSkillDecay } from '@/lib/atlas/skill-decay';

export function FutureProofRadar({ skills = [] }: { skills?: Array<{ name?: string; freshness?: string; marketDemand?: string }> }) {
  const radar = skills.slice(0, 6).map((skill) => calculateSkillDecay({ skill: skill.name || 'Unlabeled skill', demandScore: skill.marketDemand === 'high' ? 0.9 : 0.65 }));
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lavender"><Radar className="h-4 w-4" /> Market freshness</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Future-Proof Radar</h2><p className="mt-1 text-sm leading-6 text-muted">Keep valuable skills visible as demand and tools change.</p><div className="mt-5 space-y-3">{(radar.length ? radar : [calculateSkillDecay({ skill: 'Your next strategic skill', demandScore: 0.8 })]).map((item) => <div key={item.skill} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-soft p-3"><div><p className="text-sm font-semibold text-ink">{item.skill}</p><p className="mt-1 text-xs text-muted">{item.advice}</p></div><span className={`font-mono text-xs font-bold ${item.status === 'fresh' ? 'text-brand-teal' : item.status === 'watch' ? 'text-brand-ochre' : 'text-brand-pink'}`}>{item.freshness}%</span></div>)}</div></section>;
}

