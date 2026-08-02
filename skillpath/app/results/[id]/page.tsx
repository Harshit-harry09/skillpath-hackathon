'use client';

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, Share2, Target } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chip } from '@/components/ui/Chip';
import { GenerateAllButton } from '@/components/results/GenerateAllButton';
import { PinJobButton } from '@/components/results/PinJobButton';
import { ReadinessRing } from '@/components/results/ReadinessRing';
import { SelfAssessmentModal } from '@/components/results/SelfAssessmentModal';
import { SkillCard } from '@/components/results/SkillCard';
import { StarBulletModal } from '@/components/results/StarBulletModal';
import { useAuth } from '@/context/AuthContext';
import { saveToHistory, getHistory } from '@/lib/history';
import { computeFreshnessScore } from '@/lib/skill-expiry';
import { reweightGaps, recomputeReadinessWithConfidence, recomputeWeeks } from '@/lib/confidence-reweighter';
import type { AnalysisResult, ConfidenceLevel, SkillGap, SkillEvidenceDetail } from '@/types/analysis';

const SecondaryTools = dynamic(
  () => import('@/components/results/SecondaryTools').then((module) => module.SecondaryTools),
  { ssr: false, loading: () => <div className="mt-12 h-16 rounded-2xl bg-surface-soft animate-pulse" /> }
);

type ActiveJobSkill = {
  skill: string;
  state: 'not_started' | 'in_progress' | 'learned';
  weeks_to_learn?: number;
};

type ActiveJobState = {
  color?: string;
  readiness_score: number;
  skills: ActiveJobSkill[];
};

const statusLabel: Record<string, string> = {
  not_configured: 'Local analysis',
  pending: 'AI evidence pass queued',
  processing: 'AI evidence pass running',
  complete: 'Evidence verified',
  fallback: 'Local analysis shown',
  unavailable: 'Local analysis shown',
  deterministic_complete: 'Local analysis',
};

function formatDate(value: string | undefined): string {
  if (!value) return 'Not estimated';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not estimated';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function requirementImportanceForGap(data: AnalysisResult, gap: SkillGap) {
  if (gap.importance) return gap.importance;
  const normalizedSkill = gap.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
  return data.requirements?.find((requirement) =>
    requirement.id === gap.requirement_id
    || requirement.canonical_skill.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSkill
    || requirement.skill.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSkill
  )?.importance;
}

function decorateGapForCard(data: AnalysisResult, gap: SkillGap): SkillGap {
  const evidenceDetails: SkillEvidenceDetail[] = gap.evidence_details?.length
    ? gap.evidence_details
    : (gap.evidence_ids || [])
      .map((id) => data.evidence?.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        quote: item.quote,
        section: item.section,
        years: item.years,
        recency_year: item.recency_year,
        strength: item.strength,
      }));

  return {
    ...gap,
    importance: requirementImportanceForGap(data, gap),
    evidence_details: evidenceDetails,
  };
}

