// updated
// types/pdf2json.d.ts
declare module 'pdf2json' {
  export default class PDFParser {
    constructor(context: null, needRawText: boolean);
    on(event: 'pdfParser_dataReady', cb: (data: any) => void): void;
    on(event: 'pdfParser_dataError', cb: (err: any) => void): void;
    parseBuffer(buffer: Buffer): void;
  }
}
