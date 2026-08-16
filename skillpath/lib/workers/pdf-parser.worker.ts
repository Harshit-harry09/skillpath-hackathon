import * as Comlink from 'comlink';

export interface PdfParseResult {
  text: string;
  warnings: string[];
}

export const pdfParserWorker = {
  async parsePdf(buffer: ArrayBuffer): Promise<PdfParseResult> {
    try {
      // This lightweight pass runs in the browser worker. The server still
      // performs the authoritative five-tier extraction before Atlas runs.
      const source = new TextDecoder('latin1').decode(buffer);
      const text = Array.from(source.matchAll(/\(([^()]*)\)\s*T[Jj]/g))
        .map((match) => match[1].replace(/\\([\\()])/g, '$1'))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { text, warnings: text ? [] : ['Browser preview found no plain text. Server extraction will handle the PDF.'] };
    } catch {
      return { text: '', warnings: ['Browser PDF preview failed. Server extraction will handle the PDF.'] };
    }
  },
};

Comlink.expose(pdfParserWorker);
