// updated
import React from 'react';
import { ExternalLink, Sparkles, Target, Zap, Clock, SkipForward } from 'lucide-react';
import type { Resource } from '@/types/analysis';

interface ResourceCardProps {
  resource: Resource;
}

// YouTube search URLs are always valid — no fallback needed anymore
function buildYouTubeUrl(url: string, title: string): string {
  if (!url) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
  }
  const trimmed = url.trim();
  // Safety net: if somehow a direct video link slipped through, convert it
  if (trimmed.includes('youtube.com/watch') || trimmed.includes('youtu.be/')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
  }
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

function YouTubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const youtubeUrl = React.useMemo(
    () => buildYouTubeUrl(resource.url, resource.title),
    [resource.url, resource.title]
  );

  // Pull the human-readable hint out of the search URL if no search_hint field
  const searchHint = React.useMemo(() => {
    if ((resource as any).search_hint) return (resource as any).search_hint;
    try {
      const params = new URL(youtubeUrl).searchParams;
      return params.get('search_query')?.replace(/\+/g, ' ') ?? '';
    } catch {
      return '';
    }
  }, [youtubeUrl, resource]);

  const handleCardClick = () => {
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-surface-card border border-hairline rounded-md overflow-hidden transition-all group tactile-card cursor-pointer hover:border-red-500/30 hover:shadow-lg"
    >
      <div className="p-6">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="font-display text-title-sm text-ink group-hover:text-red-500 transition-colors">
                {resource.title}
              </h4>

              {/* YouTube badge — always shown since all links are YouTube */}
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-red-500/10 border border-red-500/20 text-[9px] text-red-500 font-bold tracking-widest uppercase">
                <YouTubeIcon size={8} />
                YOUTUBE
              </span>

              {resource.source === 'ai_generated' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[9px] text-brand-teal font-bold tracking-widest uppercase">
                  <Sparkles size={8} className="fill-current" />
                  AI CURATED
                </span>
              )}
            </div>

            {/* Search hint — shows what to look for on YouTube */}
            {searchHint && (
              <p className="font-mono text-[10px] text-muted tracking-wide truncate max-w-xs" title={searchHint}>
                🔍 {searchHint}
              </p>
            )}
          </div>

          {/* Open on YouTube button */}
          <button
            onClick={handleLinkClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40 transition-all text-red-500 text-[10px] font-bold uppercase tracking-widest shrink-0"
            title="Open YouTube search"
          >
            <YouTubeIcon size={12} />
            <span className="hidden sm:inline">Watch</span>
            <ExternalLink size={10} />
          </button>
        </div>

        {/* ── Body grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-hairline pt-8">
          <div className="space-y-6">
            {resource.start_at && (
              <div>
                <span className="flex items-center gap-2 font-sans text-[10px] text-muted font-bold uppercase tracking-widest mb-2">
                  <Clock size={10} className="text-brand-teal" />
                  Start At
                </span>
                <p className="font-mono text-body-sm text-ink font-semibold">{resource.start_at}</p>
              </div>
            )}

            {resource.skip_note && (
              <div>
                <span className="flex items-center gap-2 font-sans text-[10px] text-muted font-bold uppercase tracking-widest mb-2">
                  <SkipForward size={10} className="text-brand-pink" />
                  What to Skip
                </span>
                <p 
                  className="font-sans text-body-sm text-muted leading-relaxed italic border-l-2 border-brand-pink/30 pl-3 overflow-hidden line-clamp-3"
                  title={resource.skip_note}
                  style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                >
                  {resource.skip_note}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {resource.project && (
              <div>
                <span className="flex items-center gap-2 font-sans text-[10px] text-muted font-bold uppercase tracking-widest mb-2">
                  <Target size={10} className="text-primary" />
                  Build This
                </span>
                <p className="font-sans text-body-sm text-ink leading-relaxed">{resource.project}</p>
              </div>
            )}

            {resource.why && (
              <div>
                <span className="flex items-center gap-2 font-sans text-[10px] text-muted font-bold uppercase tracking-widest mb-2">
                  <Zap size={10} className="text-brand-teal" />
                  Why It Matters
                </span>
                <p 
                  className="font-sans text-body-sm text-muted leading-relaxed overflow-hidden line-clamp-3"
                  title={resource.why}
                  style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                >
                  {resource.why}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};