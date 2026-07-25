'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { DropZone } from '@/components/ui/DropZone';
import { saveToHistory } from '@/lib/history';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Upload, ChevronRight, Target, Star, HelpCircle } from 'lucide-react';
import { GenerativeArtScene } from '@/components/ui/anomalous-matter-hero';
import { useAuth } from '@/context/AuthContext';
import { DreamOnboarding, type DreamContext } from '@/components/analyze/DreamOnboarding';
import { Button } from '@/components/ui/Button';


const MOTIVATIONAL_QUOTES = [
  "Deep analyzing your profile...",
  "Cross-referencing JD requirements...",
  "Identifying competitive advantages...",
  "Pinpointing critical skill gaps...",
  "Crafting your custom mastery plan...",
  "Optimizing for maximum interview impact...",
  "Almost there. Polishing your roadmap...",
];

class AnalysisError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'AnalysisError';
    this.hint = hint;
  }
}

export default function AnalyzePage() {
  const router = useRouter();
  const { user, openAuthModal, getToken } = useAuth();
  const [mode, setMode] = useState<'job' | 'dream'>('job');
  const [jd, setJd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDreamOnboarding, setShowDreamOnboarding] = useState(false);
  const [dreamContext, setDreamContext] = useState<DreamContext | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [error, setError] = useState('');

  const [autoTrigger, setAutoTrigger] = useState(false);

  useEffect(() => {
    const pendingJd = sessionStorage.getItem('pending_jd');
    const pendingResume = sessionStorage.getItem('pending_resume');
    
    if (pendingJd && pendingResume) {
      setJd(pendingJd);
      setResumeText(pendingResume);
      setAutoTrigger(true);
      
      // Clean up storage immediately
      sessionStorage.removeItem('pending_jd');
      sessionStorage.removeItem('pending_resume');
    }
  }, []);

  const isFormValid = jd.trim().length > 0 && (file !== null || resumeText.trim().length > 0);

  const handleAnalyze = async () => {
    if (!user) {
      setError('Please sign in to analyze your resume.');
      openAuthModal();
      return;
    }

    if (!jd) {
      setError(mode === 'job' ? 'Please paste a job description.' : 'Please describe your career dream.');
      return;
    }

    setError('');
    setIsAnalyzing(true);

    try {
      if (!file && !resumeText.trim()) {
        setError('Please upload a resume or paste your resume text.');
        setIsAnalyzing(false);
        return;
      }

      const token = await getToken();
      const formData = new FormData();
      formData.append('jd_text', jd);

      // Pass structured dream context to API for personalized results
      if (mode === 'dream' && dreamContext) {
        formData.append('dream_role', dreamContext.dreamRole);
        formData.append('current_role', dreamContext.currentRole);
        formData.append('experience_level', dreamContext.experience);
        formData.append('target_company', dreamContext.companyType);
      }

      if (file) {
        formData.append('resume_file', file);
      } else {
        formData.append('resume_text', resumeText);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AnalysisError(errorData.message || 'Analysis failed', errorData.hint);
      }

      const data = await response.json();

      saveToHistory({
        type: 'analyze',
        share_token: data.share_token,
        gap_score: data.gap_score,
        weeks_required: data.weeks_required,
        company_type: data.company_type,
        mvc_skills: data.mvc_skills || [],
        created_at: data.created_at,
        jd_preview: jd.slice(0, 80),
        resume_text: data.resume_text || resumeText
      });

      // Save full analysis payload to sessionStorage for instant 0ms result rendering
      try {
        sessionStorage.setItem(`analysis_${data.share_token}`, JSON.stringify(data));
      } catch {
        // quota fallback
      }

      router.push(`/results/${data.share_token}?new=true`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const msg = err.message || 'Something went wrong';
      const hint = err instanceof AnalysisError && err.hint ? `\n\nHint: ${err.hint}` : '';
      setError(`${msg}${hint}`);
      setIsAnalyzing(false);
    }
  };

  // Reliability check: trigger when form is definitely ready
  useEffect(() => {
    if (autoTrigger && isFormValid && !isAnalyzing) {
      const timer = setTimeout(() => {
        handleAnalyze();
        setAutoTrigger(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, isFormValid, isAnalyzing]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, 4000);
    } else {
      setQuoteIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const bars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <main className="flex flex-col min-h-screen bg-[#F5F4EE] dark:bg-canvas text-ink relative font-sans overflow-hidden">
      {/* Generative Background */}
      <div className="fixed inset-0 z-0 bg-canvas pointer-events-none" />
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-40">
        <GenerativeArtScene />
      </div>
      <div className="fixed inset-0 z-[2] bg-gradient-to-b from-canvas/20 via-transparent to-canvas/80 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center pt-24 md:pt-32 pb-32 px-4 md:px-8">
        <motion.div
          key="analyze-form"
          className="w-full max-w-[800px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
        >
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-xs text-brand-teal font-bold tracking-widest uppercase mb-6">
              <Sparkles size={12} className="fill-current" />
              Vector Analysis Phase 01
            </span>
            <h1 className="font-display text-display-lg text-ink mb-6 text-center">
              Paste the job.<br />Drop the resume.
            </h1>
            <p className="font-sans text-[20px] text-muted max-w-xl mx-auto leading-relaxed">
              Our analysis engine calculates the exact delta between your profile and your target role.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 transition-opacity duration-500 ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* Target Job Section */}
            <div className="flex flex-col h-full bg-[#EBE9DC] dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.05),-8px_-8px_20px_rgba(255,255,255,0.4),inset_1px_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_0_40px_rgba(0,0,0,0.2)] relative group transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-[16px] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.25)] dark:shadow-[inset_0_0_5px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/5 relative">
                    <button
                      disabled={isAnalyzing}
                      onClick={() => setMode('job')}
                      className={`relative px-3 md:px-5 py-1.5 md:py-2 rounded-[10px] md:rounded-[12px] text-xs font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${mode === 'job' ? 'text-ink dark:text-white' : 'text-ink/60 hover:text-ink/80'}`}
                    >
                      {mode === 'job' && (
                        <motion.div
                          layoutId="target-mode-pill"
                          className="absolute inset-0 bg-[#EBE9DC] dark:bg-[#1A1A1A] rounded-[10px] md:rounded-[12px] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.3)] dark:shadow-none"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-20">Target Job</span>
                    </button>
                    <button
                      disabled={isAnalyzing}
                      onClick={() => setMode('dream')}
                      className={`relative px-3 md:px-5 py-1.5 md:py-2 rounded-[10px] md:rounded-[12px] text-xs font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${mode === 'dream' ? 'text-ink dark:text-white' : 'text-ink/60 hover:text-ink/80'}`}
                    >
                      {mode === 'dream' && (
                        <motion.div
                          layoutId="target-mode-pill"
                          className="absolute inset-0 bg-[#EBE9DC] dark:bg-[#1A1A1A] rounded-[10px] md:rounded-[12px] shadow-[2px_2px_5px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.3)] dark:shadow-none"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-20">Dream</span>
                    </button>
                  </div>
                  
                  <div className="relative group/help">
                    <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
                      <HelpCircle size={14} className="text-ink/30 group-hover/help:text-brand-teal transition-colors" />
                    </button>
                    
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-black/10 dark:border-white/10 shadow-2xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={12} className="text-brand-teal" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Precision Tip</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink/70 dark:text-white/70">
                        Include the <span className="text-ink dark:text-white font-bold">Job Title</span> clearly at the start. 
                        <br/><br/>
                        <span className="text-brand-teal font-bold">Pro Tip:</span> Add "Junior" or "Senior" for specific mapping, otherwise we default to <span className="italic font-bold">Mid-level</span> baseline.
                      </p>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full border-8 border-transparent border-t-white dark:border-t-zinc-900" />
                    </div>
                  </div>
                </div>
                <Target size={16} className="text-ink/20" />
              </div>

              <div className="relative flex-1 rounded-[20px] overflow-hidden bg-black/[0.03] dark:bg-white/[0.02] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.25)] dark:shadow-[inset_2px_2px_10px_rgba(0,0,0,0.4)] border border-black/5 dark:border-white/5 transition-all focus-within:border-brand-teal/20">
                {mode === 'dream' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 relative">
                      <textarea
                        disabled={isAnalyzing}
                        aria-label="Career Dream Description"
                        placeholder="Describe your ultimate career goal (e.g. Lead Engineer at a fintech startup)..."
                        className="w-full h-full min-h-[240px] md:min-h-[340px] p-5 md:p-6 font-sans text-sm md:text-body-md text-ink placeholder:text-ink/50 bg-transparent focus:outline-none resize-none leading-relaxed"
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                      />
                      {!jd && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none opacity-20">
                          <Star className="text-brand-pink mb-2 animate-pulse" size={32} />
                          <p className="text-xs font-bold uppercase tracking-widest">Type your dream or use AI</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => setShowDreamOnboarding(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[11px] font-bold uppercase tracking-widest hover:bg-brand-pink/20 transition-all"
                      >
                        <Sparkles size={14} className="fill-current" />
                        Calibrate with AI Dreamer
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    disabled={isAnalyzing}
                    aria-label="Job Description"
                    placeholder="Paste the full job description here..."
                    className="w-full h-full min-h-[240px] md:min-h-[340px] p-5 md:p-6 font-sans text-sm md:text-body-md text-ink placeholder:text-ink/50 bg-transparent focus:outline-none resize-none leading-relaxed"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Career History Section */}
            <div className="flex flex-col h-full bg-[#EBE9DC] dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 rounded-[32px] p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.05),-8px_-8px_20px_rgba(255,255,255,0.4),inset_1px_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_0_40px_rgba(0,0,0,0.2)] relative group transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20">
                    <Upload size={14} className="text-brand-teal" />
                  </div>
                  <span className="text-xs text-ink font-bold uppercase tracking-widest">Career History</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {!resumeText ? (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="h-full"
                    >
                      <DropZone
                        disabled={isAnalyzing}
                        onFileSelect={(f) => setFile(f)}
                        className="h-full min-h-[320px]"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="textarea"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex-1 rounded-[20px] overflow-hidden bg-black/[0.03] dark:bg-white/[0.02] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.25)] dark:shadow-[inset_2px_2px_10px_rgba(0,0,0,0.4)] border border-black/5 dark:border-white/5 transition-all focus-within:border-brand-teal/20"
                    >
                      <textarea
                        disabled={isAnalyzing}
                        aria-label="Resume Text"
                        placeholder="Paste your raw resume text here..."
                        className="w-full h-full min-h-[240px] md:min-h-[340px] p-5 md:p-6 font-sans text-sm md:text-body-md text-ink placeholder:text-ink/50 bg-transparent focus:outline-none resize-none leading-relaxed"
                        value={resumeText === ' ' ? '' : resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-8 px-6 py-3 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-xs font-bold uppercase tracking-widest"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-[480px] relative group">
              <div className="absolute inset-0 bg-brand-teal/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <button
                id="analyze-trigger-btn"
                disabled={!isFormValid || isAnalyzing}
                onClick={handleAnalyze}
                className="relative w-full h-[56px] md:h-[64px] bg-brand-pink text-black font-display font-bold text-[13px] md:text-[15px] uppercase tracking-[0.15em] rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-brand-pink/90 active:scale-[0.98] disabled:opacity-20 shadow-[0_15px_30px_rgba(255,107,157,0.3)] flex items-center justify-center gap-3"
              >
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-4"
                    >
                      <div className="flex gap-1 items-end h-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-black rounded-full"
                            animate={{ height: ['40%', '100%', '40%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                      <span className="text-[13px] relative overflow-hidden h-[20px] min-w-[250px] flex items-center" aria-live="polite">
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={quoteIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="absolute left-0 whitespace-nowrap"
                          >
                            {MOTIVATIONAL_QUOTES[quoteIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="analyze"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-3"
                    >
                      Generate Vector Analysis
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-ink/60 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] leading-relaxed max-w-[280px] md:max-w-none mx-auto">
                  Encryption Secured · AI-Powered Insights · Real-time Market Mapping
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDreamOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/90 backdrop-blur-md overflow-y-auto"
          >
            <div className="w-full max-w-2xl my-auto">
              <div className="bg-[#EBE9DC] dark:bg-[#0A0A0A] p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-teal/5 blur-[80px] rounded-full -ml-32 -mb-32" />
                
                <div className="relative z-10">
                  <DreamOnboarding
                    onComplete={(desc, ctx) => {
                      setJd(desc);
                      setDreamContext(ctx);
                      setShowDreamOnboarding(false);
                    }}
                    onCancel={() => setShowDreamOnboarding(false)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
