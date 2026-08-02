'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Code2, MessageSquareText, Sparkles } from 'lucide-react';

const modes = [
  { label: 'Technical', detail: 'Concepts + debugging' },
  { label: 'Coding test', detail: 'Solve + explain' },
  { label: 'System design', detail: 'Architecture + tradeoffs' },
  { label: 'Behavioral', detail: 'Stories + judgment' },
];

export function InterviewLabSection() {
  const router = useRouter();

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-16">
      <div className="relative overflow-hidden rounded-[32px] border-2 border-[#1F3A4B] bg-[#1F3A4B] p-6 text-[#FAFDEE] shadow-[8px_8px_0_#ff4d8b] sm:p-10 md:p-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#2DD4BF]/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#ff4d8b]/20 blur-[100px]" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#7DE8D9]">
              <MessageSquareText size={14} /> New · Interview Lab
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-black leading-tight tracking-tight sm:text-5xl" style={{ textWrap: 'balance' }}>
              Stop preparing answers in your head.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#FAFDEE]/70 sm:text-lg" style={{ textWrap: 'pretty' }}>
              Run a role-specific mock interview, handle adaptive follow-ups, and find the answers that need one more rep before the real conversation.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {['Choose your role and level', 'Set your question mix', 'Practice coding in the same session', 'Retry weak answers'].map((item) => <div key={item} className="flex items-center gap-2 text-xs font-bold text-[#FAFDEE]/85"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2DD4BF]/20 text-[#7DE8D9]"><Check size={12} /></span>{item}</div>)}
            </div>
            <button type="button" onClick={() => router.push('/interview-lab')} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#ff4d8b] px-5 text-sm font-black text-white shadow-[4px_4px_0_#FAFDEE] transition-transform active:scale-[0.96]">Practice an interview <ArrowRight size={17} /></button>
          </div>

          <div className="rounded-[24px] border border-white/15 bg-[#111116]/70 p-5 shadow-2xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-[#ff4d8b]" /><span className="font-mono text-[10px] font-black uppercase tracking-widest text-white/60">Interview setup</span></div><span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#7DE8D9]">5 questions</span></div>
            <div className="mt-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DD4BF]/15 text-[#7DE8D9]"><Sparkles size={18} /></div><div><p className="text-sm font-black">Senior Backend Engineer</p><p className="text-xs text-white/50">Adaptive practice session</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-2">{modes.map((mode) => <div key={mode.label} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-xs font-black"><span className="text-[#7DE8D9]">{mode.label === 'Coding test' ? <Code2 size={13} /> : <MessageSquareText size={13} />}</span>{mode.label}</div><p className="mt-1 text-[10px] text-white/45">{mode.detail}</p></div>)}</div>
            <div className="mt-5 rounded-xl border border-[#ff4d8b]/25 bg-[#ff4d8b]/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-[#ff9abd]">Interviewer follow-up</p><p className="mt-1 text-xs leading-relaxed text-white/80">“What tradeoff would make you choose the opposite approach?”</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
