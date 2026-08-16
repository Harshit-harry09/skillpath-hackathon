'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, LoaderCircle, Share2, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveToHistory } from '@/lib/history';
import { calculateKeywordBounty } from '@/lib/results/keyword-bounty';
import { buildRecruiterHeatmap } from '@/lib/results/recruiter-heatmap';
import { featureFlags } from '@/lib/feature-flags';
import type { AnalysisResult, ContactInfo, ExperienceAnalysis, FraudAuditResult } from '@/types/analysis';
import { AtsBotVision } from '@/components/results/AtsBotVision';
import { AtlasLaunchCTA } from '@/components/results/AtlasLaunchCTA';
import { BulletSurgery } from '@/components/results/BulletSurgery';
import { EvidenceLocker } from '@/components/results/EvidenceLocker';
import { KeywordBountyBoard } from '@/components/results/KeywordBountyBoard';
import { RecruiterHeatmap } from '@/components/results/RecruiterHeatmap';
import { ResumeAutopsy } from '@/components/results/ResumeAutopsy';
import { RecruiterRedFlagRadar } from '@/components/results/RecruiterRedFlagRadar';
import { MultiFormatExporter } from '@/components/results/MultiFormatExporter';
import { ThisJdApplyKit } from '@/components/results/ThisJdApplyKit';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackContact(): ContactInfo {
  return { name: null, email: null, phone: null, location: null, linkedin_url: null, github_url: null, portfolio_url: null };
}

function fallbackExperience(): ExperienceAnalysis {
  return { total_yoe: 0, relevant_yoe: 0, seniority_level: 'entry', career_progression: 'unclear', employment_gaps: [], parsed_history: [] };
}

