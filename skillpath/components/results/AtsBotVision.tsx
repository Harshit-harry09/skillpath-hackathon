import { AlertTriangle, CheckCircle2, FileText, ScanLine } from 'lucide-react';
import type { ContactInfo, EducationItem, ExperienceAnalysis, FraudAuditResult } from '@/types/analysis';

interface AtsBotVisionProps {
  shareToken: string;
  parsedText: string;
  contactInfo?: ContactInfo;
  experienceAnalysis?: ExperienceAnalysis;
  educationInfo?: EducationItem[];
  fraudAudit?: FraudAuditResult;
  pdfPreviewUrl?: string;
}

function status(ok: boolean, warning = false) {
  if (warning) return { label: 'Low confidence', className: 'text-brand-ochre', icon: AlertTriangle };
  return ok
    ? { label: 'Detected', className: 'text-brand-teal', icon: CheckCircle2 }
    : { label: 'Missing', className: 'text-brand-pink', icon: AlertTriangle };
}

export function AtsBotVision({
  shareToken,
  parsedText,
  contactInfo,
  experienceAnalysis,
  educationInfo,
  fraudAudit,
  pdfPreviewUrl,
}: AtsBotVisionProps) {
  const sections = [
    ['Contact line', Boolean(contactInfo?.email || contactInfo?.phone)],
    ['Experience', Boolean(experienceAnalysis?.parsed_history?.length)],
    ['Education', Boolean(educationInfo?.length)],
    ['Formatting', Boolean(!fraudAudit?.formatting_issues?.length), Boolean(fraudAudit?.formatting_issues?.length)],
  ] as const;

  return (
    <section aria-labelledby="robot-view-title" className="rounded-3xl border border-hairline bg-surface-card p-5 shadow-sm md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-teal">
            <ScanLine className="h-4 w-4" /> Machine court
          </div>
          <h2 id="robot-view-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Robot View</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">This is what the ATS parser actually reads from your PDF.</p>
        </div>
        <span className="rounded-md border border-hairline bg-surface-soft px-2.5 py-1 font-mono text-[10px] text-muted">scan {shareToken.slice(0, 8)}</span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-h-[260px] overflow-hidden rounded-2xl border border-hairline bg-surface-soft">
          {pdfPreviewUrl ? (
            <iframe title="Original PDF preview" src={pdfPreviewUrl} className="h-[360px] w-full" />
          ) : (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
              <FileText className="h-8 w-8 text-muted" />
              <p className="text-sm font-medium text-ink">Original PDF preview is available from the uploaded file.</p>
              <p className="text-xs leading-5 text-muted">This public result keeps the parsed output and audit signals without exposing the original binary.</p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-hairline bg-[#101313] text-[#eff7f3]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
            <span>Parsed ATS text</span>
            <span>read-only</span>
          </div>
          <pre data-lenis-prevent className="max-h-[318px] overflow-y-auto overscroll-contain touch-pan-y whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-white/85 scrollbar-thin">{parsedText || 'No parsed text was returned for this share.'}</pre>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map(([label, ok, warning]) => {
          const item = status(Boolean(ok), Boolean(warning));
          const Icon = item.icon;
          return (
            <div key={label} className="flex items-center justify-between rounded-xl border border-hairline bg-surface-soft px-3 py-2.5">
              <span className="text-xs font-semibold text-ink">{label}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${item.className}`}><Icon className="h-3.5 w-3.5" />{item.label}</span>
            </div>
          );
        })}
      </div>

      {(fraudAudit?.hidden_text_detected || fraudAudit?.formatting_issues?.length) ? (
        <div className="mt-4 rounded-xl border border-brand-ochre/30 bg-brand-ochre/10 px-4 py-3 text-xs leading-5 text-ink">
          <strong>Parser warning:</strong> {fraudAudit.hidden_text_detected ? 'hidden text detected; ' : ''}{fraudAudit.formatting_issues?.join('; ') || 'review the document structure.'}
        </div>
      ) : null}
    </section>
  );
}

