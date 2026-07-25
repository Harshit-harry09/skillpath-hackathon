/**
 * Firebase Admin SDK — Bulletproof Lazy Singleton
 *
 * Strategy: Base64-encoded service account (FIREBASE_SERVICE_ACCOUNT_BASE64)
 * with fallback to individual env vars.
 *
 * Key design decisions:
 * - Getter functions, NOT top-level constants (retries init on every call)
 * - Zero PEM manipulation — trust the JSON as-is
 * - Single clear error message on failure
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _app: App | null = null;
let _initError: string | null = null;

function initAdmin(): App | null {
  // If already initialized by us or another module, reuse it
  if (_app) return _app;
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return _app;
  }

  // Strategy 1: Base64-encoded full service account JSON
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf-8');
      const sa = JSON.parse(json);
      if (sa.private_key) {
        // Normalize escaped newlines (common in env vars)
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
        console.log('[Firebase Admin] Strategy: Base64 Service Account');
      }
      _app = initializeApp({ credential: cert(sa) });
      _initError = null;
      console.log('[Firebase Admin] ✓ Initialized via Base64 service account');
      return _app;
    } catch (e: any) {
      console.error('[Firebase Admin] Base64 strategy failed:', e.message);
      _initError = `Base64: ${e.message}`;
      if (e.message.includes('ASN.1') || e.message.includes('PEM')) {
        _initError += ' (The private key in .env.local is likely corrupted or truncated. Please provide a fresh one.)';
      }
    }
  }

  // Strategy 2: Individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      let formattedKey = privateKey.replace(/\\n/g, '\n');
      
      // Remove surrounding quotes if they exist (common Vercel issue)
      if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        formattedKey = formattedKey.slice(1, -1);
      }
      
      // Handle escaped quotes inside the string
      formattedKey = formattedKey.replace(/\\"/g, '"');

      _app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: formattedKey }),
      });
      _initError = null;
      console.log('[Firebase Admin] ✓ Initialized via individual env vars');
      return _app;
    } catch (e: any) {
      console.error('[Firebase Admin] Individual vars strategy failed:', e.message);
      _initError = `Individual: ${e.message}`;
    }
  }

  if (!b64 && !projectId) {
    _initError = 'No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.';
    console.error(`[Firebase Admin] ✗ ${_initError}`);
  }

  return null;
}

let _db: Firestore | null = null;

/**
 * Get the Firestore database instance.
 * Retries initialization on every call if previous attempt failed.
 */
export function getDb(): Firestore {
  if (_db) return _db;

  const app = initAdmin();
  if (!app) {
    throw new Error(`Firebase Admin not initialized: ${_initError || 'Unknown error'}`);
  }
  _db = getFirestore(app);
  try {
    _db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Already configured on existing app instance
  }
  return _db;
}

/**
 * Get the Firebase Auth instance.
 * Retries initialization on every call if previous attempt failed.
 */
export function getAdminAuth(): Auth {
  const app = initAdmin();
  if (!app) {
    throw new Error(`Firebase Admin not initialized: ${_initError || 'Unknown error'}`);
  }
  return getAuth(app);
}

/**
 * Check if Firebase Admin is ready without throwing.
 */
export function isFirebaseReady(): boolean {
  if (_app) return true;
  try {
    const app = initAdmin();
    return app !== null;
  } catch {
    return false;
  }
}

