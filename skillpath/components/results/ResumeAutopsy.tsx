import { Activity, AlertCircle } from 'lucide-react';
import type { AnalysisResult } from '@/types/analysis';

export function ResumeAutopsy({ data }: { data: AnalysisResult }) {
  const missingMustHaves = (data.missing_skills || data.skill_gaps?.filter((gap) => gap.in_mvc).map((gap) => gap.skill) || []).slice(0, 2);
  const bullets = (data.experience_analysis?.parsed_history || []).flatMap((item) => item.bullet_points || []);
  const issues = [
    ...missingMustHaves.map((skill) => `Missing must-have skill: ${skill}`),
    ...(bullets.length && !bullets.some((bullet) => /\d/.test(bullet)) ? ['No quantified achievements detected'] : []),
    ...(data.fraud_audit?.formatting_issues || []).slice(0, 2).map((issue) => `Formatting risk: ${issue}`),
    ...(data.experience_analysis?.employment_gaps || []).length ? ['Timeline gap needs a clear explanation'] : [],
    ...(data.experience_analysis?.seniority_level && data.jd_requirements?.required_yoe && data.experience_analysis.total_yoe < data.jd_requirements.required_yoe
      ? [`Experience mismatch: ${data.experience_analysis.total_yoe} years parsed vs ${data.jd_requirements.required_yoe} required`]
      : []),
  ].slice(0, 3);

  return (
    <section aria-labelledby="autopsy-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-pink"><Activity className="h-4 w-4" /> Forensic readout</div>
      <h2 id="autopsy-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Why you are losing</h2>
      <p className="mt-1 text-sm leading-6 text-muted">These issues are damaging your ATS match the most.</p>
      <ol className="mt-5 space-y-3">
        {(issues.length ? issues : ['No dominant score killer detected. Keep the evidence clean and specific.']).map((issue, index) => <li key={issue} className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3 text-sm text-ink"><span className="font-mono text-brand-pink">{index + 1}</span><span>{issue}</span></li>)}
      </ol>
      {!issues.length && <div className="mt-4 flex items-center gap-2 text-xs text-brand-teal"><AlertCircle className="h-4 w-4" /> The scan is clear enough to move into the Fix Lab.</div>}
    </section>
  );
}

