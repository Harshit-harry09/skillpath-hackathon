// lib/pdf-extract.ts
import PDFParser from 'pdf2json';

function safeDecode(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

// Strategy 1 — pdf2json structured parse
async function extractWithPdf2json(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new (PDFParser as any)(null, true);

    const timeout = setTimeout(() => {
      reject(new Error('PDF parsing timed out'));
    }, 5000); // 5s timeout for fast response

    parser.on('pdfParser_dataReady', (data: any) => {
      clearTimeout(timeout);
      // Yield to event loop before text aggregation
      setImmediate(() => {
        try {
          const text = (data.Pages ?? [])
            .flatMap((page: any) => page.Texts ?? [])
            .map((t: any) =>
              safeDecode(
                (t.R ?? []).map((r: any) => r.T ?? '').join('')
              )
            )
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!text) reject(new Error('empty'));
          else resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    parser.on('pdfParser_dataError', (err: any) => {
      clearTimeout(timeout);
      reject(new Error(err?.parserError ?? 'parse error'));
    });

    try {
      parser.parseBuffer(Buffer.from(buffer));
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
}

// Strategy 2 — fast non-blocking raw text extraction by scanning ASCII strings
function extractRawText(buffer: ArrayBuffer): string {
  const bytes = Buffer.from(buffer);
  const source = bytes.toString('latin1');

  // Extract text between BT (begin text) and ET (end text) PDF operators
  const btEtMatches = source.split(/BT/);
  const texts: string[] = [];

  for (let i = 1; i < Math.min(btEtMatches.length, 50); i++) {
    const block = btEtMatches[i].split(/ET/)[0];
    if (!block) continue;

    const parenMatches = block.match(/\(([^)]{1,300})\)/g);
    if (!parenMatches) continue;

    for (const rawMatch of parenMatches) {
      const inner = rawMatch.slice(1, -1)
        .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\n|\\r|\\/g, ' ');
      if (/[a-zA-Z]{2,}/.test(inner)) {
        texts.push(inner);
      }
    }
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

// Main export — tries pdf2json first, falls back to raw extraction
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // Try structured parse first
  try {
    const text = await extractWithPdf2json(buffer);
    if (text.length > 50) {
      console.log(`[PDF Extract] pdf2json success: ${text.length} chars`);
      return text.slice(0, 8000);
    }
  } catch (e) {
    console.warn('[PDF Extract] pdf2json failed, trying raw extraction:', e);
  }

  // Fall back to raw text scanning
  try {
    const text = extractRawText(buffer);
    if (text.length > 50) {
      console.log(`[PDF Extract] raw extraction success: ${text.length} chars`);
      return text.slice(0, 8000);
    }
  } catch (e) {
    console.warn('[PDF Extract] raw extraction failed:', e);
  }

  throw new Error(
    'Could not extract text from this PDF. ' +
    'It may be scanned or image-based. ' +
    'Please paste your resume text directly.'
  );
}
