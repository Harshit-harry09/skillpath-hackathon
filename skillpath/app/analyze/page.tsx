'use client';
// updated

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DropZone } from '@/components/ui/DropZone';
import { saveToHistory } from '@/lib/history';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Upload, ChevronRight, Target, Star, HelpCircle, AlertCircle, Trash2, CheckCircle2, ShieldCheck, Zap, ArrowRight, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DreamOnboarding, type DreamContext } from '@/components/analyze/DreamOnboarding';
import { useDraft } from '@/context/DraftContext';
import { ResumeBackground } from '@/components/analyze/ResumeBackground';

const MOTIVATIONAL_QUOTES = [
  "Parsing tech stack vectors...",
  "Cross-referencing JD requirements...",
  "Calculating exact skill delta...",
  "Pinpointing high-priority skill gaps...",
  "Building 12-week targeted syllabus...",
  "Optimizing interview impact score...",
  "Finalizing your precision roadmap...",
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
  const { draft, clearDraft } = useDraft();
  const [mode, setMode] = useState<'job' | 'dream'>('job');
  const [inputTab, setInputTab] = useState<'file' | 'text'>('file');
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
    try {
      const pendingJd = sessionStorage.getItem('pending_jd');
      if (pendingJd && pendingJd.trim()) {
        setJd(pendingJd.trim());
        sessionStorage.removeItem('pending_jd');
      }
    } catch {
      // Storage retrieval fallback
    }

    if (draft.jd) setJd(draft.jd);
    if (draft.resumeText) {
      setResumeText(draft.resumeText);
      setInputTab('text');
      setAutoTrigger(true);
    }
    if (draft.jd || draft.resumeText) clearDraft();
  }, [draft, clearDraft]);

  const isFormValid = jd.trim().length > 0 && (file !== null || resumeText.trim().length > 0);

  const handleAnalyze = async () => {
    if (!jd.trim()) {
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

      const token = user ? await getToken() : null;
      const formData = new FormData();
      formData.append('jd_text', jd);

      if (mode === 'dream' && dreamContext) {
        formData.append('dream_role', dreamContext.dreamRole);
        formData.append('current_role', dreamContext.currentRole);
        formData.append('experience_level', dreamContext.experience);
        formData.append('target_company', dreamContext.companyType);
      }

      if (file && inputTab === 'file') {
        formData.append('resume_file', file);
      } else {
        formData.append('resume_text', resumeText);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
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
      });

      router.push(`/results/${data.share_token}?new=true`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const msg = err.message || 'Something went wrong';
      const hint = err instanceof AnalysisError && err.hint ? `\n\nHint: ${err.hint}` : '';
      setError(`${msg}${hint}`);
      setIsAnalyzing(false);
    }
  };

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
      }, 3500);
    } else {
      setQuoteIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <main className="flex flex-col min-h-screen bg-[#F5F4EE] dark:bg-[#060608] text-ink relative font-sans overflow-x-hidden selection:bg-brand-pink selection:text-white">
      {/* Lightweight Resume Canvas Background */}
      <ResumeBackground
        hasResume={Boolean(file || resumeText.trim())}
        resumeName={file?.name || (resumeText ? 'Pasted Text Resume' : null)}
        mode={mode}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center pt-24 md:pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <motion.div
          key="analyze-form"
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Section */}
          <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card dark:bg-[#111116] border border-black/10 dark:border-white/10 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] text-xs text-ink dark:text-white font-bold tracking-widest uppercase mb-5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Sparkles size={13} className="text-brand-pink fill-current" />
              SkillPath Delta Analysis
            </motion.div>

            <h1 className="font-display text-display-md sm:text-display-lg text-ink dark:text-white mb-4 text-center leading-[1.08] tracking-tight">
              Paste the Job Description.<br className="hidden sm:block" /> Drop your Resume.
            </h1>

            <p className="font-sans text-base sm:text-lg text-muted dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Our vector matching engine computes the exact delta between your background and your target tech role in seconds.
            </p>
          </div>

          {/* Form Cards Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10 transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Card 1: Target Job Description or Dream */}
            <div className="flex flex-col bg-surface-card dark:bg-[#0c0c0f] border-2 border-bold-border rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-[4px_4px_0_var(--bold-border)] transition-all">
              {/* Card Header & Mode Switcher */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => setMode('job')}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${mode === 'job' ? 'text-ink dark:text-white' : 'text-ink/60 dark:text-white/60 hover:text-ink'}`}
                  >
                    {mode === 'job' && (
                      <motion.div
                        layoutId="target-mode-pill"
                        className="absolute inset-0 bg-white dark:bg-[#1a1a22] rounded-lg shadow-sm border border-black/5 dark:border-white/10"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Target size={13} className={mode === 'job' ? 'text-brand-teal' : ''} />
                      Target Job
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => setMode('dream')}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${mode === 'dream' ? 'text-ink dark:text-white' : 'text-ink/60 dark:text-white/60 hover:text-ink'}`}
                  >
                    {mode === 'dream' && (
                      <motion.div
                        layoutId="target-mode-pill"
                        className="absolute inset-0 bg-white dark:bg-[#1a1a22] rounded-lg shadow-sm border border-black/5 dark:border-white/10"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Star size={13} className={mode === 'dream' ? 'text-brand-pink fill-current' : ''} />
                      Career Dream
                    </span>
                  </button>
                </div>

                <div className="relative group/help">
                  <button type="button" className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <HelpCircle size={15} className="text-muted dark:text-gray-400 group-hover/help:text-brand-teal transition-colors" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white dark:bg-[#14141a] rounded-xl border-2 border-bold-border shadow-[4px_4px_0_var(--bold-border)] opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Zap size={13} className="text-brand-pink" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-ink dark:text-white">Precision Hint</span>
                    </div>
                    <p className="text-xs text-muted dark:text-gray-300 leading-relaxed">
                      For accurate skill extractions, paste the complete Job Description including qualifications and responsibilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="relative flex-1 flex flex-col min-h-[260px] sm:min-h-[300px] rounded-xl overflow-hidden bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 transition-all focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20">
                {mode === 'dream' ? (
                  <div className="flex flex-col h-full">
                    <textarea
                      disabled={isAnalyzing}
                      aria-label="Career Dream Description"
                      placeholder="Describe your ultimate target role (e.g. Senior Staff Frontend Engineer building real-time data pipelines at scale)..."
                      className="w-full h-full min-h-[220px] p-4 sm:p-5 font-sans text-sm text-ink dark:text-gray-100 placeholder:text-muted/60 bg-transparent focus:outline-none resize-none leading-relaxed"
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                    />
                    <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => setShowDreamOnboarding(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-pink/10 hover:bg-brand-pink/20 border border-brand-pink/30 text-brand-pink text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        <Sparkles size={14} className="fill-current" />
                        Calibrate with AI Dreamer Modal
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    disabled={isAnalyzing}
                    aria-label="Job Description"
                    placeholder="Paste the target job description here (Role, Responsibilities, Required Tech Stack)..."
                    className="w-full h-full min-h-[260px] sm:min-h-[300px] p-4 sm:p-5 font-sans text-sm text-ink dark:text-gray-100 placeholder:text-muted/60 bg-transparent focus:outline-none resize-none leading-relaxed"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                  />
                )}

                {/* Counter Footer */}
                <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-muted dark:text-gray-400">
                  <span>{jd ? `${jd.trim().split(/\s+/).filter(Boolean).length} words` : 'Empty'}</span>
                  {jd && (
                    <button
                      type="button"
                      onClick={() => setJd('')}
                      className="text-xs hover:text-brand-pink transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Career History / Resume */}
            <div className="flex flex-col bg-surface-card dark:bg-[#0c0c0f] border-2 border-bold-border rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-[4px_4px_0_var(--bold-border)] transition-all">
              {/* Header with File / Text Tabs */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-teal/10 dark:bg-brand-teal/20 flex items-center justify-center border border-brand-teal/20">
                    <FileText size={14} className="text-brand-teal" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-white">Career History</span>
                </div>

                {/* Input Method Switcher */}
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setInputTab('file')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${inputTab === 'file' ? 'bg-white dark:bg-[#1a1a22] text-ink dark:text-white shadow-sm' : 'text-muted dark:text-gray-400 hover:text-ink'}`}
                  >
                    PDF File
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('text')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${inputTab === 'text' ? 'bg-white dark:bg-[#1a1a22] text-ink dark:text-white shadow-sm' : 'text-muted dark:text-gray-400 hover:text-ink'}`}
                  >
                    Raw Text
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex-1 flex flex-col min-h-[260px] sm:min-h-[300px]">
                <AnimatePresence mode="wait">
                  {inputTab === 'file' ? (
                    <motion.div
                      key="file-tab"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="h-full flex-1"
                    >
                      <DropZone
                        disabled={isAnalyzing}
                        onFileSelect={(f) => setFile(f)}
                        className="h-full min-h-[260px] sm:min-h-[300px]"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="text-tab"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex-1 flex flex-col h-full rounded-xl overflow-hidden bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 transition-all focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20"
                    >
                      <textarea
                        disabled={isAnalyzing}
                        aria-label="Resume Text"
                        placeholder="Paste your resume text here (Work Experience, Skills, Education, Projects)..."
                        className="w-full h-full min-h-[220px] p-4 sm:p-5 font-sans text-sm text-ink dark:text-gray-100 placeholder:text-muted/60 bg-transparent focus:outline-none resize-none leading-relaxed"
                        value={resumeText === ' ' ? '' : resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        autoFocus
                      />
                      <div className="px-4 py-2 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-muted dark:text-gray-400">
                        <span>{resumeText ? `${resumeText.trim().split(/\s+/).filter(Boolean).length} words` : 'Empty'}</span>
                        {resumeText && (
                          <button
                            type="button"
                            onClick={() => setResumeText('')}
                            className="text-xs hover:text-brand-pink transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={11} /> Clear
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-md"
              >
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 whitespace-pre-line leading-relaxed">{error}</div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-100 p-1"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Footer & Submit Button */}
          <div className="flex flex-col items-center max-w-xl mx-auto">
            <div className="w-full relative group">
              {/* Button Glow Backdrop */}
              <div className="absolute inset-0 bg-brand-pink/20 dark:bg-brand-pink/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <button
                id="analyze-trigger-btn"
                disabled={!isFormValid || isAnalyzing}
                onClick={handleAnalyze}
                className="relative w-full h-14 sm:h-16 bg-brand-pink text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-xl border-2 border-bold-border shadow-[4px_4px_0_var(--bold-border)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bold-border)] active:translate-y-0.5 active:shadow-[2px_2px_0_var(--bold-border)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3 overflow-hidden cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-3 px-4"
                    >
                      <div className="flex gap-1 items-end h-3.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-white rounded-full"
                            animate={{ height: ['30%', '100%', '30%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm font-mono font-bold tracking-normal truncate max-w-[280px]">
                        {MOTIVATIONAL_QUOTES[quoteIndex]}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="default-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      Generate Vector Delta Analysis
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Status & Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-muted dark:text-gray-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  100% Encrypted
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={13} className="text-brand-pink" />
                  Fast AI Extraction
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={13} className="text-brand-teal" />
                  12-Week Syllabus
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dream Onboarding Modal */}
      <AnimatePresence>
        {showDreamOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <div className="w-full max-w-2xl my-auto">
              <div className="bg-surface-card dark:bg-[#0c0c0f] p-6 sm:p-10 rounded-2xl md:rounded-3xl border-2 border-bold-border shadow-[8px_8px_0_var(--bold-border)] relative overflow-hidden">
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
