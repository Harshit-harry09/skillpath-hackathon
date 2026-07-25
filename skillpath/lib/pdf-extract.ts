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
    // Cast to any for the constructor
    const parser = new (PDFParser as any)(null, true);

    const timeout = setTimeout(() => {
      reject(new Error('PDF parsing timed out'));
    }, 15000);

    parser.on('pdfParser_dataReady', (data: any) => {
      clearTimeout(timeout);
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

// Strategy 2 — raw text extraction by scanning for readable ASCII strings
// Works on PDFs that pdf2json can't structure-parse
function extractRawText(buffer: ArrayBuffer): string {
  const bytes  = Buffer.from(buffer);
  const source = bytes.toString('latin1');

  // Extract text between BT (begin text) and ET (end text) PDF operators
  const btEtMatches = [...source.matchAll(/BT([\s\S]*?)ET/g)]
    .map(m => m[1]);

  const texts: string[] = [];

  for (const block of btEtMatches) {
    // Match strings inside parentheses — PDF text encoding
    const parenMatches = [...block.matchAll(/\(([^)]{1,300})\)/g)]
      .map(m => m[1]
        .replace(/\\(\d{3})/g, (_, oct) =>
          String.fromCharCode(parseInt(oct, 8))
        )
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\/g, '')
      )
      .filter(s => /[a-zA-Z]{2,}/.test(s)); // must have real words

    texts.push(...parenMatches);
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
