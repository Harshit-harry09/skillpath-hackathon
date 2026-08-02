'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, FileText, LineChart, Link2, MessageSquareText, Wrench } from 'lucide-react';
import type { AnalysisResult, SkillGap } from '@/types/analysis';
import { CoverLetterGenerator } from '@/components/results/CoverLetterGenerator';
import { LinkedInHeadlineOptimizer } from '@/components/results/LinkedInHeadlineOptimizer';
import { SalaryRoiCard } from '@/components/results/SalaryRoiCard';
import { FreshnessScoreCard } from '@/components/results/FreshnessScoreCard';
import { RoleSwitchPanel } from '@/components/results/RoleSwitchPanel';
import { CompetitiveBenchmarkScore } from '@/components/results/CompetitiveBenchmarkScore';
import { computeFreshnessScore } from '@/lib/skill-expiry';

interface SecondaryToolsProps {
  data: AnalysisResult;
  activeGaps: SkillGap[];
  freshnessResult: ReturnType<typeof computeFreshnessScore> | null;
}

type PanelKey = 'resume' | 'career' | 'market' | 'practice';

const panelMeta: Record<PanelKey, { label: string; description: string; icon: typeof Wrench }> = {
  resume: {
    label: 'Resume quality',
    description: 'ATS and writing checks from secure server-side findings.',
    icon: FileText,
  },
  career: {
    label: 'Career content',
    description: 'Optional cover-letter and LinkedIn helpers.',
    icon: Link2,
  },
  market: {
    label: 'Market and trajectory',
    description: 'Estimates and simulations; useful after your next action is clear.',
    icon: LineChart,
  },
  practice: {
    label: 'Interview practice',
    description: 'Run a role-specific mock interview with adaptive follow-ups.',
    icon: MessageSquareText,
  },
};

export function SecondaryTools({ data, activeGaps, freshnessResult }: SecondaryToolsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

  const togglePanel = (panel: PanelKey) => {
    setIsOpen(true);
    setActivePanel((current) => current === panel ? null : panel);
  };

  const topSkills = (data.matched_skills || data.mvc_skills || []).slice(0, 6);

  return (
    <section className="mt-12 border-t border-hairline pt-8">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="w-full min-h-12 flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-surface-soft active:scale-[0.99]"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-surface-soft flex items-center justify-center text-muted shrink-0">
            <Wrench size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-title-md text-ink">More tools</span>
            <span className="block font-sans text-body-xs text-muted truncate">Resume, career content, market context, and simulations</span>
          </span>
        </span>
        <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {(Object.keys(panelMeta) as PanelKey[]).map((panel) => {
            const meta = panelMeta[panel];
            const Icon = meta.icon;
            const expanded = activePanel === panel;
            return (
              <div key={panel} className="rounded-2xl border border-hairline bg-surface-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePanel(panel)}
                  aria-expanded={expanded}
                  className="w-full min-h-12 flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-soft"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="text-muted shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-sans text-body-sm font-semibold text-ink">{meta.label}</span>
                      <span className="block font-sans text-body-xs text-muted truncate">{meta.description}</span>
                    </span>
                  </span>
                  <ChevronDown size={16} className={`text-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && panel === 'resume' && (
                  <div className="border-t border-hairline px-5 py-5">
                    {data.resume_text ? (
                      <p className="font-sans text-body-sm text-muted">Resume quality checks are available below.</p>
                    ) : (
                      <div className="rounded-xl bg-surface-soft px-4 py-4">
                        <p className="font-sans text-body-sm font-semibold text-ink">Resume checks are being secured</p>
                        <p className="font-sans text-body-xs text-muted mt-1 leading-relaxed">
                          Raw resume text is intentionally not sent back to the browser. Server-side ATS findings will appear here once they are included in the analysis result.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {expanded && panel === 'career' && (
                  <div className="border-t border-hairline px-5 py-5 space-y-5">
                    <CoverLetterGenerator
                      roleLabel={data.role_label || 'Software Engineer'}
                      topSkills={topSkills}
                    />
                    <LinkedInHeadlineOptimizer
                      roleLabel={data.role_label || 'Software Engineer'}
                      topSkills={topSkills}
                    />
                  </div>
                )}

                {expanded && panel === 'market' && (
                  <div className="border-t border-hairline px-5 py-5 space-y-6">
                    <SalaryRoiCard
                      roleCategory={data.role_category || ''}
                      roleLabel={data.role_label || 'Software Engineer'}
                      gapCount={activeGaps.length}
                      mvcSkills={data.mvc_skills || []}
                    />
                    {freshnessResult && <FreshnessScoreCard data={freshnessResult} />}
                    {data.role_category && (
                      <RoleSwitchPanel
                        resumeSkills={data.resume_skills || []}
                        resumeText=""
                        currentRoleSlug={data.role_category}
                        currentRoleLabel={data.role_label || 'Software Engineer'}
                      />
                    )}
                    <CompetitiveBenchmarkScore
                      matchPct={data.gap_score || 0}
                      freshnessScore={freshnessResult?.score}
                      gapCount={activeGaps.length}
                      criticalCount={activeGaps.filter((gap) => gap.match_status === 'missing' || gap.in_mvc).length}
                    />
                  </div>
                )}

                {expanded && panel === 'practice' && (
                  <div className="border-t border-hairline px-5 py-5">
                    <div className="rounded-2xl border border-brand-teal/25 bg-brand-teal/5 p-5">
                      <p className="text-sm font-black text-ink">Practice {data.role_label || 'your target role'}</p>
                      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                        Choose technical, coding, system design, behavioral, or role-specific questions. Your session ends with retryable feedback on weak answers.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push(`/interview-lab?role=${encodeURIComponent(data.role_label || 'Software Engineer')}`)}
                        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-teal px-4 text-sm font-black text-white transition-transform active:scale-[0.96]"
                      >
                        Open Interview Lab <MessageSquareText size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
