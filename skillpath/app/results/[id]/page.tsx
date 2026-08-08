'use client';
// updated

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown, Info, Share2, Target } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chip } from '@/components/ui/Chip';
import { GenerateAllButton } from '@/components/results/GenerateAllButton';
import { ReadinessRing } from '@/components/results/ReadinessRing';
import { SkillCard } from '@/components/results/SkillCard';
import { useAuth } from '@/context/AuthContext';
import { saveToHistory, getHistory } from '@/lib/history';
import { computeFreshnessScore } from '@/lib/skill-expiry';
import { reweightGaps, recomputeReadinessWithConfidence, recomputeWeeks } from '@/lib/confidence-reweighter';
import { JDSynonymMatcher } from '@/components/results/JDSynonymMatcher';
import { RecruiterRedFlagRadar } from '@/components/results/RecruiterRedFlagRadar';
import { InlineDiffEditor } from '@/components/editor/InlineDiffEditor';
import { ShowYourWorkScore } from '@/components/results/ShowYourWorkScore';
import { LayoutParseWarning } from '@/components/results/LayoutParseWarning';
import { SeniorityCalibrator } from '@/components/results/SeniorityCalibrator';
import { JargonTranslator } from '@/components/results/JargonTranslator';
import { MultiFormatExporter } from '@/components/results/MultiFormatExporter';
import { SidebarScorecard } from '@/components/results/SidebarScorecard';
import { UnifiedToolkit } from '@/components/results/UnifiedToolkit';
import { RoleFilterTabs } from '@/components/results/RoleFilterTabs';
import { PinJobButton } from '@/components/results/PinJobButton';
import type { AppRole, ActiveJob } from '@/types/active-job';
import type { AnalysisResult, ConfidenceLevel, SkillGap, SkillEvidenceDetail } from '@/types/analysis';

const SelfAssessmentModal = dynamic(() => import('@/components/results/SelfAssessmentModal').then((m) => m.SelfAssessmentModal), { ssr: false });
const StarBulletModal = dynamic(() => import('@/components/results/StarBulletModal').then((m) => m.StarBulletModal), { ssr: false });
const OpenJobModal = dynamic(() => import('@/components/results/OpenJobModal').then((m) => m.OpenJobModal), { ssr: false });


const SecondaryTools = dynamic(
  () => import('@/components/results/SecondaryTools').then((module) => module.SecondaryTools),
  { ssr: false, loading: () => <div className="mt-12 h-16 rounded-2xl bg-surface-soft animate-pulse" /> }
);

type ActiveJobSkill = {
  skill: string;
  state: 'not_started' | 'in_progress' | 'learned';
  weeks_to_learn?: number;
  note?: string;
};

type ActiveJobState = {
  color?: string;
  readiness_score: number;
  skills: ActiveJobSkill[];
};

// ── localStorage helpers for guest / unpinned progress persistence ─────────
const LS_KEY = (id: string) => `skillpath_progress_${id}`;

function loadLocalProgress(id: string): ActiveJobState | null {
  try {
    const raw = localStorage.getItem(LS_KEY(id));
    if (!raw) return null;
    return JSON.parse(raw) as ActiveJobState;
  } catch {
    return null;
  }
}

