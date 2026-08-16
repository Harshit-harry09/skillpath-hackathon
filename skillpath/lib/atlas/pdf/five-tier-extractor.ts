/**
 * ATLAS 2.0 5-TIER PDF EXTRACTION PIPELINE
 * Tier 1: Gemini Multimodal Vision
 * Tier 2: Tesseract.js / OCR Text Scanner
 * Tier 3: Layout-Aware Reconstruction (2-column, sidebars, headers)
 * Tier 4: Confidence Scoring + HITL Trigger
 * Tier 5: Intelligent ASCII Stream Fallback
 */

import { callGeminiMultimodal } from '@/lib/gemini';
import PDFParser from 'pdf2json';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export interface ExtractionResult {
  text: string;
  confidenceScore: number; // 0 to 100
  tierUsed: 1 | 2 | 3 | 4 | 5;
  layoutDetected: 'standard' | 'multi_column' | 'scanned_image' | 'table_heavy';
  hitlRequired: boolean;
  hitlMessage?: string;
}

function safeDecode(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * TIER 1: Gemini Multimodal Vision PDF Extractor
 */
async function extractTier1_GeminiMultimodal(buffer: ArrayBuffer): Promise<{ text: string; confidence: number }> {
  const base64Data = Buffer.from(buffer).toString('base64');
  const prompt =
    'You are a high-precision document OCR and layout parsing agent. Extract ALL readable text from this PDF document verbatim. ' +
    'Preserve sections, headers, bullet points, companies, job titles, dates, education, and technical skills. ' +
    'Reconstruct multi-column layouts into clean logical reading order.';

  const text = await callGeminiMultimodal(
    prompt,
    'Extract all text cleanly and completely.',
    { mimeType: 'application/pdf', data: base64Data },
    { timeoutMs: 25000, agentGroup: 'ingestion' }
  );

  const cleanText = text.trim();
  const confidence = cleanText.length > 250 ? 95 : cleanText.length > 80 ? 75 : 45;
  return { text: cleanText, confidence };
}

/**
 * TIER 2: RapidOCR Engine (PaddleOCR / ONNX Deep Learning PDF OCR)
 */
async function extractTier2_RapidOCR(buffer: ArrayBuffer): Promise<{ text: string; confidence: number }> {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'rapidocr_processor.py');
      if (!fs.existsSync(scriptPath)) {
        return resolve({ text: '', confidence: 0 });
      }

      const base64Input = Buffer.from(buffer).toString('base64');
      const pyProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdoutData = '';

      pyProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        if (code === 0 && stdoutData) {
          try {
            const parsed = JSON.parse(stdoutData.trim());
            if (parsed.success && parsed.text) {
              console.log(`[PDF Tier 2] RapidOCR-ONNX successfully extracted ${parsed.text.length} chars (Confidence: ${parsed.confidence}%)`);
              return resolve({ text: parsed.text, confidence: parsed.confidence || 92 });
            }
          } catch {
            // json parse error
          }
        }
        console.log('[PDF Tier 2] RapidOCR finished or skipped, delegating downstream...');
        resolve({ text: '', confidence: 0 });
      });

      pyProcess.on('error', () => {
        resolve({ text: '', confidence: 0 });
      });

      pyProcess.stdin.write(base64Input);
      pyProcess.stdin.end();
    } catch {
      resolve({ text: '', confidence: 0 });
    }
  });
}

/**
 * TIER 3: Layout-Aware pdf2json Structured Extraction
 */
async function extractTier3_LayoutAware(buffer: ArrayBuffer): Promise<{ text: string; confidence: number; layout: ExtractionResult['layoutDetected'] }> {
  return new Promise((resolve, reject) => {
    const parser = new (PDFParser as any)(null, true);
    const timeout = setTimeout(() => reject(new Error('pdf2json parsing timed out')), 5000);

    parser.on('pdfParser_dataReady', (data: any) => {
      clearTimeout(timeout);
      try {
        let isMultiColumn = false;
        const pageTexts: string[] = [];

        for (const page of data.Pages ?? []) {
          const texts = page.Texts ?? [];
          // Detect x-coordinate clustering for multi-column resumes
          const xCoords = texts.map((t: any) => t.x);
          const minX = Math.min(...xCoords, 0);
          const maxX = Math.max(...xCoords, 1);
          if (xCoords.some((x: number) => x > (minX + maxX) / 2)) {
            isMultiColumn = true;
          }

          // Sort by Y coordinate first, then X coordinate to preserve reading flow
          const sortedTexts = [...texts].sort((a: any, b: any) => {
            if (Math.abs(a.y - b.y) > 0.4) return a.y - b.y;
            return a.x - b.x;
          });

          const pageStr = sortedTexts
            .map((t: any) => safeDecode((t.R ?? []).map((r: any) => r.T ?? '').join('')))
            .filter(Boolean)
            .join(' ');
          pageTexts.push(pageStr);
        }

        const fullText = pageTexts.join('\n').replace(/\s+/g, ' ').trim();
        const layout = isMultiColumn ? 'multi_column' : 'standard';
        const confidence = fullText.length > 200 ? 88 : 55;
        resolve({ text: fullText, confidence, layout });
      } catch (e) {
        reject(e);
      }
    });

    parser.on('pdfParser_dataError', (err: any) => {
      clearTimeout(timeout);
      reject(new Error(err?.parserError ?? 'pdf2json error'));
    });

    parser.parseBuffer(Buffer.from(buffer));
  });
}

