'use client';

import React, { useEffect, useState, useMemo, useCallback, use } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Info,
  Zap,
  Clock,
  Target,
  FileText,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Accordion } from '@/components/ui/Accordion';
import { saveToHistory, getHistory } from '@/lib/history';
import type { AnalysisResult, Resource, ConfidenceLevel } from '@/types/analysis';
import { SkillCard } from '@/components/results/SkillCard';
import { GenerateAllButton } from '@/components/results/GenerateAllButton';
import { PinJobButton } from '@/components/results/PinJobButton';
import { ReadinessRing } from '@/components/results/ReadinessRing';
import { AnalysisInsights } from '@/components/results/AnalysisInsights';
import { FoundationalPillars } from '@/components/results/FoundationalPillars';
import { RoleSwitchPanel } from '@/components/results/RoleSwitchPanel';
import { FreshnessScoreCard } from '@/components/results/FreshnessScoreCard';
import { CareerCompass } from '@/components/results/CareerCompass';
import { reweightGaps, recomputeReadinessWithConfidence, recomputeWeeks } from '@/lib/confidence-reweighter';
import { useAuth } from '@/context/AuthContext';
import { ConfidenceStrip } from '@/components/results/ConfidenceStrip';
import { SelfAssessmentModal } from '@/components/results/SelfAssessmentModal';
import { computeFreshnessScore } from '@/lib/skill-expiry';
import { SalaryRoiCard } from '@/components/results/SalaryRoiCard';
import { StarBulletModal } from '@/components/results/StarBulletModal';
import { AtsAuditorCard } from '@/components/analyze/AtsAuditorCard';
import { BuzzwordEraserCard } from '@/components/results/BuzzwordEraserCard';
import { CompanyAlignmentMatrix } from '@/components/results/CompanyAlignmentMatrix';
import { SkillConfidenceHeatMap } from '@/components/results/SkillConfidenceHeatMap';
import { TimeToReadyEstimator } from '@/components/results/TimeToReadyEstimator';
import { CoverLetterGenerator } from '@/components/results/CoverLetterGenerator';
import { QuantificationScanner } from '@/components/results/QuantificationScanner';
import { KeywordDensityChecker } from '@/components/results/KeywordDensityChecker';
import { LinkedInHeadlineOptimizer } from '@/components/results/LinkedInHeadlineOptimizer';
import { CompetitiveBenchmarkScore } from '@/components/results/CompetitiveBenchmarkScore';
import { ResumeTimeMachine } from '@/components/results/ResumeTimeMachine';

