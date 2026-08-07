// updated
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateAllButtonProps {
  onGenerateAll: () => void;
  isGenerating: boolean;
  currentCount: number;
  totalCount: number;
  isVisible: boolean;
}

export const GenerateAllButton: React.FC<GenerateAllButtonProps> = ({
  onGenerateAll,
  isGenerating,
  currentCount,
  totalCount,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-center mb-12">
      <button
        onClick={onGenerateAll}
        disabled={isGenerating}
        className={`
          group relative flex items-center gap-3 px-8 py-3 rounded-full border border-brand-teal/30 
          bg-brand-teal/5 hover:bg-brand-teal/10 hover:border-brand-teal/50 transition-all duration-300
          disabled:opacity-70 disabled:cursor-wait shadow-[0_10px_20px_rgba(45,212,191,0.05)]
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="text-brand-pink animate-spin" />
            <span className="font-mono text-xs text-brand-pink uppercase tracking-widest">
              Generating {currentCount} of {totalCount}...
            </span>
          </>
        ) : (
          <>
            <Sparkles size={16} className="text-brand-teal group-hover:text-brand-pink transition-colors" />
            <span className="font-mono text-xs text-brand-teal group-hover:text-ink transition-colors uppercase tracking-widest font-bold">
              Generate all remaining resources →
            </span>
          </>
        )}
      </button>
    </div>
  );
};