function saveLocalProgress(id: string, state: ActiveJobState) {
  try {
    localStorage.setItem(LS_KEY(id), JSON.stringify(state));
  } catch {
    // storage quota exceeded — ignore
  }
}

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
  const [showOptionalTools, setShowOptionalTools] = useState(false);
  const [activeJob, setActiveJob] = useState<ActiveJobState | null>(null);
  const [seniorityLevel, setSeniorityLevel] = useState<import('@/components/results/SeniorityCalibrator').SeniorityLevel>('senior');
  const [selectedRole, setSelectedRole] = useState<AppRole | 'all'>('all');
  // Track whether the high-readiness job modal has already been shown this
  // page load. Using a ref avoids browser-storage side-effects.
  const jobModalShownRef = useRef(false);

  const handleConfidenceChange = useCallback((skill: string, level: ConfidenceLevel) => {
    setAssessments((previous) => ({ ...previous, [skill]: level }));
  }, []);

  /** Called by PinJobButton when a job is successfully pinned */
  const handlePinned = useCallback((job: ActiveJob) => {
    setActiveJob({
      color: job.color,
      readiness_score: job.readiness_score,
      skills: job.skills as unknown as ActiveJobSkill[],
    });
    // Clear local draft once real DB record exists
    try { localStorage.removeItem(LS_KEY(id)); } catch { /* noop */ }
  }, [id]);

  const { activeGaps, masteredSkills } = useMemo(() => {
    if (!data) return { activeGaps: [] as SkillGap[], masteredSkills: [] as SkillGap[] };
    return reweightGaps(data.skill_gaps, assessments);
  }, [data, assessments]);

  const gapsWithRoles = useMemo(() => {
    function inferRole(skillName: string): AppRole {
      const lower = skillName.toLowerCase();
      if (lower.includes('admin') || lower.includes('devops') || lower.includes('docker') || lower.includes('kubernetes') || lower.includes('aws') || lower.includes('cloud')) return 'admin';
      if (lower.includes('security') || lower.includes('compliance') || lower.includes('audit') || lower.includes('auth') || lower.includes('governance')) return 'authority';
      if (lower.includes('health') || lower.includes('hipaa') || lower.includes('medical') || lower.includes('clinical') || lower.includes('hospital')) return 'hospital';
      if (lower.includes('flaw') || lower.includes('investigat') || lower.includes('debug') || lower.includes('fraud') || lower.includes('forensic')) return 'investigator';
      if (lower.includes('review') || lower.includes('quality') || lower.includes('testing') || lower.includes('qa') || lower.includes('code review')) return 'reviewer';
      return 'user';
    }

    return activeGaps.map((gap) => ({
      ...gap,
      role_category: gap.role_category || inferRole(gap.skill),
    }));
  }, [activeGaps]);

  const roleCounts = useMemo(() => {
    const counts: Record<AppRole | 'all', number> = {
      all: gapsWithRoles.length,
      user: 0, admin: 0, authority: 0, hospital: 0, investigator: 0, reviewer: 0,
    };
    gapsWithRoles.forEach((gap) => {
      if (gap.role_category) counts[gap.role_category] = (counts[gap.role_category] || 0) + 1;
    });
    return counts;
  }, [gapsWithRoles]);

  const filteredGaps = useMemo(() => {
    if (selectedRole === 'all') return gapsWithRoles;
    return gapsWithRoles.filter((gap) => gap.role_category === selectedRole);
  }, [gapsWithRoles, selectedRole]);

  // Role-scoped requirement summary for SidebarScorecard
  const filteredRequirementSummary = useMemo(() => {
    if (selectedRole === 'all' || !data) return undefined;
    const total = filteredGaps.length;
    if (data.matches?.length) {
      // Link matches to filteredGaps via requirement_id
      const filteredReqIds = new Set(filteredGaps.map(g => g.requirement_id).filter(Boolean));
      // Also allow matching by skill name for older data without requirement_id
      const filteredSkillNames = new Set(filteredGaps.map(g => g.skill.toLowerCase()));
      const filteredMatches = data.matches.filter(m =>
        filteredReqIds.has(m.requirement_id) ||
        filteredGaps.some(g => g.requirement_id === m.requirement_id)
      );
      // Fallback: if no requirement_id overlap, use gap count-based summary
      const matchBase = filteredMatches.length ? filteredMatches : data.matches.slice(0, total);
      return {
        total: matchBase.length || total,
        matched: matchBase.filter(m => m.status === 'matched').length,
        partial: matchBase.filter(m => m.status === 'partially_matched').length,
        transferable: matchBase.filter(m => m.status === 'transferable').length,
        missing: matchBase.filter(m => m.status === 'missing').length,
        review: matchBase.filter(m => m.status === 'contradicted' || m.status === 'unclear').length,
      };
    }
    return {
      total,
      matched: filteredGaps.filter(g => !g.match_status || g.match_status === 'matched').length,
      partial: filteredGaps.filter(g => g.match_status === 'partially_matched').length,
      transferable: filteredGaps.filter(g => g.match_status === 'transferable').length,
      missing: filteredGaps.filter(g => !g.match_status || g.match_status === 'missing').length,
      review: filteredGaps.filter(g => g.match_status === 'contradicted' || g.match_status === 'unclear').length,
    };
  }, [selectedRole, filteredGaps, data]);


  const adjustedReadiness = useMemo(() => {
    if (!data || Object.keys(assessments).length === 0) return undefined;
    return recomputeReadinessWithConfidence(data.skill_gaps, data.resume_skills || [], assessments);
  }, [data, assessments]);

  const adjustedWeeks = useMemo(() => {
    if (!data || Object.keys(assessments).length === 0) return undefined;
    return recomputeWeeks(data.skill_gaps, assessments);
  }, [data, assessments]);

  const [showOpenJobModal, setShowOpenJobModal] = useState(false);
  const visibleGaps = isListExpanded ? filteredGaps : filteredGaps.slice(0, 5);
  const hasGapScore = typeof data?.gap_score === 'number';
  const gapScore = data?.gap_score ?? 0;
  const serverReadiness = (data as (AnalysisResult & { readiness_score?: number }) | null)?.readiness_score;
  const readinessScore = adjustedReadiness ?? activeJob?.readiness_score ?? serverReadiness ?? (hasGapScore ? gapScore : 0);
  const readyDate = adjustedWeeks !== undefined
    ? formatDate(new Date(Date.now() + adjustedWeeks * 7 * 24 * 60 * 60 * 1000).toISOString())
    : formatDate(data?.ready_by_date);

  // Auto popup OpenJobModal once per page load when readiness score reaches 80%+
  useEffect(() => {
    if (readinessScore >= 80 && id && !jobModalShownRef.current) {
      jobModalShownRef.current = true;
      setShowOpenJobModal(true);
    }
  }, [readinessScore, id]);

  const freshnessResult = useMemo(() => {
    if (!data?.resume_skills) return null;
    return computeFreshnessScore(data.resume_skills);
  }, [data?.resume_skills]);

  // COUNTS BY STATUS/TOPIC
  // Computes a breakdown of every job-description requirement into five
  // status buckets: matched, partially_matched, transferable, missing, and
  // contradicted/unclear ("review"). These counts are surfaced in the status
  // strip below the header metrics so judges can instantly see coverage.
  //
  // Data source priority:
  //   1. data.matches[]  — AI-enriched evidence matches (highest fidelity)
  //   2. data.skill_gaps[] with match_status — local gap list as fallback
  //   3. Estimated from matched_skills length when neither is available
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
      if (!token) {
        // No token: try to load from localStorage for guest persistence
        const local = loadLocalProgress(id);
        if (local) setActiveJob(local);
        return;
      }
      try {
        const response = await fetch('/api/active-job', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) {
          // API error: fall back to localStorage
          const local = loadLocalProgress(id);
          if (local) setActiveJob(local);
          return;
        }
        const json = await response.json();
        if (json.active_job?.analysis_id === id) {
          setActiveJob(json.active_job as ActiveJobState);
        } else {
          // No pinned job for this analysis: try localStorage draft
          const local = loadLocalProgress(id);
          if (local) setActiveJob(local);
        }
      } catch {
        // The results view remains usable without the optional tracker.
        const local = loadLocalProgress(id);
        if (local) setActiveJob(local);
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

  const handleTrackingChange = async (skill: string, state: ActiveJobSkill['state'], note?: string) => {
    setActiveJob((previous) => {
      if (!previous) return previous;
      const skills = previous.skills.map((item) => item.skill === skill ? { ...item, state, note: note ?? item.note } : item);
      const learned = skills.filter((item) => item.state === 'learned').length;
      return { ...previous, skills, readiness_score: Math.round((learned / Math.max(1, skills.length)) * 100) };
    });

    const token = await getToken();
    if (!token) {
      // Guest user: persist optimistic state to localStorage
      setActiveJob((prev) => {
        if (prev) saveLocalProgress(id, prev);
        return prev;
      });
      return;
    }
    try {
      const response = await fetch('/api/active-job', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill, state, note }),
      });
      if (response.ok) {
        const json = await response.json();
        setActiveJob((previous) => previous ? { ...previous, skills: json.skills, readiness_score: json.readiness_score } : previous);
      } else if (response.status === 401 || response.status === 404) {
        // Not pinned as active job yet — persist to localStorage as draft
        setActiveJob((prev) => {
          if (prev) saveLocalProgress(id, prev);
          return prev;
        });
      }
    } catch {
      // Keep the optimistic state; persist to localStorage as fallback
      setActiveJob((prev) => {
        if (prev) saveLocalProgress(id, prev);
        return prev;
      });
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

  // DEMO DATA — VISIBLE TO JUDGES
  // topStrengths: up to 3 confirmed skill matches shown in the "What you already show" card.
  // topGaps: first 3 priority skill gaps shown in the "Start here" next-step card.
  // primarySummary: one-sentence analysis overview shown in the page header.
  // planStatusLabel: badge on the learning roadmap card indicating AI vs fallback plan source.
  //
  // For a live hackathon demo, these values are populated from real analysis data once
  // the user submits a resume and JD. The AI-enrichment pass (if configured) upgrades
  // them from local heuristics to evidence-backed AI output after the page loads.
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

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 w-full">
        {/* TWO-COLUMN GRID: LEFT SIDEBAR (SCORECARD) + RIGHT MAIN (DETAILED INFO) */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)] gap-8 items-start">
          
          {/* LEFT SIDEBAR: ATS SCORECARD & SUB-SCORES */}
          <aside className="lg:sticky lg:top-[84px] space-y-4">
            <SidebarScorecard
              data={data}
              gapScore={hasGapScore ? gapScore : 0}
              readinessScore={readinessScore}
              activeGaps={filteredGaps}
              requirementSummary={requirementSummary}
              filteredRequirementSummary={filteredRequirementSummary}
              readyDate={readyDate}
              saved={saved}
              onSave={handleSave}
              onShare={handleShare}
              onRateSkills={() => setShowAssessmentModal(true)}
              isPinned={Boolean(activeJob)}
              onPinned={handlePinned}
              selectedRole={selectedRole}
              resumeSkills={data.resume_skills || data.matched_skills}
            />
          </aside>

          {/* RIGHT COLUMN: BIG INFO & DETAILED INTERACTIVE TOOLS */}
          <div className="min-w-0 space-y-8">
            <header id="results-overview" className="border-b border-hairline pb-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 font-sans text-[10px] text-brand-teal uppercase tracking-widest font-bold">
                    <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
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

                <h1 className="font-display text-[32px] md:text-[46px] font-semibold leading-[1.05] tracking-[-0.04em]">
                  {data.role_label || 'Target role'} match analysis
                </h1>

                <p className="font-sans text-body-md text-muted max-w-2xl leading-relaxed">
                  {primarySummary}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface-soft/70 border border-hairline px-4 py-3">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-ink">{requirementSummary.total} requirements checked</span>
                  <span className="font-sans text-[10px] font-semibold text-brand-teal">{requirementSummary.matched} matched</span>
                  {requirementSummary.partial > 0 && <span className="font-sans text-[10px] font-semibold text-brand-ochre">{requirementSummary.partial} partial</span>}
                  {requirementSummary.transferable > 0 && <span className="font-sans text-[10px] font-semibold text-brand-lavender">{requirementSummary.transferable} transferable</span>}
                  {requirementSummary.missing > 0 && <span className="font-sans text-[10px] font-semibold text-brand-pink">{requirementSummary.missing} missing</span>}
                  {requirementSummary.review > 0 && <span className="font-sans text-[10px] font-semibold text-muted">{requirementSummary.review} need review</span>}
                </div>
              </div>
            </header>

            {/* Readout section */}
            <section aria-labelledby="readout-heading" className="pt-0">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-teal">Your readout</p>
                  <h2 id="readout-heading" className="mt-1 font-display text-title-lg md:text-display-sm tracking-tight">Start with the gaps that matter most.</h2>
                </div>
                <p className="max-w-md font-sans text-body-sm text-muted md:text-right">Use the overview to orient yourself, then work through the priority cards in order.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-hairline bg-surface-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-brand-teal" />
                    <h3 className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted">What you already show</h3>
                  </div>
                  {topStrengths.length ? (
                    <div className="flex flex-wrap gap-2">
                      {topStrengths.map((strength) => <Chip key={strength.skill} variant="filled">{strength.skill}</Chip>)}
                    </div>
                  ) : (
                    <p className="font-sans text-body-sm text-muted">No strong matches were verified yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-hairline bg-surface-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Target size={16} className="text-brand-pink" />
                    <h3 className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted">Start here</h3>
                  </div>
                  <div className="space-y-2">
                    {topGaps.length ? topGaps.map((gap) => (
                      <a key={gap.skill} href={`#skill-${gap.skill.toLowerCase().replace(/\s+/g, '-')}`} className="flex min-h-10 items-center justify-between gap-4 rounded-lg px-2 text-body-sm transition-colors hover:bg-surface-soft">
                        <span className="truncate font-semibold text-ink">{gap.skill}</span>
                        <span className="shrink-0 text-xs text-muted tabular-nums">{gap.weeks_to_learn}w</span>
                      </a>
                    )) : <p className="font-sans text-body-sm text-muted">No priority gaps detected.</p>}
                  </div>
                </div>
              </div>
            </section>

            <LayoutParseWarning
              hasMultiColumn={data.fraud_audit?.formatting_issues?.some(
                (i) => i.toLowerCase().includes('column') || i.toLowerCase().includes('multi')
              ) ?? false}
              hasTables={data.fraud_audit?.formatting_issues?.some(
                (i) => i.toLowerCase().includes('table')
              ) ?? false}
              hasHiddenText={data.fraud_audit?.hidden_text_detected ?? false}
            />

            {/* Learning Roadmap (Placed ABOVE Priority Skill Gaps) */}
            <section id="learning-roadmap" className="scroll-mt-28 rounded-3xl border border-hairline bg-surface-card p-6 md:p-8">
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

            {/* Priority Skill Gaps */}
            <section id="priority-gaps" className="scroll-mt-28 pt-4 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
                <div>
                  <p className="font-sans text-[10px] text-brand-teal uppercase tracking-widest font-bold mb-1">Your next actions</p>
                  <h2 className="font-display text-title-lg md:text-display-sm tracking-tight">Priority skill gaps</h2>
                  <p className="font-sans text-body-sm text-muted mt-1 max-w-xl">Each card explains the gap, shows the evidence, and keeps the learning links in one place.</p>
                </div>
                <GenerateAllButton
                  isVisible={data.skill_gaps.filter((gap) => !data.generated_resources?.[gap.skill]).length > 2 && !batchGenerating}
                  isGenerating={batchGenerating}
                  currentCount={batchProgress.current}
                  totalCount={batchProgress.total}
                  onGenerateAll={handleGenerateAll}
                />
              </div>

              {/* Feature 2: Role-Aware Learning Item Filters */}
              <RoleFilterTabs
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                counts={roleCounts}
              />

              <div className="divide-y divide-hairline pt-2">
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

            {/* Progress Reweighter */}
            <section id="progress" className="scroll-mt-28 rounded-3xl border border-hairline bg-surface-card p-6 md:p-8">
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
                  {!activeJob && (
                    <PinJobButton
                      analysisId={data.share_token}
                      jobTitle={data.role_label || 'Target Role'}
                      companyType={data.company_type || 'startup'}
                      role={data.role_label || ''}
                      seniority={seniorityLevel || 'senior'}
                      skillGaps={filteredGaps}
                      resumeSkills={data.resume_skills || data.matched_skills}
                      readinessScore={readinessScore}
                      isPinned={false}
                      onPinned={handlePinned}
                      variant="inline"
                    />
                  )}
                </div>
              </div>
              <div className="mt-6"><ProgressBar progress={readinessScore} className="h-2" /></div>
            </section>

            {/* Unified AI Career & Optimization Toolkit */}
            <UnifiedToolkit
              data={data}
              activeGaps={activeGaps}
              freshnessResult={freshnessResult}
              onSeniorityChange={setSeniorityLevel}
            />
          </div>
        </div>
      </div>
      <OpenJobModal
        isOpen={showOpenJobModal}
        onClose={() => setShowOpenJobModal(false)}
        jobTitle={data.role_label || 'Target Role'}
        readinessScore={readinessScore}
        companyType={data.company_type}
        analysisId={data.share_token}
      />
    </main>
  );
}
