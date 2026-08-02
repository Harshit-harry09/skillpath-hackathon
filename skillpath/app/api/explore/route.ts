/**
 * POST /api/explore
 *
 * Fast deterministic-first role exploration. The local role skeleton is
 * persisted before returning; optional Gemini enrichment runs afterward.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { detectRoleCategory, getRoleLabel, getRoleStandardSkills } from '@/lib/mvc-profiler';
import { detectCompanyType } from '@/lib/company-detector';
import crypto from 'crypto';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';

function buildLocalPayload(jobTitle: string) {
  const category = detectRoleCategory(jobTitle);
  const role = getRoleLabel(category);
  const skills = getRoleStandardSkills(jobTitle);
  const companyType = detectCompanyType(jobTitle);
  const mvcSkills = skills.slice(0, 5);

  return {
    role,
    seniority: 'mid',
    company_type: companyType,
    mvc_skills: mvcSkills,
    skill_map: {
      role,
      seniority: 'mid',
      company_type: companyType,
      mvc_skills: mvcSkills,
      categories: {
        technical_core: skills.slice(0, 5).map(name => ({ name, importance: 'essential', weeks_to_learn: 3, frequency_pct: 85, note: 'Core skill requirement' })),
        technical_tools: skills.slice(5, 10).map(name => ({ name, importance: 'high', weeks_to_learn: 2, frequency_pct: 70, note: 'Key operational tool' })),
        analytical: skills.slice(10, 14).map(name => ({ name, importance: 'medium', weeks_to_learn: 2, frequency_pct: 55, note: 'Analytical and decision competency' })),
        soft_skills: ['Communication', 'Problem Solving', 'Adaptability'].map(name => ({ name, importance: 'medium', weeks_to_learn: 1, frequency_pct: 60, note: 'Essential soft skill' })),
      },
      total_weeks_from_zero: 16,
      fastest_growing_skill: skills[0] || 'Domain Competency',
      most_demanded_skill: skills[1] || 'Core Skill',
    },
    learning_path: { weeks: [] },
  };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const traceId = requestId(req);

  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return withRequestId(NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 }), traceId);
    }

    const jobTitle = typeof body === 'object' && body !== null && 'job_title' in body
      ? String((body as { job_title?: unknown }).job_title || '').trim().slice(0, 200)
      : '';
    if (!jobTitle) {
      return withRequestId(NextResponse.json({ error: 'missing_field', message: 'Job title is required.' }, { status: 400 }), traceId);
    }

    const payload = buildLocalPayload(jobTitle);
    const shareToken = crypto.randomUUID();
    const now = new Date().toISOString();
    const explorationDoc = {
      share_token: shareToken,
      job_title_raw: jobTitle,
      role: payload.role,
      seniority: payload.seniority,
      company_type: payload.company_type,
      market_momentum: { growth_pct: '+24% YoY', trend_status: 'Estimated', demand_insight: `Local role model estimate for ${payload.role} roles.` },
      salary_range: { entry: '$65,000', mid: '$95,000', senior: '$140,000', currency: 'USD' },
      top_employers: [
        { name: 'Top Industry Leaders', category: 'Market Standard', hiring_volume: 'Estimated' },
        { name: 'Growth Scaleups', category: 'Growth Sector', hiring_volume: 'Estimated' },
        { name: 'Global Enterprises', category: 'Enterprise', hiring_volume: 'Estimated' },
      ],
      mvc_skills: payload.mvc_skills,
      skill_map: payload.skill_map,
      learning_path: payload.learning_path,
      total_weeks: payload.skill_map.total_weeks_from_zero,
      created_at: now,
      source: 'local_deterministic',
      fallback: true,
      enrichment_status: 'pending',
      provenance: {
        model: null,
        generated_at: now,
        note: 'Deterministic local role model; salary and demand values are estimates until optional enrichment completes.',
      },
    };

    try {
      const db = getDb();
      await db.collection('explorations').doc(shareToken).set(explorationDoc);
    } catch (error) {
      console.error(`[Explore] Persistence failed [${traceId}]:`, error instanceof Error ? error.message : error);
      return withRequestId(NextResponse.json({ error: 'persistence_failed', message: 'Exploration could not be saved. Please try again.' }, { status: 503 }), traceId);
    }

    const response = NextResponse.json(explorationDoc);
    response.headers.set('X-Pipeline-Latency-Ms', String(Date.now() - startedAt));
    return withRequestId(response, traceId);
  } catch (error) {
    console.error(`[Explore] Pipeline failed [${traceId}]:`, error);
    return withRequestId(NextResponse.json({ error: 'exploration_failed', message: 'An unexpected error occurred during exploration.' }, { status: 500 }), traceId);
  }
}
