'use client';

import { useState } from 'react';
import { ExternalLink, LockKeyhole } from 'lucide-react';

const PROOF_TYPES = ['project', 'certificate', 'GitHub link', 'freelance work', 'coursework', 'case study', 'live demo'];

export function EvidenceLocker({ skills, analysisId }: { skills: string[]; analysisId?: string }) {
  const [proof, setProof] = useState<Record<string, { type: string; url: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const uniqueSkills = Array.from(new Set(skills)).slice(0, 6);

  async function saveEvidence(skill: string, item: { type: string; url: string }) {
    if (!analysisId) return;
    setSaving(skill);
    try {
      await fetch(`/api/results/${encodeURIComponent(analysisId)}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, proofType: item.type, url: item.url }),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <section aria-labelledby="evidence-locker-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ochre"><LockKeyhole className="h-4 w-4" /> Proof collection</div>
      <h2 id="evidence-locker-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Evidence Locker</h2>
      <p className="mt-1 text-sm leading-6 text-muted">Do not just claim skills. Keep proof ready for the recruiter conversation.</p>
      {uniqueSkills.length ? (
        <div data-lenis-prevent className="mt-5 overflow-x-auto overscroll-contain touch-pan-x rounded-2xl border border-hairline scrollbar-thin">
          <table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-surface-soft text-[10px] uppercase tracking-[0.14em] text-muted"><tr><th className="px-4 py-3">Skill</th><th className="px-4 py-3">Proof type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Add evidence</th></tr></thead><tbody className="divide-y divide-[color:var(--color-hairline)]">
            {uniqueSkills.map((skill) => { const item = proof[skill] || { type: PROOF_TYPES[0], url: '' }; return <tr key={skill}><td className="px-4 py-3 font-semibold text-ink">{skill}</td><td className="px-4 py-3"><select value={item.type} onChange={(event) => setProof((current) => ({ ...current, [skill]: { ...item, type: event.target.value } }))} className="rounded-lg border border-hairline bg-surface-soft px-2 py-2 text-xs text-ink">{PROOF_TYPES.map((type) => <option key={type}>{type}</option>)}</select></td><td className="px-4 py-3 text-xs font-semibold text-muted">{item.url ? 'Ready to share' : 'Needs proof'}</td><td className="px-4 py-3"><div className="flex min-w-[260px] gap-2"><input value={item.url} onChange={(event) => setProof((current) => ({ ...current, [skill]: { ...item, url: event.target.value } }))} placeholder="https://…" className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface-soft px-2.5 py-2 text-xs text-ink outline-none focus:border-brand-teal" />{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-brand-teal hover:bg-brand-teal/10" title="Open evidence"><ExternalLink className="h-4 w-4" /></a> : null}<button type="button" onClick={() => void saveEvidence(skill, item)} disabled={!analysisId || saving === skill} className="rounded-lg bg-ink px-2.5 py-2 text-[10px] font-bold text-on-primary disabled:opacity-50">{saving === skill ? 'Saving' : 'Save'}</button></div></td></tr>; })}
          </tbody></table>
        </div>
      ) : <div className="mt-5 rounded-2xl bg-surface-soft p-5 text-sm text-muted">No missing skills need proof right now.</div>}
    </section>
  );
}

