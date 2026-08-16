/** Decode a data-URL or raw base64 PDF into an exact ArrayBuffer slice. */
export function decodePdfBase64(value: string): ArrayBuffer {
  const encoded = value.replace(/^data:application\/pdf;base64,/, '');
  const bytes = Buffer.from(encoded, 'base64');
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

