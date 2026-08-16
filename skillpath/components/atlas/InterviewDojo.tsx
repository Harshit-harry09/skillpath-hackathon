'use client';

import { useState } from 'react';
import { Dumbbell, RotateCcw } from 'lucide-react';

export function InterviewDojo({ role = 'your target role' }: { role?: string }) {
  const questions = [`Tell me about a decision that changed the outcome of a ${role} project.`, 'How would you explain a career transition without minimizing the work you did?', 'What evidence would you show for your strongest skill?'];
  const [index, setIndex] = useState(0);
  return <section className="rounded-3xl border-2 border-hairline bg-surface-card p-6 shadow-sm"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-pink"><Dumbbell className="h-4 w-4" /> Practice arena</div><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Interview Dojo</h2><p className="mt-1 text-sm leading-6 text-muted">Practice the human proof behind your career strategy.</p><div className="mt-5 rounded-2xl bg-brand-pink/10 p-5"><p className="text-base font-semibold leading-7 text-ink">{questions[index]}</p><p className="mt-3 text-xs text-muted">Answer aloud in 90 seconds. Focus on context, action, and evidence.</p></div><button type="button" onClick={() => setIndex((current) => (current + 1) % questions.length)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface-soft px-3.5 py-2.5 text-xs font-bold text-ink hover:bg-surface-strong"><RotateCcw className="h-3.5 w-3.5" /> New prompt</button></section>;
}