function fallbackFraudAudit(): FraudAuditResult {
  return { is_flagged: false, risk_level: 'clean', hidden_text_detected: false, keyword_stuffing_score: 0, fraud_flags: [], formatting_issues: [] };
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(`/api/results/${encodeURIComponent(id)}`, { headers });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'This analysis could not be loaded.');
        if (!cancelled) setData(payload as AnalysisResult);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'This analysis could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [getToken, id]);

  const score = useMemo(() => {
    if (!data) return 0;
    return clampScore(data.composite_ats_score?.overall_score ?? 100 - (data.gap_score || 0));
  }, [data]);

  const missingSkills = useMemo(() => {
    if (!data) return [];
    return data.missing_skills || data.skill_gaps?.map((gap) => gap.skill) || [];
  }, [data]);
  const jdSkills = useMemo(() => data?.jd_skills || [...(data?.matched_skills || []), ...missingSkills], [data, missingSkills]);
  const mvcSkills = useMemo(() => data?.mvc_skills || data?.jd_requirements?.must_have_skills || [], [data]);
  const bounties = useMemo(() => data ? calculateKeywordBounty(missingSkills, jdSkills, mvcSkills, score) : [], [data, jdSkills, missingSkills, mvcSkills, score]);
  const heatmap = useMemo(() => data ? buildRecruiterHeatmap(data) : [], [data]);
  const bullets = useMemo(() => data?.experience_analysis?.parsed_history?.flatMap((item) => item.bullet_points || []) || [], [data]);
  const contactInfo = data?.contact_info || fallbackContact();
  const experienceAnalysis = data?.experience_analysis || fallbackExperience();
  const fraudAudit = data?.fraud_audit || fallbackFraudAudit();
  const parsedText = data?.parsed_text || data?.resume_text || [
    contactInfo.name || 'CONTACT',
    data?.role_label || 'TARGET ROLE',
    'EXPERIENCE',
    ...experienceAnalysis.parsed_history.map((item) => `${item.title} — ${item.company}`),
    'EDUCATION',
    ...(data?.education_info || []).map((item) => `${item.degree} — ${item.institution}`),
  ].join('\n');

  function handleShare() {
    void navigator.clipboard.writeText(window.location.href);
  }

  function handleSave() {
    if (!data) return;
    saveToHistory({ type: 'analyze', share_token: data.share_token, gap_score: data.gap_score || 0, weeks_required: data.weeks_required || 0, company_type: data.company_type || 'unknown', mvc_skills: mvcSkills, created_at: data.created_at, jd_preview: data.jd_preview || '' });
    setSaved(true);
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-canvas text-ink"><div className="flex items-center gap-3 text-sm text-muted"><LoaderCircle className="h-5 w-5 animate-spin text-brand-teal" /> Loading your machine verdict…</div></main>;
  if (error || !data) return <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-center text-ink"><div><h1 className="font-display text-3xl font-semibold">Analysis not found</h1><p className="mt-3 text-sm text-muted">{error || 'This link may be invalid or expired.'}</p><Link href="/analyze" className="mt-6 inline-flex rounded-xl bg-ink px-4 py-3 text-sm font-bold text-on-primary">Run another analysis</Link></div></main>;

  // learning_plan_source remains part of the stored compatibility contract,
  // but the old long-form plan is intentionally not rendered on Results.
  const quickFixes = missingSkills.slice(0, 3).map((skill) => ({
    skill,
    resource: data.generated_resources?.[skill]?.resources?.[0],
  }));

  return (
    <main className="min-h-screen bg-canvas px-4 pb-24 pt-24 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <header className="border-b border-hairline pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-teal">Machine court / analysis complete</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Hard ATS Match Score</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted">How this resume matches this exact job description.</p></div>
            <div className="flex gap-2"><button type="button" onClick={handleSave} className="rounded-xl border border-hairline bg-surface-card px-3.5 py-2.5 text-xs font-bold hover:bg-surface-strong">{saved ? 'Saved' : 'Save result'}</button><button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-xl bg-surface-card px-3.5 py-2.5 text-xs font-bold hover:bg-surface-strong"><Share2 className="h-3.5 w-3.5" /> Share</button></div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="rounded-3xl bg-ink p-6 text-on-primary"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">Overall verdict</p><p className="mt-3 font-mono text-6xl font-bold tabular-nums">{score}<span className="text-2xl text-white/50">/100</span></p><p className="mt-3 text-xs leading-5 text-white/70">Based on keywords, formatting, experience, education, and job-description alignment.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(data.composite_ats_score?.breakdown || { skills_score: 0, experience_score: 0, education_score: 0, title_score: 0, formatting_score: 0 }).map(([key, value]) => <div key={key} className="rounded-2xl border border-hairline bg-surface-card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{key.replace('_score', '')}</p><p className="mt-3 font-mono text-2xl font-bold tabular-nums text-ink">{value}</p><div className="mt-3 h-1.5 rounded-full bg-surface-soft"><div className="h-full rounded-full bg-brand-teal" style={{ width: `${clampScore(Number(value))}%` }} /></div></div>)}</div>
          </div>
          <p className="mt-4 text-xs text-muted">{data.jd_preview || data.role_label || 'Target job'} · {jdSkills.length} requirements checked · {missingSkills.length} missing JD keywords</p>
        </header>

        <div className="mt-8 space-y-8">
          {featureFlags.showAtsBotVision && <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]"><AtsBotVision shareToken={data.share_token} parsedText={parsedText} contactInfo={contactInfo} experienceAnalysis={experienceAnalysis} educationInfo={data.education_info} fraudAudit={fraudAudit} pdfPreviewUrl={data.pdf_url} /><ResumeAutopsy data={data} /></div>}

          <section aria-labelledby="compliance-audit-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal"><ShieldCheck className="h-4 w-4" /> File forensics</div><h2 id="compliance-audit-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Resume Compliance Audit</h2><p className="mt-1 text-sm text-muted">Auditing your resume file, not the employer.</p><div className="mt-5"><RecruiterRedFlagRadar data={data} /></div></section>

          {featureFlags.showKeywordBounty && <KeywordBountyBoard items={bounties} />}

          {featureFlags.showRecruiterHeatmap && <RecruiterHeatmap zones={heatmap} />}

          <section aria-labelledby="seniority-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lavender"><Wrench className="h-4 w-4" /> Calibration</div><h2 id="seniority-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Seniority calibration</h2><p className="mt-1 text-sm text-muted">Parsed experience is compared with what this job description asks for.</p><div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-surface-soft p-4"><p className="text-[10px] uppercase tracking-widest text-muted">Parsed YOE</p><p className="mt-2 font-mono text-xl font-bold">{experienceAnalysis.total_yoe}</p></div><div className="rounded-xl bg-surface-soft p-4"><p className="text-[10px] uppercase tracking-widest text-muted">Relevant YOE</p><p className="mt-2 font-mono text-xl font-bold">{experienceAnalysis.relevant_yoe}</p></div><div className="rounded-xl bg-surface-soft p-4"><p className="text-[10px] uppercase tracking-widest text-muted">Required YOE</p><p className="mt-2 font-mono text-xl font-bold">{data.jd_requirements?.required_yoe || '—'}</p></div><div className="rounded-xl bg-surface-soft p-4"><p className="text-[10px] uppercase tracking-widest text-muted">Senior level</p><p className="mt-2 text-xl font-bold capitalize">{experienceAnalysis.seniority_level}</p></div></div></section>

          {featureFlags.showBulletSurgery && <BulletSurgery bullets={bullets} targetRole={data.role_label || 'Target Role'} missingSkills={missingSkills} matchedSkills={data.matched_skills || []} />}

          <section aria-labelledby="quick-fixes-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ochre"><CheckCircle2 className="h-4 w-4" /> Immediate repairs</div><h2 id="quick-fixes-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Quick Fixes</h2><p className="mt-1 text-sm text-muted">Three tactical fixes, one resource each, and a place to make the change.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{quickFixes.length ? quickFixes.map((fix) => <article key={fix.skill} className="rounded-2xl border border-hairline bg-surface-soft p-4"><p className="text-sm font-semibold text-ink">Add {fix.skill}</p><p className="mt-2 text-xs leading-5 text-muted">Place it in the skills section or a truthful experience bullet.</p>{fix.resource ? <a href={fix.resource.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-teal">{fix.resource.title} <ArrowUpRight className="h-3.5 w-3.5" /></a> : <p className="mt-4 text-xs font-semibold text-brand-ochre">Find a proof source for this skill.</p>}</article>) : <div className="rounded-2xl bg-brand-teal/10 p-5 text-sm text-ink">No immediate keyword repair is required.</div>}</div></section>

          {featureFlags.showEvidenceLocker && <EvidenceLocker skills={missingSkills} analysisId={data.share_token} />}

          <section aria-labelledby="export-kit-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal"><Wrench className="h-4 w-4" /> Finalize the file</div><h2 id="export-kit-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">ATS Export Kit</h2><p className="mt-1 mb-5 text-sm text-muted">Export a clean version after you make the evidence-backed repairs.</p><MultiFormatExporter data={data} /></section>

          <ThisJdApplyKit role={data.role_label || 'Target Role'} skills={data.matched_skills || data.resume_skills || []} />

          {featureFlags.showAtlasLaunchCTA && <AtlasLaunchCTA analysisId={data.share_token} score={score} />}
        </div>
      </div>
    </main>
  );
}
