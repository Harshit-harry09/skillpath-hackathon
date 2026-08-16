import { UsersRound } from 'lucide-react';

export function ShadowBoard({ targetRole = 'your target role' }: { targetRole?: string }) {
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lavender"><UsersRound className="h-4 w-4" /> Decision table</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Shadow Board</h2><p className="mt-1 text-sm leading-6 text-muted">Pressure-test the next move from multiple viewpoints.</p><div className="mt-5 grid gap-2 sm:grid-cols-3">{[['Hiring manager', 'What proof makes you low-risk?'], ['Future teammate', 'What will you own in the first 30 days?'], ['You in 12 months', `Does ${targetRole} fit the life you want?`]].map(([role, question]) => <div key={role} className="rounded-xl border border-hairline bg-surface-soft p-3"><p className="text-xs font-bold text-ink">{role}</p><p className="mt-2 text-xs leading-5 text-muted">{question}</p></div>)}</div></section>;
}

