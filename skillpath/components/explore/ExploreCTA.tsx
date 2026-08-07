'use client';
// updated

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileUp } from 'lucide-react';
import { getHistory } from '@/lib/history';

interface ExploreCTAProps {
  explorationData?: {
    role: string;
    seniority: string;
    company_type: string;
    mvc_skills: string[];
    job_title_raw: string;
  };
}

export default function ExploreCTA({ explorationData }: ExploreCTAProps) {
  const router = useRouter();

  const handleStartAnalysis = () => {
    if (!explorationData) {
      router.push('/analyze');
      return;
    }

    // Synthesize a structured JD from the exploration data
    const synthesizedJd = `Role: ${explorationData.role}\nSeniority: ${explorationData.seniority}\nContext: ${explorationData.company_type}\n\nCore Requirements:\n${explorationData.mvc_skills.map(s => `- ${s}`).join('\n')}\n\nGenerated from market intelligence exploration for "${explorationData.job_title_raw}".`;

    // Store in session storage for the Analyze page to pick up
    sessionStorage.setItem('pending_jd', synthesizedJd);
    
    // Attempt to find the most recent resume from history to enable auto-trigger
    const history = getHistory();
    const lastAnalysis = history.find(h => h.resume_text || h.type === 'analyze');
    
    if (lastAnalysis?.resume_text) {
      sessionStorage.setItem('pending_resume', lastAnalysis.resume_text);
    }

    router.push('/analyze');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center pt-0 pb-0 mt-32"
    >
      <div className="max-w-xl mx-auto p-10 md:p-12 rounded-[40px] bg-surface-card shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15),0_0_40px_rgba(0,0,0,0.03)] border border-ink/10 relative overflow-hidden group tactile-card">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-pink/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 opacity-80" />
        
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="font-display text-[40px] md:text-[48px] text-ink mb-6 leading-[1.1] tracking-tight drop-shadow-sm">
            Now see your <br />
            <span className="text-brand-pink">personal gap</span>
          </h2>
          
          <p className="font-sans text-[16px] text-muted mb-10 max-w-sm mx-auto leading-relaxed font-medium">
            Benchmark your current profile against this market-active model to see exactly what you&apos;re missing.
          </p>
          
          <button
            onClick={handleStartAnalysis}
            className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-on-primary rounded-xl font-sans font-bold text-button shadow-[0_10px_30px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_5px_15px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] uppercase tracking-[0.1em] tactile-button"
          >
            {explorationData ? 'Analyze My Gap →' : 'Upload Resume →'}
          </button>
          
          <p className="font-sans font-bold text-[10px] text-muted uppercase tracking-[0.2em] mt-10">
            Start your elite transformation
          </p>
        </div>
      </div>
    </motion.div>
  );
}
