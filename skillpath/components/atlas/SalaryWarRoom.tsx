'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';

export function SalaryWarRoom({ baseline = 6 }: { baseline?: number }) {
  const [ask, setAsk] = useState(Math.round(baseline * 1.15 * 10) / 10);
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ochre"><Banknote className="h-4 w-4" /> Negotiation lab</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Salary War Room</h2><p className="mt-1 text-sm leading-6 text-muted">Model your ask around evidence, market range, and the value of the next role.</p><div className="mt-5 rounded-2xl bg-surface-soft p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-ink">Practice ask</span><span className="font-mono font-bold text-brand-ochre">₹{ask.toFixed(1)} LPA</span></div><input aria-label="Practice salary ask" type="range" min={Math.max(2, baseline)} max={Math.max(12, baseline * 2)} step="0.1" value={ask} onChange={(event) => setAsk(Number(event.target.value))} className="mt-4 w-full accent-[var(--color-brand-ochre)]" /><p className="mt-3 text-xs leading-5 text-muted">Anchor with the role’s outcomes and your proof; keep the final range open until the employer shares scope.</p></div></section>;
}