/**
 * TIER 5: Intelligent ASCII & Ligature Fallback Stream Extractor
 */
function extractTier5_ASCIIStream(buffer: ArrayBuffer): { text: string; confidence: number } {
  try {
    const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const source = bytes.toString('latin1');

    const btEtMatches = source.split(/BT/);
    const tokens: string[] = [];

    for (let i = 1; i < Math.min(btEtMatches.length, 120); i++) {
      const block = btEtMatches[i].split(/ET/)[0];
      if (!block) continue;
      const parenMatches = block.match(/\(([^)]{1,300})\)/g);
      if (!parenMatches) continue;

      for (const rawMatch of parenMatches) {
        const inner = rawMatch
          .slice(1, -1)
          .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\n|\\r|\\t|\\/g, ' ')
          .replace(/[\x00-\x1F\x7F-\xFF]/g, '');
        if (/[a-zA-Z]{2,}/.test(inner)) {
          tokens.push(inner.trim());
        }
      }
    }

    let text = tokens.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length < 50) {
      const matches = source.match(/[a-zA-Z0-9.,@/\\-–—:;()\s]{5,}/g) || [];
      text = matches
        .map((s) => s.trim())
        .filter((s) => /[a-zA-Z]{3,}/.test(s) && !s.includes('Obj') && !s.includes('PDF'))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const confidence = text.length > 150 ? 60 : text.length > 30 ? 40 : 15;
    return { text, confidence };
  } catch {
    return { text: '', confidence: 0 };
  }
}

/**
 * Master 5-Tier Pipeline Executor
 * TIER 1 (PRIMARY): RapidOCR Engine (PaddleOCR + ONNX Runtime Deep Learning)
 * TIER 2: Gemini Multimodal Vision
 * TIER 3: Layout-Aware pdf2json
 * TIER 4: Confidence Scoring & HITL Trigger
 * TIER 5: Intelligent ASCII Stream Fallback
 */
export async function executeFiveTierPDFExtraction(buffer: ArrayBuffer): Promise<ExtractionResult> {
  // TIER 1 (PRIMARY): RapidOCR Engine (PaddleOCR + ONNX)
  try {
    const tocr = await extractTier2_RapidOCR(buffer);
    if (tocr.confidence >= 70) {
      console.log(`[5-Tier PDF] Primary RapidOCR successfully scanned document (${tocr.text.length} chars, score: ${tocr.confidence}%)`);
      return {
        text: tocr.text,
        confidenceScore: tocr.confidence,
        tierUsed: 1,
        layoutDetected: 'scanned_image',
        hitlRequired: false,
      };
    }
  } catch (err) {
    console.warn('[5-Tier PDF] Primary RapidOCR scan skipped or failed:', err);
  }

  // TIER 2: Gemini Multimodal Vision
  try {
    const t1 = await extractTier1_GeminiMultimodal(buffer);
    if (t1.confidence >= 70) {
      return {
        text: t1.text,
        confidenceScore: t1.confidence,
        tierUsed: 2,
        layoutDetected: 'standard',
        hitlRequired: false,
      };
    }
  } catch (err) {
    console.warn('[5-Tier PDF] Tier 2 Gemini Multimodal failed:', err);
  }

  // TIER 3: Layout-Aware pdf2json
  try {
    const t3 = await extractTier3_LayoutAware(buffer);
    if (t3.confidence >= 70) {
      return {
        text: t3.text,
        confidenceScore: t3.confidence,
        tierUsed: 3,
        layoutDetected: t3.layout,
        hitlRequired: false,
      };
    }
  } catch (err) {
    console.warn('[5-Tier PDF] Tier 3 Layout-Aware parse failed:', err);
  }

  // TIER 5: ASCII Stream Fallback
  const t5 = extractTier5_ASCIIStream(buffer);
  const isHitl = t5.confidence < 70;

  return {
    text: t5.text,
    confidenceScore: t5.confidence,
    tierUsed: 5,
    layoutDetected: 'standard',
    hitlRequired: isHitl,
    hitlMessage: t5.confidence < 40 ? 'Extraction confidence is below 40%. Please paste resume text directly.' : 'Low extraction confidence. Please verify parsed profile details.',
  };
}
