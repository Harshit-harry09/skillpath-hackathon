import type { AnalysisResult } from '@/types/analysis';

export interface HeatmapZone {
  id: string;
  label: string;
  importance: number;
  status: 'good' | 'warning' | 'missing';
  advice: string;
}

export function buildRecruiterHeatmap(analysis: AnalysisResult): HeatmapZone[] {
  const latestTitle = analysis.experience_analysis?.parsed_history?.[0]?.title;
  const hasSkills = Boolean((analysis.user_skills || analysis.resume_skills || []).length);
  const hasEducation = Boolean(analysis.education_info?.length);
  const hasMetrics = Boolean((analysis.experience_analysis?.parsed_history || [])
    .flatMap((item) => item.bullet_points || [])
    .some((bullet) => /\d/.test(bullet)));
  const gaps = analysis.experience_analysis?.employment_gaps || [];

  return [
    {
      id: 'job_title',
      label: 'Latest job title',
      importance: 95,
      status: latestTitle ? 'good' : 'missing',
      advice: 'Keep the latest title visible near the top and align it to the target role where truthful.',
    },
    {
      id: 'skills',
      label: 'Skills section',
      importance: 90,
      status: hasSkills ? 'good' : 'missing',
      advice: 'Use a clean, text-based skills section for the must-have JD terms you can support.',
    },
    {
      id: 'metrics',
      label: 'Quantified achievements',
      importance: 85,
      status: hasMetrics ? 'good' : 'warning',
      advice: 'Add numbers such as volume, time saved, users, revenue, error rate, or latency.',
    },
    {
      id: 'education',
      label: 'Education',
      importance: 70,
      status: hasEducation ? 'good' : 'missing',
      advice: 'Keep degree, institution, and year in a conventional text block.',
    },
    {
      id: 'gaps',
      label: 'Employment gaps',
      importance: 65,
      status: gaps.length ? 'warning' : 'good',
      advice: gaps.length ? 'Prepare a concise explanation. Atlas can translate the human context.' : 'No obvious timeline gap was detected.',
    },
    {
      id: 'contact',
      label: 'Contact line',
      importance: 88,
      status: analysis.contact_info?.email || analysis.contact_info?.phone ? 'good' : 'missing',
      advice: 'Put an email and phone number in plain text at the top of the document.',
    },
  ];
}

