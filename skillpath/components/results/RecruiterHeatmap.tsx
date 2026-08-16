import { Eye, TriangleAlert } from 'lucide-react';
import type { HeatmapZone } from '@/lib/results/recruiter-heatmap';

export function RecruiterHeatmap({ zones }: { zones: HeatmapZone[] }) {
  return (
    <section aria-labelledby="recruiter-scan-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lavender"><Eye className="h-4 w-4" /> Recruiter scan</div>
      <h2 id="recruiter-scan-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">6-Second Recruiter Scan</h2>
      <p className="mt-1 text-sm leading-6 text-muted">Where human eyes land before they decide to keep or reject.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {zones.sort((a, b) => b.importance - a.importance).map((zone) => <div key={zone.id} className="rounded-2xl border border-hairline bg-surface-soft p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-ink">{zone.label}</span><span className={`font-mono text-xs font-bold ${zone.status === 'good' ? 'text-brand-teal' : zone.status === 'warning' ? 'text-brand-ochre' : 'text-brand-pink'}`}>{zone.status}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-strong"><div className={`h-full rounded-full ${zone.status === 'good' ? 'bg-brand-teal' : zone.status === 'warning' ? 'bg-brand-ochre' : 'bg-brand-pink'}`} style={{ width: `${zone.importance}%` }} /></div><p className="mt-3 text-xs leading-5 text-muted">{zone.advice}</p></div>)}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted"><TriangleAlert className="h-3.5 w-3.5" /> A warning is a repair prompt, not a judgment about your career.</div>
    </section>
  );
}