export default function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skill?: string; new?: string }>;
}) {
  const { id } = use(params);
  const query = use(searchParams);
  const targetSkill = query.skill;
  const isNewAnalysis = query.new === 'true';
  const { getToken } = useAuth();

  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrichmentNotice, setEnrichmentNotice] = useState('');
  const enrichmentAttempted = useRef<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessments, setAssessments] = useState<Record<string, ConfidenceLevel>>({});
  const [starModalSkill, setStarModalSkill] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [activeJob, setActiveJob] = useState<ActiveJobState | null>(null);

  const handleConfidenceChange = useCallback((skill: string, level: ConfidenceLevel) => {
    setAssessments((previous) => ({ ...previous, [skill]: level }));
  }, []);

  const { activeGaps, masteredSkills } = useMemo(() => {
    if (!data) return { activeGaps: [] as SkillGap[], masteredSkills: [] as SkillGap[] };
    return reweightGaps(data.skill_gaps, assessments);
  }, [data, assessments]);

  const adjustedReadiness = useMemo(() => {
    if (!data || Object.keys(assessments).length === 0) return undefined;
    return recomputeReadinessWithConfidence(data.skill_gaps, data.resume_skills || [], assessments);
  }, [data, assessments]);

  const adjustedWeeks = useMemo(() => {
    if (!data || Object.keys(assessments).length === 0) return undefined;
    return recomputeWeeks(data.skill_gaps, assessments);
  }, [data, assessments]);

  const visibleGaps = isListExpanded ? activeGaps : activeGaps.slice(0, 5);
  const gapScore = data?.gap_score ?? 0;
  const readinessScore = adjustedReadiness ?? activeJob?.readiness_score ?? gapScore;
  const readyDate = adjustedWeeks !== undefined
    ? formatDate(new Date(Date.now() + adjustedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString())
    : formatDate(data?.ready_by_date);

  const freshnessResult = useMemo(() => {
    if (!data?.resume_skills) return null;
    return computeFreshnessScore(data.resume_skills);
  }, [data?.resume_skills]);

  const requirementSummary = useMemo(() => {
    if (!data) return { total: 0, matched: 0, partial: 0, transferable: 0, missing: 0, review: 0 };
    const total = data.matches?.length || data.requirements?.length || data.jd_skills?.length || activeGaps.length;
    if (data.matches?.length) {
      return {
        total,
        matched: data.matches.filter((match) => match.status === 'matched').length,
        partial: data.matches.filter((match) => match.status === 'partially_matched').length,
        transferable: data.matches.filter((match) => match.status === 'transferable').length,
        missing: data.matches.filter((match) => match.status === 'missing').length,
        review: data.matches.filter((match) => match.status === 'contradicted' || match.status === 'unclear').length,
      };
    }

    const matched = Math.min(total, data.matched_skills?.length || Math.max(0, total - activeGaps.length));
    return {
      total,
      matched,
      partial: activeGaps.filter((gap) => gap.match_status === 'partially_matched').length,
      transferable: activeGaps.filter((gap) => gap.match_status === 'transferable').length,
      missing: activeGaps.filter((gap) => !gap.match_status || gap.match_status === 'missing').length,
      review: activeGaps.filter((gap) => gap.match_status === 'contradicted' || gap.match_status === 'unclear').length,
    };
  }, [activeGaps, data]);

  useEffect(() => {
    async function fetchResults() {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`/api/results/${id}`, { headers });
          if (response.ok) {
            const json = await response.json() as AnalysisResult;
            setData(json);
            const hasExistingAssessments = Object.keys(json.assessments || {}).length > 0;
            if (isNewAnalysis && !hasExistingAssessments) setShowAssessmentModal(true);
            setLoading(false);
            return;
          }

          // A missing result is deterministic; retry only transient server failures.
          if (response.status >= 500 && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }

          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || (response.status === 404 ? 'Analysis not found' : 'Unable to load analysis'));
        } catch (fetchError) {
          if (attempt === 2) {
            setError(fetchError instanceof Error ? fetchError.message : 'This analysis could not be loaded.');
          }
        }
      }
      setLoading(false);
    }

    void fetchResults();
  }, [getToken, id, isNewAnalysis]);

  useEffect(() => {
    if (!data || enrichmentAttempted.current === id) return;
    if (data.enrichment_status !== 'pending' && data.enrichment_status !== 'processing') return;

    enrichmentAttempted.current = id;
    let cancelled = false;

    async function refreshUntilComplete() {
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 0 : 1500));
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
          const response = await fetch(`/api/analyze/${id}/enrich`, { method: 'POST', headers });
          if (response.ok) {
            const enriched = await response.json() as AnalysisResult;
            if (enriched.enrichment_status === 'processing') continue;
            if (!cancelled) {
              setData((previous) => previous ? { ...previous, ...enriched } : enriched);
              setEnrichmentNotice(enriched.enrichment_status === 'complete' ? 'Evidence verified' : 'Local analysis shown');
            }
            return;
          }
          if (response.status !== 202 && response.status !== 429 && response.status < 500) return;
        } catch {
          // Optional AI failure never removes the local result.
        }
      }
      if (!cancelled) setEnrichmentNotice('Local analysis shown');
    }

    setEnrichmentNotice('Verifying resume evidence…');
    void refreshUntilComplete();
    return () => { cancelled = true; };
  }, [data, getToken, id]);

  useEffect(() => {
    async function fetchActiveJob() {
      const token = await getToken();
      if (!token) return;
      try {
        const response = await fetch('/api/active-job', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const json = await response.json();
        if (json.active_job?.analysis_id === id) setActiveJob(json.active_job as ActiveJobState);
      } catch {
        // The results view remains usable without the optional tracker.
      }
    }
    void fetchActiveJob();
  }, [getToken, id]);

  useEffect(() => {
    if (!targetSkill || loading || !data) return;
    const targetId = `skill-${targetSkill.toLowerCase().replace(/\s+/g, '-')}`;
    const timer = window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
    return () => window.clearTimeout(timer);
  }, [data, loading, targetSkill]);

  useEffect(() => {
    if (!data) return;
    setSaved(getHistory().some((item) => item.share_token === data.share_token));
  }, [data]);

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href);
    window.alert('Link copied to clipboard!');
  };

  const handleSave = () => {
    if (!data) return;
    saveToHistory({
      type: 'analyze',
      share_token: data.share_token,
      gap_score: data.gap_score,
      weeks_required: data.weeks_required,
      company_type: data.company_type,
      mvc_skills: data.mvc_skills || [],
      created_at: data.created_at,
      jd_preview: data.jd_preview || '',
    });
    setSaved(true);
  };

  const handleTrackingChange = async (skill: string, state: ActiveJobSkill['state']) => {
    setActiveJob((previous) => {
      if (!previous) return previous;
      const skills = previous.skills.map((item) => item.skill === skill ? { ...item, state } : item);
      const learned = skills.filter((item) => item.state === 'learned').length;
      return { ...previous, skills, readiness_score: Math.round((learned / Math.max(1, skills.length)) * 100) };
    });

    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch('/api/active-job', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill, state }),
      });
      if (response.ok) {
        const json = await response.json();
        setActiveJob((previous) => previous ? { ...previous, skills: json.skills, readiness_score: json.readiness_score } : previous);
      }
    } catch {
      // Keep the optimistic state; the next server read will reconcile it.
    }
  };

  const handleGeneratePlan = async () => {
    if (generatingPlan) return;
    setGeneratingPlan(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/results/${id}/plan`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error('Failed to generate plan');
      const learningPlan = await response.json();
      const planSource = response.headers.get('X-Plan-Source') as AnalysisResult['learning_plan_source'] | null;
      setData((previous) => previous ? {
        ...previous,
        learning_plan: learningPlan,
        learning_plan_source: planSource || previous.learning_plan_source,
      } : previous);
    } catch {
      window.alert('Failed to generate learning plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!data || batchGenerating) return;
    const pendingSkills = data.skill_gaps.filter((gap) => !data.generated_resources?.[gap.skill]);
    if (pendingSkills.length === 0) return;

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: pendingSkills.length });
    for (let index = 0; index < pendingSkills.length; index += 1) {
      const gap = pendingSkills[index];
      setBatchProgress({ current: index + 1, total: pendingSkills.length });
      try {
        const token = await getToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch('/api/generate-resources', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            analysis_id: data.share_token,
            skill: gap.skill,
            role: data.role_label || 'Software Engineer',
            seniority: 'entry',
            company_type: data.company_type,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          setData((previous) => previous ? {
            ...previous,
            generated_resources: { ...(previous.generated_resources || {}), [gap.skill]: result.skill_resources },
          } : previous);
        }
      } catch {
        // One failed resource should not prevent the remaining skills from completing.
      }
      if (index < pendingSkills.length - 1) await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setBatchGenerating(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas text-ink pt-[64px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="font-sans text-muted">Loading your analysis...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas text-ink pt-[64px]">
        <div className="text-center px-8">
          <h1 className="font-display text-title-lg mb-4">Analysis not found</h1>
          <p className="font-sans text-muted">{error || 'This link may be invalid or expired.'}</p>
        </div>
      </main>
    );
  }

  const topStrengths = data.ai_explanation?.top_strengths?.slice(0, 3) || (data.matched_skills || []).slice(0, 3).map((skill) => ({ skill, evidence_ids: [] }));
  const topGaps = activeGaps.slice(0, 3);
  const primarySummary = data.ai_explanation?.summary || data.summary || `You have ${activeGaps.length} priority skill gaps for this role.`;
  const planStatusLabel = data.learning_plan_source === 'gemini'
    ? 'AI-generated'
    : data.learning_plan_source === 'deterministic_fallback'
      ? 'Fallback plan'
      : data.learning_plan_source === 'deterministic_empty'
        ? 'No gaps to plan'
        : data.learning_plan?.weeks?.length ? 'Plan ready' : null;

  return (
    <main className="min-h-screen bg-canvas text-ink relative pt-[64px] pb-24">
      <SelfAssessmentModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        gaps={data.skill_gaps || []}
        resumeSkills={data.resume_skills || []}
        mvcSkills={data.mvc_skills || []}
        assessments={assessments}
        onConfidenceChange={handleConfidenceChange}
        roleName={data.role_label || data.role_category || 'Target Role'}
      />
      <StarBulletModal
        isOpen={Boolean(starModalSkill)}
        onClose={() => setStarModalSkill(null)}
        skill={starModalSkill || ''}
        role={data.role_label || 'Software Engineer'}
      />

      <div className="max-w-[1100px] mx-auto px-5 md:px-8 lg:px-12 pt-8 md:pt-14 w-full">
        <header className="border-b border-hairline pb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-7">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 font-sans text-[10px] text-brand-teal uppercase tracking-widest font-bold">
                  <span className="w-2 h-2 rounded-full bg-brand-teal" />
                  {activeJob ? 'Active learning path' : 'Analysis complete'}
                </span>
                {enrichmentNotice && (
                  <span className="px-2 py-1 rounded-full bg-surface-soft border border-hairline text-[10px] text-muted font-bold uppercase tracking-wider">
                    {enrichmentNotice}
                  </span>
                )}
                {!enrichmentNotice && data.enrichment_status && (
                  <span className="px-2 py-1 rounded-full bg-surface-soft border border-hairline text-[10px] text-muted font-bold uppercase tracking-wider">
                    {statusLabel[data.enrichment_status] || 'Analysis ready'}
                  </span>
                )}
              </div>
              <h1 className="font-display text-[34px] md:text-[52px] font-semibold leading-[1.05] tracking-[-0.04em] text-balance">
                {data.role_label || 'Target role'} match analysis
              </h1>
              <p className="font-sans text-body-md text-muted mt-4 max-w-xl leading-relaxed text-pretty">
                {primarySummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-[320px] lg:justify-end">
              <button
                onClick={handleSave}
                disabled={saved}
                className={`min-h-11 px-4 rounded-md border font-sans font-semibold text-button transition-colors active:scale-[0.96] ${saved ? 'text-brand-teal border-brand-teal/20 bg-brand-teal/5' : 'text-ink border-hairline hover:bg-surface-soft'}`}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
              <PinJobButton
                analysisId={data.share_token}
                jobTitle={data.role_label || 'Software Engineer'}
                role={data.role_category || ''}
                seniority="entry"
                companyType={data.company_type}
                skillGaps={data.skill_gaps}
              />
              <button
                onClick={handleShare}
                className="min-h-11 px-4 rounded-md bg-primary text-on-primary font-sans font-semibold text-button hover:bg-primary-active transition-colors active:scale-[0.96]"
              >
                <Share2 size={15} className="inline mr-2" />Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="rounded-xl bg-surface-card border border-hairline px-4 py-4">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Gap score</span>
                <span className="group relative inline-flex">
                  <button type="button" aria-label="Explain Gap score" title="Higher score means stronger resume coverage." className="min-h-10 min-w-10 -my-2 -mr-2 inline-flex items-center justify-center text-muted hover:text-ink transition-colors">
                    <Info size={13} />
                  </button>
                  <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 w-48 rounded-lg bg-ink px-3 py-2 text-[10px] leading-relaxed text-on-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    Higher score means stronger resume coverage of the job requirements.
                  </span>
                </span>
              </div>
              <span className="block font-display text-3xl mt-1 tabular-nums">{gapScore}<span className="text-base text-muted">/100</span></span>
              <span className="block text-[10px] text-muted mt-1">Higher is stronger</span>
            </div>
            <div className="rounded-xl bg-surface-card border border-hairline px-4 py-4">
              <span className="block text-[10px] text-muted uppercase tracking-widest font-bold">Readiness</span>
              <span className="block font-display text-3xl mt-1 tabular-nums">{readinessScore}<span className="text-base text-muted">/100</span></span>
            </div>
            <div className="rounded-xl bg-surface-card border border-hairline px-4 py-4">
              <span className="block text-[10px] text-muted uppercase tracking-widest font-bold">Priority gaps</span>
              <span className="block font-display text-3xl mt-1 tabular-nums">{activeGaps.length}</span>
            </div>
            <div className="rounded-xl bg-surface-card border border-hairline px-4 py-4">
              <span className="block text-[10px] text-muted uppercase tracking-widest font-bold">Ready by</span>
              <span className="block font-display text-2xl mt-2 tabular-nums">{readyDate}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface-soft/70 border border-hairline px-4 py-3">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink">{requirementSummary.total} requirements checked</span>
            <span className="font-sans text-[10px] font-semibold text-brand-teal">{requirementSummary.matched} matched</span>
            {requirementSummary.partial > 0 && <span className="font-sans text-[10px] font-semibold text-brand-ochre">{requirementSummary.partial} partial</span>}
            {requirementSummary.transferable > 0 && <span className="font-sans text-[10px] font-semibold text-brand-lavender">{requirementSummary.transferable} transferable</span>}
            {requirementSummary.missing > 0 && <span className="font-sans text-[10px] font-semibold text-brand-pink">{requirementSummary.missing} missing</span>}
            {requirementSummary.review > 0 && <span className="font-sans text-[10px] font-semibold text-muted">{requirementSummary.review} need review</span>}
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-8 border-b border-hairline">
          <div className="rounded-2xl bg-surface-card border border-hairline p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-brand-teal" />
              <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted">What you already show</h2>
            </div>
            {topStrengths.length ? (
              <div className="flex flex-wrap gap-2">
                {topStrengths.map((strength) => <Chip key={strength.skill} variant="filled">{strength.skill}</Chip>)}
              </div>
            ) : (
              <p className="font-sans text-body-sm text-muted">No strong matches were verified yet.</p>
            )}
          </div>
          <div className="rounded-2xl bg-surface-card border border-hairline p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-brand-pink" />
              <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted">Start here</h2>
            </div>
            <div className="space-y-2">
              {topGaps.length ? topGaps.map((gap) => (
                <div key={gap.skill} className="flex items-center justify-between gap-4 text-body-sm">
                  <span className="font-semibold text-ink truncate">{gap.skill}</span>
                  <span className="text-muted text-xs shrink-0">{gap.weeks_to_learn}w</span>
                </div>
              )) : <p className="font-sans text-body-sm text-muted">No priority gaps detected.</p>}
            </div>
          </div>
        </section>

        <section id="priority-gaps" className="pt-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="font-sans text-[10px] text-brand-teal uppercase tracking-widest font-bold mb-2">Your next actions</p>
              <h2 className="font-display text-title-lg md:text-display-sm tracking-tight">Priority skill gaps</h2>
              <p className="font-sans text-body-sm text-muted mt-2 max-w-xl">Each card explains the gap, shows the evidence, and keeps the learning links in one place.</p>
            </div>
            <GenerateAllButton
              isVisible={data.skill_gaps.filter((gap) => !data.generated_resources?.[gap.skill]).length > 2 && !batchGenerating}
              isGenerating={batchGenerating}
              currentCount={batchProgress.current}
              totalCount={batchProgress.total}
              onGenerateAll={handleGenerateAll}
            />
          </div>

          <div className="divide-y divide-hairline">
            <AnimatePresence initial={false}>
              {visibleGaps.map((gap, index) => (
                <div key={gap.skill} id={`skill-${gap.skill.toLowerCase().replace(/\s+/g, '-')}`} className="py-5 first:pt-0">
                  <SkillCard
                    index={index}
                    analysisId={data.share_token}
                    role={data.role_label || 'Software Engineer'}
                    seniority="entry"
                    companyType={data.company_type}
                    gap={decorateGapForCard(data, gap)}
                    initialResources={data.generated_resources?.[gap.skill]}
                    autoGenerate={(index === 0 && gap.in_mvc) || gap.skill === targetSkill}
                    colorVariant={['pink', 'teal', 'lavender', 'peach', 'ochre', 'cream'][index % 6]}
                    trackingState={activeJob?.skills?.find((item) => item.skill === gap.skill)?.state}
                    onTrackingChange={handleTrackingChange}
                    trackingColor={activeJob?.color}
                    confidenceLevel={assessments[gap.skill]}
                    onConfidenceChange={handleConfidenceChange}
                    onResumeAction={() => setStarModalSkill(gap.skill)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>

          {activeGaps.length > 5 && (
            <button
              type="button"
              onClick={() => setIsListExpanded((value) => !value)}
              className="mt-6 min-h-11 w-full rounded-xl border border-hairline bg-surface-card px-4 py-3 font-sans text-button font-semibold text-muted hover:text-ink hover:bg-surface-soft transition-colors active:scale-[0.99]"
            >
              {isListExpanded ? 'Show fewer gaps' : `View ${activeGaps.length - 5} more skill gaps`}
            </button>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-hairline bg-surface-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <p className="font-sans text-[10px] text-muted uppercase tracking-widest font-bold mb-2">One focused path</p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-title-lg">Learning roadmap</h2>
                {planStatusLabel && <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${data.learning_plan_source === 'deterministic_fallback' ? 'border-brand-ochre/25 bg-brand-ochre/10 text-brand-ochre' : 'border-brand-teal/25 bg-brand-teal/10 text-brand-teal'}`}>{planStatusLabel}</span>}
              </div>
              <p className="font-sans text-body-sm text-muted mt-2 max-w-xl">Turn your highest-priority cards into a sequence you can actually finish.</p>
            </div>
            {!data.learning_plan?.weeks?.length && (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="min-h-11 px-5 rounded-xl bg-primary text-on-primary font-sans text-button font-semibold hover:bg-primary-active transition-colors active:scale-[0.96] disabled:opacity-50"
              >
                {generatingPlan ? 'Creating plan…' : 'Create learning plan'}
              </button>
            )}
          </div>

          {data.learning_plan?.weeks?.length ? (
            <div className="mt-6 space-y-2">
              {(isPlanExpanded ? data.learning_plan.weeks : data.learning_plan.weeks.slice(0, 4)).map((week) => (
                <Accordion key={`week-${week.week}`} title={`Week ${week.week}: ${week.skill}`}>
                  <div className="space-y-3 pt-2">
                    {(week.resources || []).map((resource) => (
                      <div key={`${week.week}-${resource.title}`} className="flex items-center justify-between gap-4 text-body-sm">
                        <span className="text-ink font-medium">{resource.title}</span>
                        {resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">Open</a>}
                      </div>
                    ))}
                  </div>
                </Accordion>
              ))}
              {data.learning_plan.weeks.length > 4 && (
                <button type="button" onClick={() => setIsPlanExpanded((value) => !value)} className="min-h-10 mt-3 px-3 text-button font-semibold text-muted hover:text-ink transition-colors">
                  {isPlanExpanded ? 'Show fewer weeks' : `Show all ${data.learning_plan.weeks.length} weeks`}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-surface-soft px-4 py-4 font-sans text-body-sm text-muted">Your plan will be generated from the evidence-backed cards above.</p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-hairline bg-surface-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-5">
              {activeJob && <ReadinessRing score={readinessScore} color={activeJob.color} size={80} strokeWidth={7} />}
              <div>
                <p className="font-sans text-[10px] text-muted uppercase tracking-widest font-bold">Progress</p>
                <h2 className="font-display text-title-md mt-1">{activeJob ? `${readinessScore}% ready for this role` : 'Personalize your estimate'}</h2>
                <p className="font-sans text-body-sm text-muted mt-1">{masteredSkills.length ? `${masteredSkills.length} skills marked strong.` : 'Rate your confidence to adjust your plan.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowAssessmentModal(true)} className="min-h-11 px-4 rounded-xl border border-hairline font-sans text-button font-semibold text-ink hover:bg-surface-soft transition-colors active:scale-[0.96]">Rate my skills</button>
              {!activeJob && <span className="inline-flex items-center px-3 text-body-xs text-muted">Pin this analysis to track progress.</span>}
            </div>
          </div>
          <div className="mt-6"><ProgressBar progress={readinessScore} className="h-2" /></div>
        </section>

        <SecondaryTools data={data} activeGaps={activeGaps} freshnessResult={freshnessResult} />
      </div>
    </main>
  );
}
