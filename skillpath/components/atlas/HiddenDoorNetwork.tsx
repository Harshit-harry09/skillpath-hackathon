import { Network } from 'lucide-react';

export function HiddenDoorNetwork({ targetRole = 'your target role' }: { targetRole?: string }) {
  const steps = [`Find 3 people doing ${targetRole} work`, 'Ask for a 15-minute learning conversation', 'Share one relevant proof item, then follow up with a specific question'];
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal"><Network className="h-4 w-4" /> Relationship strategy</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Hidden Door Network</h2><p className="mt-1 text-sm leading-6 text-muted">Build warm context before asking for a referral.</p><ol className="mt-5 space-y-3">{steps.map((step, index) => <li key={step} className="flex gap-3 rounded-xl border border-hairline bg-surface-soft p-3 text-sm text-ink"><span className="font-mono text-brand-teal">0{index + 1}</span><span>{step}</span></li>)}</ol></section>;
}

