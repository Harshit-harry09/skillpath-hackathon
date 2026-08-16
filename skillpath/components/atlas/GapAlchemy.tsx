import { FlaskConical } from 'lucide-react';
import type { AtlasSoftSignals } from '@/lib/atlas/soft-parse';

export function GapAlchemy({ softSignals }: { softSignals?: AtlasSoftSignals }) {
  const rows = softSignals?.gapTranslations || [];
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ochre"><FlaskConical className="h-4 w-4" /> Human context</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Gap Alchemy</h2><p className="mt-1 text-sm leading-6 text-muted">Atlas converts life experience into market language.</p>{rows.length ? <div className="mt-5 space-y-3">{rows.map((row) => <div key={row.gapReason} className="rounded-2xl border border-hairline bg-surface-soft p-4"><p className="text-sm font-semibold text-ink">{row.gapReason}</p><p className="mt-2 text-xs leading-5 text-muted">{row.narrative}</p><div className="mt-3 flex flex-wrap gap-2">{row.translatedSkills.map((skill) => <span key={skill} className="rounded-md bg-brand-ochre/15 px-2 py-1 text-[11px] font-semibold text-ink">{skill}</span>)}</div></div>)}</div> : <div className="mt-5 rounded-2xl bg-surface-soft p-4 text-sm text-muted">Tell Atlas about side work, a break, or responsibilities outside formal employment to unlock the translation layer.</div>}</section>;
}

