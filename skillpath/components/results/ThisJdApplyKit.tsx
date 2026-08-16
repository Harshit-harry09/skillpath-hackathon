'use client';

import { useState } from 'react';
import { Copy, FilePenLine } from 'lucide-react';

export function ThisJdApplyKit({ role, skills }: { role: string; skills: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const items = [
    ['This-JD Headline', `${role} | ${skills.slice(0, 3).join(' | ') || 'Evidence-led operator'}`],
    ['This-JD Opening Line', `I am applying my experience in ${skills[0] || 'reliable delivery'} to the ${role} team’s most important outcomes.`],
    ['This-JD Resume Summary', `${role} candidate with evidence across ${skills.slice(0, 3).join(', ') || 'reliable execution'}.`],
  ];
  async function copy(value: string) { await navigator.clipboard.writeText(value); setCopied(value); window.setTimeout(() => setCopied(null), 1500); }
  return <section className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lavender"><FilePenLine className="h-4 w-4" /> Application kit</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">This-JD Apply Kit</h2><p className="mt-1 text-sm text-muted">Tailored only to this job description.</p><div className="mt-5 grid gap-3">{items.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 rounded-xl border border-hairline bg-surface-soft p-4"><div><p className="text-xs font-bold text-ink">{label}</p><p className="mt-2 text-sm leading-6 text-muted">{value}</p></div><button type="button" onClick={() => void copy(value)} className="rounded-lg p-2 text-brand-teal hover:bg-brand-teal/10" title={`Copy ${label}`}><Copy className="h-4 w-4" /></button></div>)}</div>{copied ? <p className="mt-3 text-xs text-brand-teal">Copied for this job.</p> : null}</section>;
}

