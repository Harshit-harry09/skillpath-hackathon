'use client';

import { useState } from 'react';
import { Clipboard, Scissors, Sparkles } from 'lucide-react';
import { buildBulletRewrite, analyzeBulletQuality } from '@/lib/results/bullet-quality';

interface BulletSurgeryProps {
  bullets: string[];
  targetRole: string;
  missingSkills: string[];
  matchedSkills: string[];
}

export function BulletSurgery({ bullets, targetRole, missingSkills, matchedSkills }: BulletSurgeryProps) {
  const [rewrites, setRewrites] = useState<Record<string, ReturnType<typeof buildBulletRewrite>>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const visible = bullets.slice(0, 4);

  async function rewrite(bullet: string) {
    try {
      const response = await fetch('/api/generate/rewrite-bullet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bullet, targetRole, missingSkills, matchedSkills }) });
      if (response.ok) {
        const result = await response.json();
        setRewrites((current) => ({ ...current, [bullet]: result }));
        return;
      }
    } catch { /* deterministic fallback below */ }
    setRewrites((current) => ({ ...current, [bullet]: buildBulletRewrite(bullet, targetRole, missingSkills, matchedSkills) }));
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section aria-labelledby="bullet-surgery-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal"><Scissors className="h-4 w-4" /> Fix lab</div>
      <h2 id="bullet-surgery-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Bullet Surgery</h2>
      <p className="mt-1 text-sm leading-6 text-muted">Repair weak resume lines into evidence-driven achievements. Metrics stay as prompts until you verify them.</p>
      {visible.length ? <div className="mt-5 space-y-4">{visible.map((bullet) => { const quality = analyzeBulletQuality(bullet, [...missingSkills, ...matchedSkills]); const rewriteResult = rewrites[bullet]; return <article key={bullet} className="rounded-2xl border border-hairline bg-surface-soft p-4"><div className="text-sm leading-6 text-ink">{bullet}</div><div className="mt-2 text-xs text-muted">{quality.reasons.length ? quality.reasons.join(' · ') : 'Strong structure; consider adding a sharper metric.'}</div>{rewriteResult ? <div className="mt-4 rounded-xl border border-brand-teal/25 bg-brand-teal/10 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium leading-6 text-ink">{rewriteResult.improvedBullet}</p><button type="button" onClick={() => void copy(rewriteResult.improvedBullet)} className="shrink-0 rounded-lg border border-brand-teal/30 p-2 text-brand-teal hover:bg-brand-teal/10" title="Copy rewrite"><Clipboard className="h-4 w-4" /></button></div><p className="mt-2 text-xs text-muted">{rewriteResult.addedMetricPrompt} {copied === rewriteResult.improvedBullet ? 'Copied.' : ''}</p></div> : <button type="button" onClick={() => void rewrite(bullet)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-xs font-bold text-on-primary hover:opacity-90 active:scale-[0.98]"><Sparkles className="h-3.5 w-3.5" /> Repair this bullet</button>}</article>; })}</div> : <div className="mt-5 rounded-2xl bg-surface-soft p-5 text-sm text-muted">No experience bullets were included in the public analysis. Add bullets to unlock surgery.</div>}
    </section>
  );
}

