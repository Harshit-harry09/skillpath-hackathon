'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, HelpCircle, Target } from 'lucide-react';
import { saveToHistory } from '@/lib/history';

const LOADING_MESSAGES = [
  "Parsing role requirements...",
  "Mapping skill architecture...",
  "Building learning path...",
  "Almost there...",
];

export default function JobTitleInput() {
  const [jobTitle, setJobTitle] = useState('');
  const [isExploring, setIsExploring] = useState(false);
  const [error, setError] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(0);
  const router = useRouter();

  const handleExplore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || isExploring) return;

    setIsExploring(true);
    setError('');
    setLoadingMsg(0);

    // Cycle through loading messages
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    try {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: jobTitle }),
      });

      const data = await res.json();

      if (res.ok && data.share_token) {
        saveToHistory({
          type: 'explore',
          share_token: data.share_token,
          weeks_required: data.total_weeks || 0,
          company_type: data.company_type || 'unknown',
          mvc_skills: data.mvc_skills || [],
          created_at: new Date().toISOString(),
          jd_preview: data.job_title_raw || jobTitle,
        });

        // Cache full exploration payload for instant 0ms page load
        try {
          sessionStorage.setItem(`explore_${data.share_token}`, JSON.stringify(data));
        } catch {
          // quota fallback
        }

        router.push(`/explore/${data.share_token}`);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
        setIsExploring(false);
      }
    } catch (err) {
      console.error('Explore error:', err);
      setError('Failed to connect to the server. Please check your connection and try again.');
      setIsExploring(false);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[11px] text-brand-teal font-bold tracking-widest uppercase">
            <Sparkles size={12} className="fill-current" />
            AI Exploration Engine
          </span>
          
          <div className="relative group/help">
            <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <HelpCircle size={14} className="text-ink/30 group-hover/help:text-brand-teal transition-colors" />
            </button>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-black/10 dark:border-white/10 shadow-2xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none text-left">
              <div className="flex items-center gap-2 mb-2">
                <Target size={12} className="text-brand-teal" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Precision Tip</span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink/70 dark:text-white/70">
                Be specific with your title. Instead of just "Engineer", try <span className="text-ink dark:text-white font-bold">"Junior Backend Developer"</span> or <span className="text-ink dark:text-white font-bold">"Senior Product Designer"</span>.
                <br/><br/>
                <span className="text-brand-teal font-bold">Note:</span> If no level is specified, we baseline your path for <span className="italic font-bold">Mid-level</span> requirements.
              </p>
              <div className="absolute left-1/2 -translate-x-1/2 top-full border-8 border-transparent border-t-white dark:border-t-zinc-900" />
            </div>
          </div>
        </div>
        <h1 className="font-display text-display-lg text-ink mb-6 text-center">
          What's your <br />
          <span className="text-primary italic font-serif">dream job?</span>
        </h1>
        <p className="font-sans text-[20px] text-muted max-w-xl mx-auto leading-relaxed">
          Enter a role, and we'll map out the exact skills, projects, and path to get you there.
        </p>
      </motion.div>

      <form onSubmit={handleExplore} className="relative max-w-3xl mx-auto">
        <div className="bg-surface-strong p-3 rounded-xl border border-hairline shadow-sm flex flex-col md:flex-row gap-3 mb-6 tactile-card">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => { setJobTitle(e.target.value); setError(''); }}
            placeholder="e.g. Senior Data Analyst, Lead Product Manager..."
            className="flex-1 bg-canvas py-6 px-8 text-lg md:text-xl font-sans text-ink border border-ink/15 rounded-lg focus:border-ink/40 focus:outline-none transition-all placeholder:text-ink/40 tactile-input"
            disabled={isExploring}
            autoFocus
          />
          <button
            type="submit"
            disabled={!jobTitle.trim() || isExploring}
            className={`flex items-center justify-center gap-3 px-10 py-6 md:py-0 bg-primary dark:bg-brand-pink text-on-primary dark:text-white rounded-lg font-sans font-semibold text-button transition-all hover:bg-primary-active dark:hover:opacity-90 active:scale-[0.98] tactile-button ${isExploring ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isExploring ? (
              <span className="flex items-center gap-3">
                <div className="flex gap-0.5 items-end h-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-current rounded-full"
                      animate={{ height: ['40%', '100%', '40%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
                MAPPING...
              </span>
            ) : (
              <>
                START EXPLORATION
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 px-6 py-3 rounded-xl bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[12px] font-semibold text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading message */}
        <AnimatePresence mode="wait">
          {isExploring && (
            <motion.div
              key={loadingMsg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mb-6 text-center"
            >
              <p className="text-[13px] text-muted font-medium italic">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex items-center gap-6 text-[10px] text-muted font-bold uppercase tracking-[0.2em]">
            <span>NO RESUME REQUIRED</span>
            <span className="w-1 h-1 rounded-full bg-hairline" />
            <span>AI POWERED ANALYSIS</span>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
