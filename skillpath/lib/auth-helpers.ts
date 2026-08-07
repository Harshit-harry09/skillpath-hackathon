// updated
/**
 * Server-side auth helpers for API routes.
 * Uses typed errors so callers can return proper HTTP status codes.
 */

import { NextRequest } from "next/server";
import { getAdminAuth } from "./firebase-admin";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_TOKEN' | 'INVALID_TOKEN' | 'FIREBASE_UNAVAILABLE'
  ) {
    super(message);
    this.name = 'AuthError';
  }

  /** Suggested HTTP status code for this error */
  get statusCode(): number {
    switch (this.code) {
      case 'NO_TOKEN': return 401;
      case 'INVALID_TOKEN': return 401;
      case 'FIREBASE_UNAVAILABLE': return 503;
    }
  }
}

/**
 * Verify the Firebase ID token from the Authorization header.
 * 
 * @returns User info on success
 * @throws AuthError with typed code on failure
 */
export async function getAuthUser(req: NextRequest): Promise<{
  uid: string;
  email: string | undefined;
  name: string;
}> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("No authorization token provided", "NO_TOKEN");
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token.length < 10) {
    throw new AuthError("Invalid authorization token format", "NO_TOKEN");
  }

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (e) {
    console.error("[Auth] Firebase Admin initialization error:", e);
    throw new AuthError(
      "Authentication service temporarily unavailable. Please check Firebase environment variables.",
      "FIREBASE_UNAVAILABLE"
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User')
    };
  } catch (error: any) {
    const message = error?.code === 'auth/id-token-expired'
      ? "Your session has expired. Please sign in again."
      : "Invalid authentication token. Please sign in again.";
    throw new AuthError(message, "INVALID_TOKEN");
  }
}

/**
 * Safe wrapper that returns null instead of throwing.
 * Use this ONLY in routes where auth is optional.
 */
export async function getAuthUserSafe(req: NextRequest) {
  try {
    return await getAuthUser(req);
  } catch {
    return null;
  }
}
