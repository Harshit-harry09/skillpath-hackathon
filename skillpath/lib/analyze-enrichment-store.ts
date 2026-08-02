import crypto from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { Firestore } from 'firebase-admin/firestore';

const COLLECTION = 'analysis_enrichment_jobs';
const TTL_MS = 30 * 60 * 1000;
const MAX_COMPRESSED_BYTES = 750_000;

interface EnrichmentPayload {
  resumeText: string;
  jdText: string;
}

function getEncryptionKey(): Buffer | null {
  const raw = process.env.ANALYZE_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return crypto.createHash('sha256').update(raw).digest();
}

export function isEnrichmentConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim() && getEncryptionKey());
}

function encrypt(payload: EnrichmentPayload) {
  const key = getEncryptionKey();
  if (!key) throw new Error('ANALYZE_ENCRYPTION_KEY is not configured.');
  const compressed = gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'), { level: 6 });
  if (compressed.byteLength > MAX_COMPRESSED_BYTES) {
    throw new Error('Encrypted enrichment payload exceeds the temporary storage limit.');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt(record: Record<string, unknown>): EnrichmentPayload {
  const key = getEncryptionKey();
  if (!key) throw new Error('ANALYZE_ENCRYPTION_KEY is not configured.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(String(record.iv), 'base64')
  );
  decipher.setAuthTag(Buffer.from(String(record.auth_tag), 'base64'));
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(String(record.ciphertext), 'base64')),
    decipher.final(),
  ]);
  const parsed = JSON.parse(gunzipSync(compressed).toString('utf8')) as Partial<EnrichmentPayload>;
  if (typeof parsed.resumeText !== 'string' || typeof parsed.jdText !== 'string') {
    throw new Error('Invalid enrichment payload.');
  }
  return { resumeText: parsed.resumeText, jdText: parsed.jdText };
}

export async function storeEnrichmentPayload(
  db: Firestore,
  analysisId: string,
  payload: EnrichmentPayload
): Promise<boolean> {
  if (!isEnrichmentConfigured()) return false;
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const encrypted = encrypt(payload);
  await db.collection(COLLECTION).doc(analysisId).set({
    ...encrypted,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });
  return true;
}

export async function readEnrichmentPayload(db: Firestore, analysisId: string): Promise<EnrichmentPayload | null> {
  const ref = db.collection(COLLECTION).doc(analysisId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const record = snapshot.data() as Record<string, unknown>;
  const expiresAt = Date.parse(String(record.expires_at || ''));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await ref.delete().catch(() => undefined);
    return null;
  }
  return decrypt(record);
}

export async function deleteEnrichmentPayload(db: Firestore, analysisId: string): Promise<void> {
  await db.collection(COLLECTION).doc(analysisId).delete().catch(() => undefined);
}
