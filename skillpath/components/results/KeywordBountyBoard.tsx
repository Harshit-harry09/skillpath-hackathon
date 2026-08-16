import { ArrowUpRight, Coins } from 'lucide-react';
import type { KeywordBountyItem } from '@/types/analysis';

export function KeywordBountyBoard({ items }: { items: KeywordBountyItem[] }) {
  return (
    <section aria-labelledby="keyword-bounty-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ochre"><Coins className="h-4 w-4" /> Keyword surgery</div>
          <h2 id="keyword-bounty-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Keyword Bounty</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Add these skills to increase your ATS match score. Only claim skills you can prove.</p>
        </div>
        <span className="font-mono text-xs text-muted">{items.length} open bounties</span>
      </div>
      {items.length ? (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-hairline">
          <table className="min-w-[680px] w-full text-left text-sm">
            <thead className="bg-surface-soft text-[10px] uppercase tracking-[0.14em] text-muted"><tr><th className="px-4 py-3">Missing skill</th><th className="px-4 py-3">Score impact</th><th className="px-4 py-3">Where to add</th><th className="px-4 py-3">Suggested line</th></tr></thead>
            <tbody className="divide-y divide-[color:var(--color-hairline)]">
              {items.map((item) => <tr key={item.skill} className="align-top"><td className="px-4 py-4 font-semibold text-ink">{item.skill}<span className="ml-2 rounded-md bg-brand-pink/10 px-1.5 py-0.5 text-[10px] uppercase text-brand-pink">{item.priority}</span></td><td className="px-4 py-4 font-mono font-bold text-brand-teal">+{item.scoreImpact}</td><td className="px-4 py-4 capitalize text-muted">{item.placement}</td><td className="px-4 py-4 text-muted">{item.suggestedLine}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : <div className="mt-5 rounded-2xl bg-brand-teal/10 p-5 text-sm text-ink">No missing JD keywords were found in the deterministic scan.</div>}
      <p className="mt-4 flex items-center gap-1 text-xs text-muted"><ArrowUpRight className="h-3.5 w-3.5" /> Impact is a deterministic estimate, not a guarantee.</p>
    </section>
  );
}

