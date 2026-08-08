'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Share2, TrendingUp, DollarSign, Users, Trophy, RotateCcw, Sparkles, Check, Zap, Bot, ArrowRight, Lock } from 'lucide-react';
import { conductSkillBattle, type BattleResult } from '@/lib/skill-battle';
import { useAuth } from '@/context/AuthContext';
import { Confetti } from '@/components/ui/confetti';
import confetti from 'canvas-confetti';

// Single clean line of 5 high-impact matchups
const PRESET_MATCHUPS = [
  { a: 'React', b: 'Vue' },
  { a: 'Rust', b: 'Go' },
  { a: 'Docker', b: 'Kubernetes' },
  { a: 'Python', b: 'Java' },
  { a: 'AWS', b: 'GCP' },
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
  const [showConfetti, setShowConfetti] = useState(false);
  const { user, openAuthModal, getToken } = useAuth();

  const startBattleWith = (a: string, b: string) => {
    setSkillA(a);
    setSkillB(b);
    if (!user) {
      openAuthModal();
      return;
    }
    executeBattle(a, b);
  };

  const executeBattle = async (a: string, b: string) => {
    if (!a || !b) return;
    setIsBattling(true);
    setAiVerdict('');
    setShowConfetti(false);

    let finalResult = conductSkillBattle(a, b);

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
      setShowConfetti(true);

      // Magic UI Confetti burst
      try {
        const end = Date.now() + 2.2 * 1000;
        const colors = ['#FF4D8B', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

        (function frame() {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors: colors,
            zIndex: 9999,
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors: colors,
            zIndex: 9999,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      } catch (err) {
        console.warn('Confetti burst error:', err);
      }

      setTimeout(() => setShowConfetti(false), 5500);

      // Fetch AI architect verdict
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
    }, 650);
  };

  const handleBattle = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    executeBattle(skillA, skillB);
  };

  const handleReset = () => {
    setShowConfetti(false);
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
    <div className="w-full max-w-4xl mx-auto py-2 px-4 relative select-none">
      {/* Magic UI Confetti canvas */}
      {showConfetti && (
        <Confetti className="fixed inset-0 z-50 pointer-events-none w-full h-full" />
      )}

      {/* Header section matching site typography */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-[11px] text-brand-pink font-mono font-bold tracking-widest uppercase shadow-sm">
            <Swords size={12} className="fill-current" /> SKILL BATTLE ENGINE
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl text-ink mb-3 text-center tracking-tight font-black leading-tight">
          Compare market demand for <br />
          <span className="text-brand-pink italic font-serif font-normal">your target skills</span>
        </h1>

        <p className="font-sans text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed text-center font-medium">
          Compare market adoption, salary premiums, and growth rates across 320k+ profiles.
        </p>
      </div>

      {/* Main Tactile Card Wrapper */}
      <div className="bg-surface-card/90 border border-hairline p-5 sm:p-8 rounded-[28px] shadow-2xl tactile-card backdrop-blur-xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="battle-setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 space-y-6"
            >
              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">
                {/* Option A Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-muted font-bold block ml-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={skillA}
                    onChange={(e) => setSkillA(e.target.value)}
                    placeholder="e.g. React"
                    className="w-full h-14 sm:h-16 px-6 bg-canvas border border-hairline rounded-[20px] font-display text-xl text-ink placeholder:text-muted/40 focus:outline-none focus:border-brand-pink transition-all tactile-input shadow-sm"
                  />
                </div>

                {/* Center VS Badge */}
                <div className="flex items-center justify-center py-1 md:py-0 md:mt-5">
                  <div className="w-11 h-11 rounded-full bg-ink text-white font-mono font-black text-xs flex items-center justify-center shadow-md border-2 border-surface-card">
                    VS
                  </div>
                </div>

                {/* Option B Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-muted font-bold block ml-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={skillB}
                    onChange={(e) => setSkillB(e.target.value)}
                    placeholder="e.g. Vue"
                    className="w-full h-14 sm:h-16 px-6 bg-canvas border border-hairline rounded-[20px] font-display text-xl text-ink placeholder:text-muted/40 focus:outline-none focus:border-brand-teal transition-all tactile-input shadow-sm"
                  />
                </div>
              </div>

              {/* SINGLE CLEAN LINE OF 5 PRESETS */}
              <div className="pt-4 border-t border-hairline/60 space-y-3">
                <div className="text-center">
                  <span className="text-[11px] font-mono font-bold text-muted uppercase tracking-widest">
                    Popular Matchups
                  </span>
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-2.5 overflow-x-auto pb-0.5">
                  {PRESET_MATCHUPS.map((p) => (
                    <button
                      key={`${p.a}-${p.b}`}
                      onClick={() => startBattleWith(p.a, p.b)}
                      className="shrink-0 px-3.5 py-2 rounded-[14px] bg-canvas border border-hairline hover:border-brand-pink/60 text-xs font-mono font-bold text-ink hover:text-brand-pink transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>{p.a}</span>
                      <span className="text-[10px] text-muted font-bold uppercase">vs</span>
                      <span>{p.b}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Tactile Button */}
              <div className="pt-2 flex justify-center">
                <div className="bg-surface-card/90 border border-hairline p-2 sm:p-2.5 rounded-[24px] shadow-xl tactile-card inline-flex">
                  <button
                    type="button"
                    disabled={user ? (!skillA || !skillB || isBattling) : false}
                    onClick={handleBattle}
                    className="flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 bg-ink text-white rounded-[18px] font-mono font-black text-xs sm:text-sm tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.97] tactile-button cursor-pointer shadow-md group disabled:opacity-40"
                  >
                    <span>{isBattling ? 'RUNNING BATTLE...' : 'START BATTLE'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5 text-[10px] text-muted font-mono font-bold uppercase tracking-[0.2em] pt-2">
                <span>320K+ PROFILES INDEXED</span>
                <span className="w-1 h-1 rounded-full bg-hairline" />
                <span>ADAPTIVE AI FALLBACK</span>
              </div>
            </motion.div>
          ) : (
            /* Results Screen */
            <motion.div
              key="battle-result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 space-y-8"
            >
              {result && (
                <>
                  {/* Tug-of-War Progress Bar */}
                  <div className="p-6 rounded-[24px] bg-canvas border border-hairline space-y-3 shadow-sm">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-brand-pink flex items-center gap-2">
                        {result.optionA.name} ({result.shareA}%)
                      </span>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-hairline text-[10px] text-muted uppercase font-mono font-bold tracking-wider">
                        {result.isAiEstimated ? (
                          <span className="flex items-center gap-1 text-brand-purple">
                            <Bot size={12} /> AI Sample Estimate
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-brand-pink">
                            <Zap size={12} /> Live Market Split
                          </span>
                        )}
                      </div>

                      <span className="text-brand-teal flex items-center gap-2">
                        ({result.shareB}%) {result.optionB.name}
                      </span>
                    </div>

                    <div className="w-full h-4 rounded-full bg-surface-soft overflow-hidden flex border border-hairline p-0.5">
                      <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${result.shareA}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-brand-pink rounded-l-full"
                      />
                      <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${result.shareB}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-brand-teal rounded-r-full"
                      />
                    </div>
                  </div>

                  {/* Option Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option A Card */}
                    <div
                      className={`p-6 sm:p-7 rounded-[24px] border transition-all ${
                        result.winner === 'A'
                          ? 'bg-canvas border-brand-pink/60 shadow-lg relative ring-2 ring-brand-pink/20'
                          : 'bg-surface-soft/60 border-hairline opacity-80'
                      }`}
                    >
                      {result.winner === 'A' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-pink/10 border border-brand-pink/30 text-brand-pink font-mono text-[10px] font-bold uppercase tracking-wider mb-4">
                          <Trophy size={12} />
                          Market Lead
                        </div>
                      )}
                      <div className="flex justify-between items-baseline mb-6">
                        <h3 className="font-display text-3xl text-ink font-bold">{result.optionA.name}</h3>
                        <span className="font-mono text-2xl font-bold text-brand-pink">
                          {result.shareA}%
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-hairline/60 pb-2.5">
                          <span className="text-muted">Job Postings</span>
                          <span className="text-ink font-bold">{result.optionA.votes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-hairline/60 pb-2.5">
                          <span className="text-muted">Salary Premium</span>
                          <span className="text-brand-teal font-bold">+${result.optionA.premium.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Growth Trajectory</span>
                          <span className="text-brand-pink font-bold">+{Math.round(result.optionA.trend * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Option B Card */}
                    <div
                      className={`p-6 sm:p-7 rounded-[24px] border transition-all ${
                        result.winner === 'B'
                          ? 'bg-canvas border-brand-teal/60 shadow-lg relative ring-2 ring-brand-teal/20'
                          : 'bg-surface-soft/60 border-hairline opacity-80'
                      }`}
                    >
                      {result.winner === 'B' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal font-mono text-[10px] font-bold uppercase tracking-wider mb-4">
                          <Trophy size={12} />
                          Market Lead
                        </div>
                      )}
                      <div className="flex justify-between items-baseline mb-6">
                        <h3 className="font-display text-3xl text-ink font-bold">{result.optionB.name}</h3>
                        <span className="font-mono text-2xl font-bold text-brand-teal">
                          {result.shareB}%
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between border-b border-hairline/60 pb-2.5">
                          <span className="text-muted">Job Postings</span>
                          <span className="text-ink font-bold">{result.optionB.votes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-hairline/60 pb-2.5">
                          <span className="text-muted">Salary Premium</span>
                          <span className="text-brand-teal font-bold">+${result.optionB.premium.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Growth Trajectory</span>
                          <span className="text-brand-pink font-bold">+{Math.round(result.optionB.trend * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Verdict Card */}
                  <div className="bg-ink text-on-primary p-6 sm:p-8 rounded-[24px] border border-hairline shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-on-primary/70">
                          Data Verdict & Analysis
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-on-primary/50 uppercase">
                        {result.isAiEstimated ? 'AI Model Verdict' : 'Indexed Market'}
                      </span>
                    </div>

                    <h4 className="font-display text-2xl sm:text-3xl leading-snug text-on-primary">
                      {result.verdict}
                    </h4>

                    {/* Highlights */}
                    {result.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {result.highlights.map((highlight, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-mono font-semibold text-on-primary border border-white/10"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Architect Summary */}
                    <div className="pt-4 border-t border-white/15 space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-teal">
                        Architect Summary
                      </span>
                      <div className="min-h-[2.5rem] flex items-center">
                        {isAiLoading ? (
                          <div className="flex gap-2 items-center text-xs font-mono text-on-primary/60">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-brand-teal" />
                            Synthesizing career advice...
                          </div>
                        ) : (
                          <p className="text-sm font-sans text-on-primary/80 leading-relaxed italic">
                            {aiVerdict || "Both technologies are valuable. Master core paradigms before making stack transitions."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metric Summary Tally */}
                    <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 text-center font-mono">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-on-primary/60 uppercase mb-1">
                          <Users size={12} /> Samples
                        </div>
                        <div className="text-lg font-bold text-on-primary">{result.totalVotes.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-on-primary/60 uppercase mb-1">
                          <TrendingUp size={12} /> Growth
                        </div>
                        <div className="text-lg font-bold text-brand-pink">
                          +{Math.round((result.winner === 'A' ? result.optionA.trend : result.optionB.trend) * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-on-primary/60 uppercase mb-1">
                          <DollarSign size={12} /> Top Premium
                        </div>
                        <div className="text-lg font-bold text-brand-teal">
                          +${((result.winner === 'A' ? result.optionA.premium : result.optionB.premium) / 1000).toFixed(1)}k
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions matching site button style */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="bg-surface-card/90 border border-hairline p-2 rounded-[22px] shadow-lg inline-flex">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-ink text-white rounded-[16px] font-mono font-bold text-xs tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.97] cursor-pointer"
                      >
                        {copiedShare ? <Check size={14} className="text-brand-teal" /> : <Share2 size={14} />}
                        <span>{copiedShare ? 'LINK COPIED' : 'SHARE VERDICT'}</span>
                      </button>
                    </div>

                    <div className="bg-surface-card/90 border border-hairline p-2 rounded-[22px] shadow-lg inline-flex">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-canvas border border-hairline text-ink rounded-[16px] font-mono font-bold text-xs tracking-wider uppercase transition-all hover:bg-surface-soft active:scale-[0.97] cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>NEW BATTLE</span>
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
