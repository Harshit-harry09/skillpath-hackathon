'use client';

import React, { useState, useEffect } from 'react';
import type { CrystalBallNarrative } from '@/lib/atlas/crystal-ball/generator';
import { generateVisualShareCardDataUrl } from '@/lib/atlas/crystal-ball/share-card';
import { Sparkles, Download, Share2, Quote, Award, Building, DollarSign } from 'lucide-react';

interface CrystalBallViewProps {
  narrative: CrystalBallNarrative;
}

export function CrystalBallView({ narrative }: CrystalBallViewProps) {
  const [shareCardUrl, setShareCardUrl] = useState<string>('');

  useEffect(() => {
    generateVisualShareCardDataUrl(narrative)
      .then(setShareCardUrl)
      .catch((err) => console.warn('Share card render warning:', err));
  }, [narrative]);

  const handleDownload = () => {
    if (!shareCardUrl) return;
    const a = document.createElement('a');
    a.href = shareCardUrl;
    a.download = `Career-Crystal-Ball-${narrative.targetRole.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="space-y-8 my-8 p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl text-slate-100 shadow-2xl">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              CAREER CRYSTAL BALL 🔮
            </h2>
            <p className="text-xs text-slate-400 font-mono">6-Month Cinematic Future Dispatch</p>
          </div>
        </div>

        {shareCardUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Share Card</span>
          </button>
        )}
      </div>

      {/* Main Headline */}
      <h3 className="text-2xl md:text-3xl font-serif font-extrabold text-slate-50 leading-tight">
        {narrative.headline}
      </h3>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <Building className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="text-xs text-slate-400">Target Role</div>
            <div className="font-bold text-slate-200">{narrative.targetRole}</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400">Compensation</div>
            <div className="font-bold text-emerald-400">{narrative.salary}</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-xs text-slate-400">Target Employer</div>
            <div className="font-bold text-amber-300">{narrative.targetCompany}</div>
          </div>
        </div>
      </div>

      {/* Article Text */}
      <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-base space-y-4">
        <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-amber-400 first-letter:mr-2 first-letter:float-left">
          {narrative.narrativeText}
        </p>
      </div>

      {/* Quotes Grid */}
      <div className="grid md:grid-cols-2 gap-6 pt-4">
        <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/20 relative">
          <Quote className="w-8 h-8 text-amber-500/20 absolute top-3 right-3" />
          <div className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Hiring Manager Verdict</div>
          <p className="text-sm italic text-slate-200">{narrative.managerQuote}</p>
        </div>
        <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 relative">
          <Quote className="w-8 h-8 text-indigo-500/20 absolute top-3 right-3" />
          <div className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">Candidate Journey Reflection</div>
          <p className="text-sm italic text-slate-200">{narrative.userQuote}</p>
        </div>
      </div>

      {/* Share Card Preview */}
      {shareCardUrl && (
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Visual Share Card</span>
            <span className="text-xs text-amber-400">Ready for LinkedIn & Socials</span>
          </div>
          <div className="flex justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <img src={shareCardUrl} alt="Career Crystal Ball Share Card" className="max-w-md w-full rounded-lg shadow-2xl border border-amber-500/30" />
          </div>
        </div>
      )}
    </div>
  );
}