export default function ResultsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ skill?: string, new?: string }>
}) {
  const { id } = use(params);
  const unwrappedSearchParams = use(searchParams);
  const targetSkill = unwrappedSearchParams.skill;
  const isNewAnalysis = unwrappedSearchParams.new === 'true';
  const { user, getToken } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'gaps' | 'insights' | 'trajectory'>('gaps');
  const [starModalSkill, setStarModalSkill] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults(retries = 3) {
      // 1. Instant 0ms load from sessionStorage cache (for fresh guest/session analyses)
      try {
        const cached = sessionStorage.getItem(`analysis_${id}`);
        if (cached) {
          const json = JSON.parse(cached);
          console.log('[Results] Loaded instantly from sessionStorage cache:', id);
          setData(json);
          setLoading(false);
          const hasExisting = Object.keys(json.assessments || {}).length > 0;
          if (isNewAnalysis && !hasExisting) {
            setShowAssessmentModal(true);
          }
          return;
        }
      } catch (e) {
        console.warn('[Results] Session storage read issue:', e);
      }

      // 2. Fetch from database API with retries
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(`/api/results/${id}`);
          if (res.ok) {
            const json = await res.json();
            console.log('[Results] Data loaded from API:', id);
            setData(json);
            setLoading(false);
            
            try {
              sessionStorage.setItem(`analysis_${id}`, JSON.stringify(json));
            } catch { /* ignore */ }

            const hasExisting = Object.keys(json.assessments || {}).length > 0;
            if (isNewAnalysis && !hasExisting) {
              setShowAssessmentModal(true);
            }
            return;
          }

          if (res.status === 404 && i < retries - 1) {
            console.log(`[Results] Attempt ${i + 1} failed (404), retrying in 1s...`);
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          throw new Error('Analysis not found');
        } catch (err) {
          if (i === retries - 1) {
            // Provide demo sample analysis fallback if error occurs or sample requested
            setData({
              share_token: id || 'sample',
              gap_score: 78,
              mvc_skills: ['System Architecture', 'AI & Agent Systems'],
              ready_by_date: new Date(Date.now() + 30 * 86400000).toISOString(),
              weeks_required: 4,
              company_type: 'Tech Enterprise',
              role_label: 'Senior Full Stack Engineer',
              jd_skills: ['System Architecture', 'AI & Agent Systems', 'Kubernetes', 'GraphQL', 'React', 'Node.js'],
              resume_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
              skill_gaps: [
                { skill: 'System Architecture', category: 'Backend Architecture', priority: 1, weeks_to_learn: 2, in_mvc: true, reason: 'Critical for scaling microservices.' },
                { skill: 'AI & Agent Systems', category: 'AI / Machine Learning', priority: 2, weeks_to_learn: 2, in_mvc: true, reason: 'Essential for integrating modern LLMs.' },
                { skill: 'Kubernetes & Cloud Native', category: 'DevOps & Infra', priority: 3, weeks_to_learn: 3, in_mvc: false, reason: 'Required for container orchestration.' },
                { skill: 'GraphQL & Microservices', category: 'API Design', priority: 4, weeks_to_learn: 2, in_mvc: false, reason: 'Improves API efficiency.' }
              ],
              learning_plan: { weeks: [
                { week: 1, skill: 'System Architecture', resources: [] },
                { week: 2, skill: 'AI & Agent Systems', resources: [] }
              ] },
              jd_preview: 'Senior Full Stack Engineer focusing on distributed systems and AI agent orchestration.',
              created_at: new Date().toISOString()
            });
            setLoading(false);
          }
        } finally {
          if (i === retries - 1) setLoading(false);
        }
      }
    }
    fetchResults();
  }, [id, isNewAnalysis]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const [saved, setSaved] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);

  // ── Confidence Self-Assessment State ────────────────────────
  const [assessments, setAssessments] = useState<Record<string, ConfidenceLevel>>({});

  const handleConfidenceChange = useCallback((skill: string, level: ConfidenceLevel) => {
    setAssessments(prev => ({ ...prev, [skill]: level }));
  }, []);

  // Derive reweighted data from assessments (pure computation, no API)
  const hasAssessments = Object.keys(assessments).length > 0;

  const { activeGaps, masteredSkills } = useMemo(() => {
    if (!data) return { activeGaps: [], masteredSkills: [] };
    return reweightGaps(data.skill_gaps, assessments);
  }, [data, assessments]);

  const adjustedReadiness = useMemo(() => {
    if (!data || !hasAssessments) return undefined;
    return recomputeReadinessWithConfidence(data.skill_gaps, data.resume_skills || [], assessments);
  }, [data, assessments, hasAssessments]);

  const adjustedWeeks = useMemo(() => {
    if (!data || !hasAssessments) return undefined;
    return recomputeWeeks(data.skill_gaps, assessments);
  }, [data, assessments, hasAssessments]);

  const adjustedCritical = useMemo(() => {
    if (!hasAssessments) return undefined;
    return activeGaps.filter(g => {
      const p = g.adjusted_priority ?? g.priority;
      return p <= 2;
    }).length;
  }, [activeGaps, hasAssessments]);

  const [dynamicLimit, setDynamicLimit] = useState(5);

  // Auto-expand when 50% of current visible gaps are mastered
  useEffect(() => {
    if (data) {
      const currentVisible = data.skill_gaps.slice(0, dynamicLimit);
      const masteredCount = currentVisible.filter(g => assessments[g.skill] === 'strong').length;
      if (masteredCount / dynamicLimit > 0.5 && dynamicLimit < data.skill_gaps.length) {
        setDynamicLimit(prev => Math.min(prev + 5, data.skill_gaps.length));
      }
    }
  }, [assessments, data, dynamicLimit]);

  // Auto-scroll to target skill if provided in URL
  useEffect(() => {
    if (targetSkill && !loading && data) {
      const id = `skill-${targetSkill.toLowerCase().replace(/\s+/g, '-')}`;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [targetSkill, loading, data]);

  // Fetch active job to sync tracking status
  useEffect(() => {
    async function fetchActiveJob() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/active-job', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.active_job?.analysis_id === id) {
            setActiveJob(json.active_job);
          }
        }
      } catch (err) {
        console.error('Failed to fetch active job:', err);
      }
    }
    fetchActiveJob();
  }, [id]);

  const handleTrackingChange = async (skill: string, state: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/active-job', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skill, state }),
      });
      if (res.ok) {
        const json = await res.json();
        setActiveJob((prev: any) => ({
          ...prev,
          skills: json.skills,
          readiness_score: json.readiness_score
        }));
      }
    } catch (err) {
      console.error('Failed to update tracking:', err);
    }
  };

  useEffect(() => {
    if (data) {
      const history = getHistory();
      setSaved(history.some((h) => h.share_token === data.share_token));
    }
  }, [data]);

  const handleGeneratePlan = async () => {
    if (generatingPlan) return;
    setGeneratingPlan(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/results/${id}/plan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const learningPlan = await res.json();
      setData(prev => prev ? { ...prev, learning_plan: learningPlan } : null);
    } catch (err) {
      alert('Failed to generate learning plan. Please try again.');
      console.error(err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!data || batchGenerating) return;

    const pendingSkills = data.skill_gaps.filter(
      gap => !data.generated_resources?.[gap.skill]
    );

    if (pendingSkills.length === 0) return;

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: pendingSkills.length });

    for (let i = 0; i < pendingSkills.length; i++) {
      const gap = pendingSkills[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const res = await fetch('/api/generate-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_id: data.share_token,
            skill: gap.skill,
            role: data.role_label || 'Software Engineer',
            seniority: 'entry',
            company_type: data.company_type,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              generated_resources: {
                ...(prev.generated_resources || {}),
                [gap.skill]: result.skill_resources,
              },
            };
          });
        }
      } catch (err) {
        console.error(`Failed to generate resources for ${gap.skill}:`, err);
      }

      if (i < pendingSkills.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setBatchGenerating(false);
  };

  const handleSave = () => {
    if (!data) return;
    saveToHistory({
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

  const currentScore = adjustedReadiness ?? (activeJob ? activeJob.readiness_score : (data?.gap_score ?? 0));

  const remainingWeeks = adjustedWeeks ?? (activeJob
    ? activeJob.skills
      .filter((s: any) => s.state !== 'learned')
      .reduce((sum: number, s: any) => sum + (s.weeks_to_learn || 1), 0)
    : (data?.weeks_required ?? 0));

  const readyDate = new Date();
  readyDate.setDate(readyDate.getDate() + (remainingWeeks * 7));

  const freshnessResult = useMemo(() => {
    if (!data?.resume_skills) return null;
    return computeFreshnessScore(data.resume_skills);
  }, [data?.resume_skills]);

  // -- Early Returns for UI states --
  if (loading) {
    return (
      <main className="flex flex-col min-h-screen bg-canvas text-ink pt-[64px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="font-sans text-muted">Loading your analysis...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-col min-h-screen bg-canvas text-ink pt-[64px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <h1 className="font-display text-title-lg mb-4">Analysis not found</h1>
            <p className="font-sans text-muted">{error || 'This link may be invalid or expired.'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen pb-24 bg-canvas text-ink relative pt-[64px]">
      <SelfAssessmentModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        gaps={data?.skill_gaps || []}
        resumeSkills={data?.resume_skills || []}
        mvcSkills={data?.mvc_skills || []}
        assessments={assessments}
        onConfidenceChange={handleConfidenceChange}
        roleName={data?.role_category || 'Target Role'}
      />
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-24 pt-8 md:pt-16 w-full">

        {/* Results Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-hairline pb-8 gap-6">
          <div className="max-w-2xl">
            <span className="font-sans text-nav-link text-brand-teal uppercase tracking-[0.06em] mb-3 block flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              {activeJob ? 'Active Learning Path' : 'Analysis Complete'}
            </span>
            <h1 className="font-display text-[32px] md:text-display-lg font-semibold leading-[1.1] md:leading-[1.05] tracking-[-0.04em] mb-4 text-balance">
              {remainingWeeks > 0
                ? `Hey ${firstName}, you're ${remainingWeeks} weeks from job-ready.`
                : `Hey ${firstName}, you're ready to apply!`}
            </h1>
            <p className="font-sans text-body-md text-muted max-w-xl">
              {remainingWeeks > 0 ? (
                <>Based on your resume, you need to close <span className="text-ink font-medium">{activeGaps.length} skill gaps</span>. Dedicate 1 hr/day to be ready by <span className="text-ink font-medium">{readyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>.</>
              ) : (
                <>Your profile matches the essential requirements for this role. You are good to go!</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 mt-2 md:mt-0">
            <button
              onClick={handleSave}
              disabled={saved}
              className={`flex-1 md:flex-none font-sans font-semibold text-button px-4 md:px-6 py-2.5 md:py-3 rounded-md border transition-all ${saved
                ? 'text-brand-teal border-brand-teal/20 bg-brand-teal/5 cursor-default'
                : 'text-ink border-hairline hover:bg-surface-soft'
                }`}
            >
              {saved ? '✓ Saved' : 'Save'}
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
              className="flex-1 md:flex-none bg-primary text-on-primary font-sans font-semibold text-button px-4 md:px-6 py-2.5 md:py-3 rounded-md hover:bg-primary-active transition-colors"
            >
              Share ↗
            </button>
          </div>
        </div>

        {/* STAR Bullet Modal */}
        <StarBulletModal
          isOpen={!!starModalSkill}
          onClose={() => setStarModalSkill(null)}
          skill={starModalSkill || ''}
          role={data.role_label || 'Software Engineer'}
        />

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 mb-10 border-b border-hairline pb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-6 py-3 rounded-xl font-sans font-semibold text-body-sm transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'gaps'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <Target size={16} />
            🎯 Skill Gaps & Roadmap
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 rounded-xl font-sans font-semibold text-body-sm transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'insights'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <Sparkles size={16} />
            📊 Deep Insights & ATS
          </button>
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`px-6 py-3 rounded-xl font-sans font-semibold text-body-sm transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'trajectory'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <Zap size={16} />
            🚀 Career Trajectory
          </button>
        </div>

        {/* TAB 1: SKILL GAPS & ROADMAP */}
        {activeTab === 'gaps' && (
          <div className="space-y-8">

            {/* Row 1: Salary ROI — full width hero */}
            <SalaryRoiCard
              roleCategory={data.role_category || ''}
              roleLabel={data.role_label || 'Software Engineer'}
              gapCount={activeGaps.length}
              mvcSkills={data.mvc_skills || []}
            />

            {/* Row 2: Skill Heat Map (left 7) + Time-to-Ready (right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 h-full">
                <SkillConfidenceHeatMap
                  mvcSkills={data.mvc_skills || []}
                  gapSkills={activeGaps.map(g => g.skill)}
                  assessments={assessments}
                  onConfidenceChange={handleConfidenceChange}
                />
              </div>
              <div className="lg:col-span-5 h-full">
                <TimeToReadyEstimator
                  gapCount={activeGaps.length}
                  criticalCount={activeGaps.filter(g => g.in_mvc).length}
                />
              </div>
            </div>

            {/* Row 3: Main gap list (left 7) + sticky roadmap (right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-12">

                {/* Gap & Readiness Score */}
                <div>
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
                  {activeJob && (
                    <div className="shrink-0">
                      <ReadinessRing score={currentScore} color={activeJob.color} size={120} strokeWidth={8} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-sans text-nav-link text-muted uppercase tracking-[0.06em]">
                        {activeJob ? 'Current Readiness' : 'Gap Score'}
                      </span>
                      {activeJob && (
                        <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-hairline text-[10px] text-muted font-bold uppercase tracking-widest">
                          Match: {data.gap_score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-center md:justify-start gap-2 mb-6 md:mb-8">
                      <span className="font-display text-[64px] md:text-[96px] leading-none tracking-tight">{currentScore}</span>
                      <span className="font-sans text-display-sm text-muted">/ 100</span>
                    </div>
                    <ProgressBar progress={currentScore} className="h-4" />
                    <div className="flex justify-between mt-4">
                      <span className="font-sans text-body-md font-medium">
                        {activeJob ? `${currentScore}% prepared for this role` : `${currentScore}% resume match`}
                      </span>
                      <span className="font-sans text-body-sm text-muted">
                        {activeJob ? 'Target: 80% to apply' : `${100 - data.gap_score}% gap to close`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MVC Profile */}
              <div className="pt-8 border-t border-hairline">
                <span className="font-sans text-nav-link text-muted uppercase tracking-[0.06em] mb-6 block">
                  The {data.mvc_skills.length} core essentials
                </span>
                <div className="flex flex-wrap gap-3 mb-6">
                  {data.mvc_skills.map((skill) => (
                    <Chip key={skill} variant="filled">{skill}</Chip>
                  ))}
                </div>
                <p className="font-sans text-body-md text-muted max-w-md">
                  These appear in 80%+ of similar job descriptions. Mastering these creates the strongest ROI for your career.
                </p>
              </div>

              {/* Skill Gap List */}
              <div className="pt-8 border-t border-hairline">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-sans text-nav-link text-muted uppercase tracking-[0.06em]">
                    Prioritized Skill Gaps
                  </span>
                </div>

                <GenerateAllButton
                  isVisible={
                    (activeGaps.filter(g => !data.generated_resources?.[g.skill]).length > 2) &&
                    !batchGenerating
                  }
                  isGenerating={batchGenerating}
                  currentCount={batchProgress.current}
                  totalCount={batchProgress.total}
                  onGenerateAll={handleGenerateAll}
                />

                <div className="flex flex-col divide-y divide-hairline">
                  <AnimatePresence initial={false}>
                    {(isListExpanded ? activeGaps : activeGaps.slice(0, dynamicLimit)).map((gap, i) => {
                      const variants: Array<'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'cream'> = [
                        'pink', 'teal', 'lavender', 'peach', 'ochre', 'cream'
                      ];
                      const colorVariant = variants[i % variants.length];

                      return (
                        <div key={gap.skill} className="py-6">
                          <SkillCard
                            gap={gap}
                            index={i}
                            analysisId={data.share_token}
                            role={data.role_label || 'Software Engineer'}
                            seniority="entry"
                            companyType={data.company_type}
                            initialResources={data.generated_resources?.[gap.skill]}
                            autoGenerate={(i === 0 && gap.in_mvc) || gap.skill === targetSkill}
                            colorVariant={colorVariant}
                            trackingState={activeJob?.skills?.find((s: any) => s.skill === gap.skill)?.state}
                            onTrackingChange={handleTrackingChange}
                            trackingColor={activeJob?.color}
                            confidenceLevel={assessments[gap.skill]}
                            onConfidenceChange={handleConfidenceChange}
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setStarModalSkill(gap.skill)}
                              className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-teal hover:underline uppercase tracking-wider"
                            >
                              <FileText size={12} />
                              Generate STAR Resume Bullets 🪄
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {activeGaps.length > 5 && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setIsListExpanded(!isListExpanded)}
                      className="font-sans text-button text-muted hover:text-ink transition-colors px-6 py-2 border border-hairline rounded-md hover:bg-surface-soft"
                    >
                      {isListExpanded ? 'View less' : `View ${activeGaps.length - 5} more skills`}
                    </button>
                  </div>
                )}
              </div>
              </div>
              {/* /left column lg:col-span-7 */}

              {/* Right Column: Weekly Roadmap */}
              <div className="lg:col-span-5">
                <div className="sticky top-32 p-8 rounded-3xl border border-hairline bg-surface-card shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  {!data.learning_plan?.weeks?.length ? (
                    <div className="text-center py-8">
                      <h3 className="font-display text-title-lg mb-4">Build your roadmap</h3>
                      <p className="font-sans text-body-md text-muted mb-8">
                        Generate a custom blueprint with curated resources.
                      </p>
                      <button
                        onClick={handleGeneratePlan}
                        disabled={generatingPlan}
                        className="w-full bg-primary text-on-primary font-sans font-semibold text-button py-4 rounded-md hover:bg-primary-active transition-all disabled:opacity-50"
                      >
                        {generatingPlan ? 'Generating...' : 'Create Learning Plan'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-sans text-nav-link text-muted uppercase tracking-[0.06em] mb-8 block">Weekly Roadmap</span>
                      <div className="space-y-2">
                        {(isPlanExpanded ? data.learning_plan.weeks : data.learning_plan.weeks.slice(0, 8)).map((week: any, wi: number) => (
                          <Accordion
                            key={`week-${wi}`}
                            title={`Week ${week.week}: ${week.skill}`}
                          >
                            <div className="space-y-4 pt-3">
                              {(week.resources || []).map((resource: any, ri: number) => (
                                <div key={ri} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-sans font-semibold text-body-md">{resource.title}</h5>
                                    {resource.url && (
                                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-sans text-body-sm">
                                        View ↗
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Accordion>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEEP INSIGHTS & ATS */}
        {activeTab === 'insights' && (
          <div className="space-y-8">

            {/* Row 1: ATS Auditor — full width hero */}
            <AtsAuditorCard resumeText={data.resume_text || ''} />

            {/* Row 2: Buzzword Eraser (left 7) + Quantification Scanner (right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 h-full">
                <BuzzwordEraserCard resumeText={data.resume_text || ''} />
              </div>
              <div className="lg:col-span-5 h-full">
                <QuantificationScanner resumeText={data.resume_text || ''} />
              </div>
            </div>

            {/* Row 3: Keyword Density (left 5) + Company Alignment Matrix (right 7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 h-full">
                <KeywordDensityChecker
                  resumeText={data.resume_text || ''}
                  mvcSkills={data.mvc_skills || []}
                />
              </div>
              <div className="lg:col-span-7 h-full">
                <CompanyAlignmentMatrix resumeText={data.resume_text || ''} />
              </div>
            </div>

            {/* Row 4: Freshness (left 6) + Role Switch (right 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {freshnessResult && (
                <FreshnessScoreCard data={freshnessResult} />
              )}
              {data.role_category && (
                <RoleSwitchPanel
                  resumeSkills={data.resume_skills || []}
                  resumeText={data.resume_text || ''}
                  currentRoleSlug={data.role_category}
                  currentRoleLabel={data.role_label || 'Software Engineer'}
                />
              )}
            </div>

            {/* Row 5: Cover Letter Generator — full width */}
            <CoverLetterGenerator
              roleLabel={data.role_label || 'Software Engineer'}
              topSkills={(data.matched_skills || data.mvc_skills || []).slice(0, 5)}
            />

            {/* Row 6: Resume Skills Breakdown — full width */}
            <div className="p-8 rounded-3xl border border-hairline bg-surface-card">
              <h3 className="font-display text-title-lg mb-6">Resume Skills Breakdown</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {(data.user_skills || data.resume_skills)?.map((skill: string) => {
                  const isMatched = data.matched_skills
                    ? data.matched_skills.includes(skill)
                    : data.mvc_skills?.some((m: string) => m.toLowerCase() === skill.toLowerCase());
                  return (
                    <span
                      key={skill}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
                        isMatched
                          ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal'
                          : 'bg-surface-soft border-hairline text-muted'
                      }`}
                    >
                      {isMatched && <span className="mr-1">✓</span>}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAREER TRAJECTORY */}
        {activeTab === 'trajectory' && (
          <div className="space-y-8">

            {/* Row 0: Hero 3-Year Resume Time Machine */}
            <ResumeTimeMachine
              roleLabel={data.role_label || 'Software Engineer'}
              baseSalary={95000}
              skillGaps={activeGaps}
              mvcSkills={data.mvc_skills || []}
            />

            {/* Row 1: Benchmark (left 5) + LinkedIn Optimizer (right 7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 h-full">
                <CompetitiveBenchmarkScore
                  matchPct={adjustedReadiness || 0}
                  freshnessScore={freshnessResult?.score}
                  gapCount={activeGaps.length}
                  criticalCount={activeGaps.filter(g => g.in_mvc).length}
                />
              </div>
              <div className="lg:col-span-7 h-full">
                <LinkedInHeadlineOptimizer
                  roleLabel={data.role_label || 'Software Engineer'}
                  topSkills={(data.matched_skills || data.mvc_skills || []).slice(0, 6)}
                />
              </div>
            </div>

            {/* Row 2: Foundational Pillars (left 6) + Analysis Insights (right 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FoundationalPillars
                pillars={data.foundational_prerequisites || (data as any).pillars || []}
                roleCategory={data.role_category}
              />
              <AnalysisInsights
                data={data}
                adjustedScore={adjustedReadiness}
                adjustedWeeks={adjustedWeeks}
                adjustedCriticalCount={adjustedCritical}
                masteredCount={masteredSkills.length}
              />
            </div>

            {/* Row 3: Next Seniority Jump — full width accent banner */}
            {data.trajectory && (
              <div className="p-8 rounded-3xl border border-brand-teal/20 bg-gradient-to-r from-brand-teal/5 to-primary/5">
                <p className="text-[11px] font-bold text-brand-teal uppercase tracking-widest mb-3">Next Seniority Jump</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-body-md text-muted">
                    Moving from <strong className="text-ink">{data.trajectory.current_role_label}</strong> to{' '}
                    <strong className="text-brand-teal">{data.trajectory.next_role_label}</strong>
                  </p>
                  <span className="px-5 py-2.5 rounded-xl bg-brand-teal text-white font-display font-bold text-title-md shrink-0">
                    +${data.trajectory.salary_jump?.toLocaleString()}/yr
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
