'use client';

import React, { useState } from 'react';
import { FileCode, FileText, Check, Unlock, Sparkles, Printer } from 'lucide-react';
import type { AnalysisResult } from '@/types/analysis';

interface MultiFormatExporterProps {
  data: AnalysisResult;
}

function buildMarkdownContent(data: AnalysisResult): string {
  const roleName = data.role_label || 'Target Role';
  let content = `# Resume — Tailored for ${roleName}\n\n`;
  content += `## Technical Summary\n${data.summary || 'Tailored technical professional.'}\n\n`;
  content += `## Key Competencies\n${(data.resume_skills || []).map((s) => `- ${s}`).join('\n')}\n\n`;
  if (data.evidence?.length) {
    content += `## Verified Project Evidence\n`;
    content += data.evidence.map((e) => `- **${e.skill}**: ${e.quote}`).join('\n');
    content += '\n\n';
  }
  if (data.matched_skills?.length) {
    content += `## Matched Requirements\n${data.matched_skills.map((s) => `- ${s}`).join('\n')}\n\n`;
  }
  return content;
}

function buildPlainTextContent(data: AnalysisResult): string {
  const roleName = data.role_label || 'Target Role';
  let content = `RESUME — TAILORED FOR ${roleName.toUpperCase()}\n${'='.repeat(50)}\n\n`;
  content += `TECHNICAL SUMMARY\n${data.summary || 'Tailored technical professional.'}\n\n`;
  content += `KEY COMPETENCIES\n${(data.resume_skills || []).map((s) => `• ${s}`).join('\n')}\n\n`;
  if (data.matched_skills?.length) {
    content += `MATCHED REQUIREMENTS\n${data.matched_skills.map((s) => `• ${s}`).join('\n')}\n\n`;
  }
  return content;
}
export function MultiFormatExporter({ data }: MultiFormatExporterProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const handleDownload = (format: 'text' | 'markdown') => {
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 3000);

    const roleName = (data.role_label || 'Target_Role').replace(/\s+/g, '_');
    const content = format === 'markdown' ? buildMarkdownContent(data) : buildPlainTextContent(data);
    const mimeType = 'text/plain;charset=utf-8';
    const extension = format === 'markdown' ? 'md' : 'txt';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillPath_Resume_${roleName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintToPDF = () => {
    setDownloadedFormat('pdf');
    setTimeout(() => setDownloadedFormat(null), 3000);
    // Open system print dialog — user can Save as PDF from there
    window.print();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <Unlock className="h-3.5 w-3.5" />
              Multi-Format Export • 100% Free
            </span>
          </div>
          <h3 className="text-base font-bold text-ink">
            Export Resume in ATS-Safe Formats
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Download clean plain text or Markdown. Use &ldquo;Print to PDF&rdquo; to save a browser-rendered PDF.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Zero Gatekeeping</span>
        </div>
      </div>

      {/* Export Options Stack */}
      <div className="mt-5 flex flex-col gap-3">
        {/* Print to PDF */}
        <button
          type="button"
          onClick={handlePrintToPDF}
          className="group flex items-center justify-between p-4 rounded-xl border border-hairline bg-surface-soft/60 hover:border-brand-teal hover:bg-surface-soft transition-all text-left cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal border border-brand-teal/20 group-hover:bg-brand-teal group-hover:text-slate-950 transition-colors shrink-0">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block">Print to PDF</span>
              <span className="text-[11px] text-muted">Via browser print dialog</span>
            </div>
          </div>
          {downloadedFormat === 'pdf' && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </button>

        {/* Plain Text .txt */}
        <button
          type="button"
          onClick={() => handleDownload('text')}
          className="group flex items-center justify-between p-4 rounded-xl border border-hairline bg-surface-soft/60 hover:border-brand-teal hover:bg-surface-soft transition-all text-left cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lavender/10 text-brand-lavender border border-brand-lavender/20 group-hover:bg-brand-lavender group-hover:text-slate-950 transition-colors shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block">Plain Text (.txt)</span>
              <span className="text-[11px] text-muted">100% Linear ATS Form</span>
            </div>
          </div>
          {downloadedFormat === 'text' && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </button>

        {/* Markdown .md */}
        <button
          type="button"
          onClick={() => handleDownload('markdown')}
          className="group flex items-center justify-between p-4 rounded-xl border border-hairline bg-surface-soft/60 hover:border-brand-teal hover:bg-surface-soft transition-all text-left cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-ochre/10 text-brand-ochre border border-brand-ochre/20 group-hover:bg-brand-ochre group-hover:text-slate-950 transition-colors shrink-0">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block">Markdown (.md)</span>
              <span className="text-[11px] text-muted">Developer Standard</span>
            </div>
          </div>
          {downloadedFormat === 'markdown' && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </button>
      </div>

      <p className="mt-4 text-[11px] text-muted leading-relaxed">
        <strong>PDF note:</strong> Use your browser&apos;s &ldquo;Print → Save as PDF&rdquo; option for a rendered PDF. Direct PDF generation from Markdown is not supported in-browser without a PDF library.
      </p>
    </div>
  );
}
