// updated
import { getDb } from './firebase-admin';
import { callGeminiJSON } from './gemini';
import { generateResourcesPrompt } from '../prompts/generate-resources';
import type { Resource, SkillResources } from '../types/analysis';
import { LRUCache } from 'lru-cache';

const globalCache = new LRUCache<string, { data: SkillResources; expiresAt: number }>({
  max: 500,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// ─── URL Sanitizer ────────────────────────────────────────────────────────────
// The model occasionally still outputs watch?v= links despite instructions.
// This is the last line of defence — it converts ANY direct video link
// into a guaranteed-working search query URL.
function sanitizeToSearchUrl(url: string, title: string): string {
  if (!url) return buildFallbackSearchUrl(title);

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    // Already a search URL — keep it
    if (hostname === 'youtube.com' && parsed.pathname === '/results') {
      return url;
    }

    // Direct video link — extract info and turn into a search
    if (
      (hostname === 'youtube.com' && parsed.pathname.startsWith('/watch')) ||
      hostname === 'youtu.be'
    ) {
      // Try to reuse the title the model gave us for a targeted search
      return buildFallbackSearchUrl(title);
    }

    // Non-YouTube URL — replace entirely
    if (!hostname.includes('youtube.com')) {
      return buildFallbackSearchUrl(title);
    }

    return url;
  } catch {
    return buildFallbackSearchUrl(title);
  }
}

function buildFallbackSearchUrl(title: string): string {
  const query = (title || 'programming tutorial')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '+');
  return `https://www.youtube.com/results?search_query=${query}`;
}

function isValidYouTubeSearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    return hostname === 'youtube.com' && parsed.pathname === '/results' && !!parsed.searchParams.get('search_query');
  } catch {
    return false;
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
function getCacheKey(skill: string, role: string, seniority: string, companyType: string) {
  return `resources:${skill}:${role}:${seniority}:${companyType}`;
}

async function getCachedResources(key: string): Promise<SkillResources | null> {
  const cached = globalCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const db = getDb();
    const doc = await db.collection('resources_cache').doc(key).get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data.expiresAt > Date.now()) {
        globalCache.set(key, { data: data.data, expiresAt: data.expiresAt });
        return data.data as SkillResources;
      }
    }
  } catch (e) {
    console.warn('Error reading from Firestore cache:', e);
  }

  return null;
}

async function setCachedResources(key: string, data: SkillResources) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  globalCache.set(key, { data, expiresAt });

  try {
    const db = getDb();
    await db.collection('resources_cache').doc(key).set({
      data,
      expiresAt,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Error writing to Firestore cache:', e);
  }
}

// ─── Fallback resources ───────────────────────────────────────────────────────
function buildFallbackResources(skill: string): SkillResources {
  const encodedFull = encodeURIComponent(`${skill} full course tutorial 2024`);
  const encodedFireship = encodeURIComponent(`${skill} fireship`);
  const encodedTraversy = encodeURIComponent(`${skill} traversy media`);

  return {
    focus_summary: `Master ${skill} fundamentals through structured video learning. Focus on hands-on projects to reinforce concepts quickly.`,
    estimated_weeks: 4,
    resources: [
      {
        title: `${skill} Full Course Tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodedFull}`,
        project: `Build a complete starter project using ${skill}`,
        why: `A full course gives you end-to-end coverage, which is exactly what interviewers probe for.`,
        source: 'curated_fallback',
      },
      {
        title: `${skill} in 100 Seconds – Fireship`,
        url: `https://www.youtube.com/results?search_query=${encodedFireship}`,
        project: `Recreate the demo shown in the video from memory`,
        why: `Fireship-style breakdowns train you to explain concepts concisely — a key interview skill.`,
        source: 'curated_fallback',
      },
      {
        title: `${skill} Crash Course – Traversy Media`,
        url: `https://www.youtube.com/results?search_query=${encodedTraversy}`,
        project: `Build the crash course project, then extend it with one extra feature`,
        why: `Traversy projects are interview-portfolio ready and widely recognised by hiring managers.`,
        source: 'curated_fallback',
      },
    ],
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateResources(
  analysisId: string,
  skill: string,
  role: string,
  seniority: string,
  companyType: string,
  existingUrls: string[] = [],
  clickCount: number = 0
): Promise<{ skill_resources: SkillResources; from_cache: boolean }> {
  const cacheKey = getCacheKey(skill, role, seniority, companyType);

  if (existingUrls.length === 0 && clickCount === 0) {
    const cached = await getCachedResources(cacheKey);
    if (cached) return { skill_resources: cached, from_cache: true };
  }

  // ── Fetch optional DB entries ──────────────────────────────────────────────
  let resourceDbEntries = 'No static entries found.';
  try {
    const db = getDb();
    const snapshot = await db
      .collection('resources')
      .where('skill', '==', skill)
      .limit(10)
      .get();
    if (!snapshot.empty) {
      resourceDbEntries = JSON.stringify(
        snapshot.docs.map((doc) => doc.data()),
        null,
        2
      );
    }
  } catch (e) {
    console.warn('Error reading resource DB:', e);
  }

  const prompt = generateResourcesPrompt(
    skill,
    role,
    seniority,
    companyType,
    resourceDbEntries,
    existingUrls,
    clickCount
  );

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Generator] GEMINI_API_KEY is missing, using curated fallbacks.');
      return { skill_resources: buildFallbackResources(skill), from_cache: false };
    }

    let parsed: SkillResources;
    try {
      parsed = await callGeminiJSON<SkillResources>(
        "",
        prompt,
        { model: 'gemini-3.5-flash-lite', temperature: 0.1, maxTokens: 1000 }
      );

      if (!parsed.resources || !Array.isArray(parsed.resources) || parsed.resources.length === 0) {
        throw new Error('Missing or empty resources array');
      }
    } catch (err) {
      console.warn('[Generator] Gemini JSON generation/parse failed, using fallback resources:', err);
      parsed = buildFallbackResources(skill);
    }

    // ── Sanitize every URL — this is the critical safety net ──────────────
    parsed.resources = parsed.resources
      .slice(0, 5)
      .map((r) => ({
        ...r,
        url: sanitizeToSearchUrl(r.url, r.title),
        source: resourceDbEntries !== 'No static entries found.' ? r.source : 'ai_generated',
      }))
      // Final gate: only resources with a valid YouTube search URL pass through
      .filter((r) => isValidYouTubeSearchUrl(r.url));

    // If sanitization wiped everything, fall back gracefully
    if (parsed.resources.length === 0) {
      console.warn('[Generator] All resources failed URL validation, using fallback');
      parsed = buildFallbackResources(skill);
    }

    // ── Persist ────────────────────────────────────────────────────────────
    await setCachedResources(cacheKey, parsed);

    if (analysisId) {
      try {
        const db = getDb();
        await db
          .collection('analyses')
          .doc(analysisId)
          .set({ generated_resources: { [skill]: parsed } }, { merge: true });
      } catch (e) {
        console.warn('Error updating analysis document:', e);
      }
    }

    return { skill_resources: parsed, from_cache: false };
  } catch (error) {
    console.error('[Generator] Gemini error:', error);
    // Return a usable fallback instead of throwing, so the UI never breaks
    return { skill_resources: buildFallbackResources(skill), from_cache: false };
  }
}