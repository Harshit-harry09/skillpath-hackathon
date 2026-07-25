'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Share2, TrendingUp, DollarSign, Users, Trophy, RotateCcw, Sparkles, Check, Flame, Zap, Bot } from 'lucide-react';
import { conductSkillBattle, type BattleResult } from '@/lib/skill-battle';
import { useAuth } from '@/context/AuthContext';
import { FirecrackerCanvas } from './FirecrackerCanvas';

const PRESET_MATCHUPS = [
  { a: 'React', b: 'Vue' },
  { a: 'FastAPI', b: 'Express' },
  { a: 'Docker', b: 'Kubernetes' },
  { a: 'Rust', b: 'Go' },
  { a: 'PyTorch', b: 'TensorFlow' },
  { a: 'PostgreSQL', b: 'MongoDB' },
  { a: 'Next.js', b: 'Remix' },
  { a: 'Tailwind', b: 'Bootstrap' },
  { a: 'AWS', b: 'GCP' },
  { a: 'Python', b: 'Java' },
];

export function SkillBattle() {
  const [skillA, setSkillA] = useState('React');
  const [skillB, setSkillB] = useState('Vue');
  const [result, setResult] = useState<BattleResult | null>(null);
  const [aiVerdict, setAiVerdict] = useState<string>('');
  const [isBattling, setIsBattling] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showFirecrackers, setShowFirecrackers] = useState(false);
  const { getToken } = useAuth();

  const startBattleWith = (a: string, b: string) => {
    setSkillA(a);
    setSkillB(b);
    executeBattle(a, b);
  };

  const executeBattle = async (a: string, b: string) => {
    if (!a || !b) return;
    setIsBattling(true);
    setAiVerdict('');
    setShowFirecrackers(false);

    let finalResult = conductSkillBattle(a, b);

    // If both skills are missing from local dataset (0 votes), call Gemini AI fallback!
    if (finalResult.totalVotes === 0) {
      try {
        const estRes = await fetch('/api/battle/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillA: a, skillB: b }),
        });
        if (estRes.ok) {
          const estData = await estRes.json();
          if (estData.result) {
            finalResult = estData.result;
          }
        }
      } catch (err) {
        console.warn('[SkillBattle] Gemini Fallback error:', err);
      }
    }

    setTimeout(async () => {
      setResult(finalResult);
      setIsBattling(false);
      setHasVoted(true);
      setShowFirecrackers(true);

      // Hide firecrackers after 6.5 seconds
      setTimeout(() => setShowFirecrackers(false), 6500);

      // Now fetch AI architect verdict
      setIsAiLoading(true);
      try {
        let authHeader: Record<string, string> = {};
        try {
          const token = await getToken();
          if (token) authHeader = { Authorization: `Bearer ${token}` };
        } catch {
          // Allow anonymous visitors
        }

        const response = await fetch('/api/battle/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            optionA: finalResult.optionA,
            optionB: finalResult.optionB,
            winner: finalResult.winner,
            totalVotes: finalResult.totalVotes,
            trend: Math.round((finalResult.winner === 'A' ? finalResult.optionA.trend : finalResult.optionB.trend) * 100),
            premium: finalResult.winner === 'A' ? finalResult.optionA.premium : finalResult.optionB.premium,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.aiVerdict) setAiVerdict(data.aiVerdict);
        }
      } catch (e) {
        console.warn('AI verdict issue:', e);
      } finally {
        setIsAiLoading(false);
      }
    }, 800);
  };

  const handleBattle = () => executeBattle(skillA, skillB);

  const handleReset = () => {
    setShowFirecrackers(false);
    setHasVoted(false);
    setResult(null);
    setSkillA('React');
    setSkillB('Vue');
  };

  const handleShare = () => {
    if (!result) return;
    const url = `${window.location.origin}/battle?a=${encodeURIComponent(result.optionA.name)}&b=${encodeURIComponent(result.optionB.name)}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 relative">
      {/* 🎆 3D Firecracker Canvas */}
      <FirecrackerCanvas active={showFirecrackers} />

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-[10px] text-brand-pink font-bold tracking-widest uppercase mb-4">
          <Swords size={12} />
          Community Skill Battle
        </div>
        <h2 className="font-display text-4xl md:text-5xl text-ink mb-4">
          The Market Battle Arena.
        </h2>
        <p className="text-muted max-w-xl mx-auto text-body-sm">
          Compare market adoption, salary premiums, and 2024 growth rates across 320k+ profiles + AI 10k Developer Benchmarks.
        </p>
      </div>

      <div className="relative bg-[#EBE9DC] dark:bg-surface-card border border-hairline rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-pink via-amber-400 to-brand-teal" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-teal/5 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-pink/5 rounded-full blur-[100px]" />

        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="battle-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                <div className="flex-1 w-full space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted block ml-2">Option A</label>
                  <input
                    type="text"
                    value={skillA}
                    onChange={(e) => setSkillA(e.target.value)}
                    placeholder="e.g. React"
                    className="w-full h-16 md:h-20 px-8 bg-canvas/50 border border-hairline rounded-2xl md:rounded-3xl font-display text-xl md:text-2xl text-ink placeholder:text-muted/30 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 transition-all text-center md:text-left"
                  />
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ink text-on-primary font-display text-lg md:text-xl flex items-center justify-center shadow-xl border-4 border-surface-card">
                    VS
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted block ml-2">Option B</label>
                  <input
                    type="text"
                    value={skillB}
                    onChange={(e) => setSkillB(e.target.value)}
                    placeholder="e.g. Vue"
                    className="w-full h-16 md:h-20 px-8 bg-canvas/50 border border-hairline rounded-2xl md:rounded-3xl font-display text-xl md:text-2xl text-ink placeholder:text-muted/30 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all text-center md:text-left"
                  />
                </div>
              </div>

              {/* Popular Battle Presets */}
              <div className="mt-8 pt-6 border-t border-hairline/60">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3 text-center">
                  Trending Market Matchups
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {PRESET_MATCHUPS.map(p => (
                    <button
                      key={`${p.a}-${p.b}`}
                      onClick={() => startBattleWith(p.a, p.b)}
                      className="px-3.5 py-1.5 rounded-full bg-canvas/80 hover:bg-brand-pink/10 border border-hairline hover:border-brand-pink/30 text-body-xs font-semibold text-muted hover:text-ink transition-all flex items-center gap-1.5"
                    >
                      <span>{p.a}</span>
                      <span className="text-[10px] opacity-40">vs</span>
                      <span>{p.b}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center">
                <button
                  disabled={!skillA || !skillB || isBattling}
                  onClick={handleBattle}
                  className="group relative h-16 px-12 bg-ink text-on-primary rounded-2xl font-display font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isBattling ? 'Calculating Market Data...' : 'Start Skill Battle 🚀'}
                    {!isBattling && <Swords size={18} className="group-hover:rotate-12 transition-transform" />}
                  </span>
                  {isBattling && (
                    <motion.div
                      className="absolute inset-0 bg-brand-pink/20"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </button>
                <p className="mt-4 text-[10px] text-muted font-bold uppercase tracking-widest">
                  Instant O(1) Local Data + AI 10,000 Sample Fallback Engine
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="battle-result"
              initial={{ opacity: 0, scale: 0.85, y: 120, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 180 }}
              className="relative z-10 space-y-8 perspective-[1400px]"
            >
              {result && (
                <>
                  {/* Tug-of-War Market Share Bar */}
                  <div className="p-6 rounded-3xl bg-canvas border border-hairline space-y-3">
                    <div className="flex justify-between items-center text-body-sm font-bold">
                      <span className="text-brand-pink flex items-center gap-2 font-display">
                        {result.optionA.name} ({result.shareA}%)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {result.isAiEstimated ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-[9px] font-bold text-brand-purple uppercase tracking-widest flex items-center gap-1">
                            <Bot size={11} /> AI 10k Developer Sample
                          </span>
                        ) : (
                          <span className="text-muted text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                            <Zap size={12} className="text-amber-400" /> Market Split (320k dataset)
                          </span>
                        )}
                      </div>
                      <span className="text-brand-teal flex items-center gap-2 font-display">
                        ({result.shareB}%) {result.optionB.name}
                      </span>
                    </div>

                    <div className="w-full h-4 rounded-full bg-surface-soft overflow-hidden flex p-0.5 border border-hairline relative">
                      <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${result.shareA}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-brand-pink to-pink-500 rounded-l-full relative"
                      />
                      <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${result.shareB}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-brand-teal to-teal-500 rounded-r-full relative"
                      />
                    </div>
                  </div>

                  {/* 3D Option Cards Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-[1000px]">
                    {/* Option A Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, rotateY: 2, rotateX: -2 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative transform-gpu"
                    >
                      {result.winner === 'A' && (
                        <motion.div
                          initial={{ scale: 0, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ type: 'spring', delay: 0.2 }}
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-display font-extrabold text-[10px] uppercase tracking-widest shadow-[0_4px_20px_rgba(245,158,11,0.5)] flex items-center gap-1.5 z-20 border border-amber-200 animate-bounce"
                        >
                          <Trophy size={13} className="text-slate-950" /> 🏆 MARKET CHAMPION
                        </motion.div>
                      )}
                      <div className={`h-full p-8 rounded-3xl border transition-all ${
                        result.winner === 'A'
                          ? 'bg-gradient-to-b from-brand-pink/15 to-canvas border-amber-400/80 ring-2 ring-amber-400/40 shadow-[0_0_50px_rgba(251,191,36,0.3)]'
                          : 'bg-surface-soft border-hairline opacity-75'
                      }`}>
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="font-display text-3xl text-ink font-bold">{result.optionA.name}</h3>
                          <span className="px-3 py-1 rounded-full bg-brand-pink/10 text-brand-pink text-title-md font-bold">
                            {result.shareA}%
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">Job Postings</span>
                            <span className="text-ink font-mono text-body-md font-bold">{result.optionA.votes.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">Salary Premium</span>
                            <span className="text-brand-teal font-mono text-body-md font-bold">+${result.optionA.premium.toLocaleString()}/yr</span>
                          </div>
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">2024 Growth Rate</span>
                            <span className="text-brand-pink font-mono text-body-md font-bold">+{Math.round(result.optionA.trend * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Option B Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, rotateY: -2, rotateX: -2 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative transform-gpu"
                    >
                      {result.winner === 'B' && (
                        <motion.div
                          initial={{ scale: 0, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ type: 'spring', delay: 0.2 }}
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-display font-extrabold text-[10px] uppercase tracking-widest shadow-[0_4px_20px_rgba(245,158,11,0.5)] flex items-center gap-1.5 z-20 border border-amber-200 animate-bounce"
                        >
                          <Trophy size={13} className="text-slate-950" /> 🏆 MARKET CHAMPION
                        </motion.div>
                      )}
                      <div className={`h-full p-8 rounded-3xl border transition-all ${
                        result.winner === 'B'
                          ? 'bg-gradient-to-b from-brand-teal/15 to-canvas border-amber-400/80 ring-2 ring-amber-400/40 shadow-[0_0_50px_rgba(251,191,36,0.3)]'
                          : 'bg-surface-soft border-hairline opacity-75'
                      }`}>
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="font-display text-3xl text-ink font-bold">{result.optionB.name}</h3>
                          <span className="px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal text-title-md font-bold">
                            {result.shareB}%
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">Job Postings</span>
                            <span className="text-ink font-mono text-body-md font-bold">{result.optionB.votes.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">Salary Premium</span>
                            <span className="text-brand-teal font-mono text-body-md font-bold">+${result.optionB.premium.toLocaleString()}/yr</span>
                          </div>
                          <div className="flex justify-between text-body-xs font-semibold">
                            <span className="text-muted uppercase tracking-wider">2024 Growth Rate</span>
                            <span className="text-brand-pink font-mono text-body-md font-bold">+{Math.round(result.optionB.trend * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Verdict & Celebration Highlights Card */}
                  <div className="bg-ink text-on-primary p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Swords size={140} />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400 animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-primary/70">
                          {result.isAiEstimated ? 'Gemini 10k Developer Survey Estimate' : 'Data Verdict & Victory Insights'}
                        </p>
                      </div>

                      <h3 className="font-display text-2xl md:text-3xl leading-tight text-balance">
                        “{result.verdict}”
                      </h3>

                      {/* Victory Highlights Badges */}
                      {result.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {result.highlights.map((highlight, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-body-xs font-semibold text-on-primary flex items-center gap-1.5 shadow-sm"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Architect Insight */}
                      <div className="pt-6 border-t border-white/15">
                        <span className="px-2.5 py-1 rounded bg-brand-teal/20 border border-brand-teal/30 text-[9px] font-bold uppercase tracking-widest text-brand-teal inline-block mb-3">
                          Architect's Advice
                        </span>
                        <div className="min-h-[2.5rem] flex items-center">
                          {isAiLoading ? (
                            <div className="flex gap-1.5 items-center text-body-xs text-on-primary/60">
                              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-brand-teal" />
                              Generating deep career insights...
                            </div>
                          ) : (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="font-sans text-body-md italic text-on-primary/90"
                            >
                              {aiVerdict || "Both technologies are valuable. Focus on mastering core paradigms before switching stacks."}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Tally */}
                    <div className="mt-8 pt-8 border-t border-white/15 grid grid-cols-3 gap-4 relative z-10">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-brand-teal mb-1">
                          <Users size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Total Samples</span>
                        </div>
                        <span className="font-mono text-xl font-bold">{result.totalVotes.toLocaleString()}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-brand-pink mb-1">
                          <TrendingUp size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Winning Trend</span>
                        </div>
                        <span className="font-mono text-xl font-bold">+{Math.round((result.winner === 'A' ? result.optionA.trend : result.optionB.trend) * 100)}%</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-brand-ochre mb-1">
                          <DollarSign size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Top Premium</span>
                        </div>
                        <span className="font-mono text-xl font-bold">+${((result.winner === 'A' ? result.optionA.premium : result.optionB.premium) / 1000).toFixed(1)}k</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
                      <button
                        onClick={handleShare}
                        className="h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        {copiedShare ? <Check size={14} className="text-brand-teal" /> : <Share2 size={14} />}
                        {copiedShare ? 'Link Copied!' : 'Share Verdict'}
                      </button>
                      <button
                        onClick={handleReset}
                        className="h-12 px-6 text-on-primary/70 hover:text-on-primary text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        New Battle
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
