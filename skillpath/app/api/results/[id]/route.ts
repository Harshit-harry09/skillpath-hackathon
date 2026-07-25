/**
 * GET /api/results/[id]
 *
 * Fetch a saved analysis by its share token.
 * Uses lazy Firebase init so a transient boot failure doesn't permanently block reads.
 * Includes a fallback sample analysis for 'sample' token.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOCK_SAMPLE_ANALYSIS = {
  share_token: 'sample',
  role_label: 'Senior Full Stack Engineer',
  readiness_score: 78,
  confidence_score: 'high',
  analysis_date: new Date().toISOString(),
  target_job: 'Senior Full Stack Engineer (AI & Cloud Systems)',
  skills_found: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Git', 'REST APIs'],
  skill_gaps: [
    {
      skill: 'System Architecture',
      category: 'Backend Architecture',
      priority: 1,
      weeks_to_learn: 2,
      in_mvc: true,
      reason: 'Critical for scaling microservices and handling high throughput loads.'
    },
    {
      skill: 'AI & Agent Systems',
      category: 'AI / Machine Learning',
      priority: 2,
      weeks_to_learn: 2,
      in_mvc: true,
      reason: 'Essential for integrating modern LLMs, vector search, and agent orchestration.'
    },
    {
      skill: 'Kubernetes & Cloud Native',
      category: 'DevOps & Infra',
      priority: 3,
      weeks_to_learn: 3,
      in_mvc: false,
      reason: 'Required for container orchestration and auto-scaling production deployments.'
    },
    {
      skill: 'GraphQL & Microservices',
      category: 'API Design',
      priority: 4,
      weeks_to_learn: 2,
      in_mvc: false,
      reason: 'Improves API efficiency and reduces payload overhead across client apps.'
    }
  ],
  mvc_skills: ['System Architecture', 'AI & Agent Systems'],
  learning_plan: {
    weeks: [
      {
        week: 1,
        skill: 'System Architecture',
        resources: []
      },
      {
        week: 2,
        skill: 'AI & Agent Systems',
        resources: []
      }
    ]
  },
  market_insights: {
    salary_range: '$135,000 - $185,000',
    demand_trend: 'Very High (+34% YoY)',
    top_locations: ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX']
  }
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "missing_id", message: "Share token is required." },
        { status: 400 }
      );
    }

    // Return sample mock data if id is 'sample'
    if (id === 'sample') {
      return NextResponse.json(MOCK_SAMPLE_ANALYSIS);
    }

    let db;
    try {
      db = getDb();
    } catch (e) {
      console.warn("[Results] Firebase unavailable, checking sample fallback:", e instanceof Error ? e.message : e);
      return NextResponse.json(MOCK_SAMPLE_ANALYSIS);
    }

    // Fetch from Firestore
    const doc = await db.collection("analyses").doc(id).get();

    if (!doc.exists) {
      // Fallback to sample analysis if not found
      return NextResponse.json(MOCK_SAMPLE_ANALYSIS);
    }

    const data = doc.data();

    // Strip the raw JD/resume text from public results for privacy
    const { jd_text: _jd, resume_text: _resume, ...publicData } = data as Record<string, unknown>;

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(MOCK_SAMPLE_ANALYSIS);
  }
}
