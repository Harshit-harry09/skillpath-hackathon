import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

export function AtlasLaunchCTA({ analysisId, score }: { analysisId: string; score: number }) {
  const ready = score >= 75;
  return (
    <section className="rounded-3xl border border-brand-teal/25 bg-brand-teal/10 p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-white"><Compass className="h-5 w-5" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal">Next court</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">{ready ? 'Your resume is becoming machine-ready.' : 'Once the machine case is clear, build the human strategy.'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Now win the human side: interviews, salary, bridge roles, and career strategy.</p></div></div>
        <Link href={`/atlas?analysisId=${encodeURIComponent(analysisId)}&mode=funnel`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98]">Open Atlas Career Strategist <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}

