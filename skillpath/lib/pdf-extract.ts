// lib/pdf-extract.ts
import { executeFiveTierPDFExtraction, ExtractionResult } from '@/lib/atlas/pdf/five-tier-extractor';

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const result: ExtractionResult = await executeFiveTierPDFExtraction(buffer);
  if (!result.text || result.text.length < 20) {
    throw new Error(
      'Could not extract text from this PDF. Please paste your resume text directly into the profile box.'
    );
  }
  return result.text;
}

export async function extractPDFWithConfidence(buffer: ArrayBuffer): Promise<ExtractionResult> {
  return executeFiveTierPDFExtraction(buffer);
}

export function isScannedPdf(buffer: ArrayBuffer): boolean {
  try {
    const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const source = bytes.toString('latin1');
    return source.length < 100 || !source.includes('Font');
  } catch {
    return true;
  }
}
