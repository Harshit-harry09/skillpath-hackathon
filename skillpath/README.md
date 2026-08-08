<div align="center">

# ⚡ SkillPath
### *AI-Powered Career Intelligence & Skill Gap Analysis Platform*

**Bridge the Gap Between Your Resume and Your Dream Job**

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Google_Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> **Nehru Hackathon 2026** — Closing the gap between talent and opportunity with deterministic AI-hybrid career intelligence.

</div>

---

## Table of Contents

1. [The Problem](#-the-problem)
2. [The Solution](#-the-solution)
3. [Live Demo Flow](#-live-demo-flow)
4. [Dual-Engine Architecture](#-dual-engine-architecture)
5. [Complete Feature Set](#-complete-feature-set)
6. [Technology Stack](#-technology-stack)
7. [Code Quality](#-code-quality)
8. [Latency Optimization](#-latency-optimization)
9. [Production Readiness](#-production-readiness)
10. [Database Schema](#-database-schema)
11. [API Reference](#-api-reference)
12. [Getting Started](#-getting-started)
13. [Environment Variables](#-environment-variables)
14. [Project Structure](#-project-structure)
15. [Evaluation Summary](#-evaluation-summary)

---

## The Problem

Every day, thousands of engineers submit resumes and receive the same cold rejection:

> *"We have decided to move forward with other candidates."*

No feedback. No roadmap. No second chance.

| Problem | Impact |
|---|---|
| **ATS Black Hole** | 75%+ of resumes are filtered before a human reads them |
| **JD Noise Overload** | JDs list 20-30 requirements; candidates cannot identify the 4-5 real deal-breakers |
| **Zero Career Feedback** | Job seekers have no way to measure how close they actually are |
| **Generic AI Advice** | ChatGPT gives vague, uncalibrated suggestions without market data |
| **Privacy Concerns** | Candidates are afraid to upload sensitive resumes to third-party services |

---

## The Solution

**SkillPath** is a full-stack, production-grade AI Career Intelligence Platform that:

- Parses your resume (PDF or text) + job description in **< 200ms** with zero AI dependency
- Cross-references against a **5,000+ JD trained MVC dataset** across **60+ role categories**
- Isolates the **4-5 real deal-breaker skills** from the noise
- Calculates an exact **Weeks-to-Job-Ready** countdown
- Generates a **personalized weekly learning roadmap** with curated resources
- Lets you **self-assess confidence** and instantly recalibrates your score in real-time
- Stores your resume encrypted with **AES-256-GCM** and auto-wipes after 30 minutes

---

## Live Demo Flow

```
Upload Resume (PDF or Text)  +  Paste Job Description
           |
           v  (< 200ms deterministic result)
    Gap Score: 67/100
    Ready by: Sep 17, 2026  (6 weeks)
    3 Priority Gaps: TypeScript, Kubernetes, System Design
    Salary Jump: $85k to $115k  (35% ROI)
           |
           v  (async AI enrichment in background)
    Evidence verified: "Deployed K8s clusters on AWS EC2" matches Kubernetes req
    Week-by-Week Learning Plan generated
    STAR bullets, LinkedIn headline, and cover letter ready
```

---

## Dual-Engine Architecture

SkillPath implements a **Hybrid Dual-Brain Pipeline** that guarantees results regardless of AI availability:

```
+--------------------------------------------------------------+
|                        USER INPUT                            |
|          Upload PDF Resume  +  Paste Target JD               |
+----------------------------+---------------------------------+
                             |
                             v
+--------------------------------------------------------------+
|         STEP 1: LOCAL DETERMINISTIC ENGINE (< 200ms)         |
|                                                              |
|  pdf2json          -> Binary buffer PDF text extraction      |
|  mvc-profiler.ts   -> 5,000+ JD MVC frequency model         |
|  ai-skill-cleaner  -> Levenshtein fuzzy normalization        |
|  gap-scorer.ts     -> Weighted skill gap scoring             |
|  readiness.ts      -> Weeks-to-ready countdown               |
|  ats-pipeline      -> 5-Pillar enterprise ATS scoring        |
|  Persist Firestore -> Return result token immediately        |
+----------------------------+---------------------------------+
                             |  (result shown immediately)
                             v
+--------------------------------------------------------------+
|       STEP 2: ASYNC AI ENRICHMENT (background only)          |
|                                                              |
|  AES-256-GCM encrypted payload -> 30min TTL in Firestore    |
|  Firestore transaction lock    -> prevents duplicate runs    |
|  Gemini 2.5 Flash              -> evidence quote extraction  |
|  semantic-skill-matcher.ts     -> cosine similarity match    |
|  ai-analysis-schema.ts         -> schema validate & sanitize |
|  Merge enriched data           -> mark complete or fallback  |
+--------------------------------------------------------------+
```

**Critical principle:** The user always gets a result from Step 1. Step 2 upgrades it silently. AI failure never removes data.

---

## Complete Feature Set

### Core Analysis Engine

| Feature | Engine | Description |
|---|---|---|
| Resume Gap Analysis | Local + AI | Deterministic MVC model + Gemini evidence quotes |
| Match Score 0-100 | Local | Coverage of JD requirements from resume |
| Readiness Score | Local + User | Confidence-adjusted job readiness percentage |
| Priority Gaps | Local | Top skill gaps ordered by MVC frequency weight |
| Weeks-to-Ready | Local | Aggregated complexity index across all gaps |
| ATS Composite Score | Local | 5-pillar: Skills 30% + YOE 30% + Title 15% + Education 15% + Format/Fraud 10% |
| Skill Freshness Audit | Local | Detects obsolete tech: jQuery to React, SVN to Git, Hadoop to Spark |
| Evidence Matching | AI | Exact resume quote mapped to each JD requirement |

### Career Content Tools

| Feature | Engine | Description |
|---|---|---|
| Learning Roadmap | AI + Local | Week-by-week personalized plan with YouTube and docs links |
| STAR Bullet Generator | Gemini | Custom STAR-format resume bullets targeting missing skills |
| LinkedIn Headline Optimizer | Gemini | Role-targeted professional headlines |
| Cover Letter Generator | Gemini | Tailored cover-letter paragraphs for the target JD |
| Interview Question Generator | Gemini | Role-specific interview prep with expected answers |
| De-Slopifier Buzzword Eraser | AI | Removes corporate jargon, replaces with concrete language |
| Multi-Format Exporter | Local | Export analysis as PDF, Markdown, or TXT |

### Recruiter and Market Tools

| Feature | Engine | Description |
|---|---|---|
| Skill Battle | Local + AI | Compares two skills/careers with market frequency data |
| Competitive Benchmark | Local | Peer-comparison score using heuristic market data |
| Salary ROI Estimator | Local | Quantifies the expected salary jump post-upskilling |
| Role Switch Panel | Local | Adjacent role transition graph powered by dijkstra.ts |
| Recruiter Red Flag Radar | Local | Detects ATS red flags: formatting, gaps, fraud signals |
| Time Machine | Local | Simulates your resume at different experience levels |
| Seniority Calibrator | Local | Maps your profile against entry/mid/senior benchmarks |

### Profile and Progress Tracking

| Feature | Engine | Description |
|---|---|---|
| User Profile Dashboard | Firebase | Complete career progress hub |
| Active Job Tracker | Firebase | Pin a job, track skill progress per requirement |
| Daily Streak System | Firebase | Gamified daily learning consistency streaks |
| Skill Timeline | Firebase | Visual history of skills learned over time |
| Job History | localStorage | All past analyses with tokens; no raw PII stored |
| Public Share Cards | Firebase | Shareable career score cards with expiry |

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 App Router | SSR, API routes, React 19 concurrent features, Turbopack |
| Language | TypeScript 5 strict | End-to-end type safety, zero runtime surprises |
| Styling | Tailwind CSS v3 + CSS Variables | Custom glassmorphism dark design system |
| 3D / WebGL | Three.js + React Three Fiber + OGL | ASCII Fire hero canvas AsciiFire.tsx |
| Animations | Framer Motion + Lenis | Hardware-accelerated fluid scroll and micro-interactions |
| AI | Google Gemini 2.5 Flash | Evidence extraction, content generation, embeddings |
| Schema Validation | Custom ai-analysis-schema.ts | Runtime-bounds every AI field; no raw LLM output passes through |
| PDF Parsing | pdf2json server-side | Binary buffer parsing without external API cost |
| Database | Firebase Firestore Admin SDK | Serverless NoSQL; all sensitive collections locked to Admin SDK only |
| Auth | Firebase Auth | Token-based bearer auth verified server-side |
| Rate Limiting | LRU Cache sliding window | Per-IP request throttling on all AI routes |
| Deployment | Vercel Node.js Runtime | maxDuration 30s on analyze route, edge middleware |

---

## Code Quality

> **Evaluation criteria:** Architecture cleanliness, type safety, test coverage, separation of concerns, error handling, and security posture.

### 1. End-to-End TypeScript Strict Mode

Every file uses TypeScript 5 with `strict: true`. Core contracts are defined in `types/analysis.ts` covering `AnalysisResult`, `SkillGap`, `AnalysisEvidence`, `AnalysisRequirement`, `CompositeATSScore`, and more — making the entire pipeline statically typed from API boundary to UI render.

```typescript
// types/analysis.ts — core domain contract used across 40+ files
export interface SkillGap {
  skill: string;
  priority: number;
  weeks_to_learn: number;
  in_mvc: boolean;
  importance?: 'must_have' | 'should_have' | 'nice_to_have';
  match_status?: EvidenceMatchStatus;
  evidence_details?: SkillEvidenceDetail[];
}
```

### 2. Separation of Concerns — Layered Architecture

```
lib/          Pure business logic, zero HTTP dependencies
app/api/      Thin orchestration: validate -> call lib -> persist -> respond
components/   Pure UI, zero direct Firestore or Gemini calls
context/      Global client state: Auth, Draft, UI
types/        Shared interfaces — single source of truth
```

### 3. AI Output Schema Validation

All Gemini JSON responses are **runtime-validated and sanitized** via `lib/ai-analysis-schema.ts`. No raw LLM output reaches the database or UI.

```typescript
// Every field is clamped, typed, and length-bounded before use
function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0.5;
  return Math.max(0, Math.min(1, n));
}
```

### 4. Test Suite — Full ATS Pipeline Coverage

Node.js native test runner (`npm test`) covers the entire ATS pipeline:

```
PASS  extractContactInfo    — name, email, phone, LinkedIn, GitHub extraction
PASS  parseWorkExperience   — YOE calculation, seniority level detection
PASS  extractEducation      — degree, institution, certification parsing
PASS  auditFraudFormatting  — red flags, formatting violations, fraud signals
PASS  analyzeJobDescription — JD requirement parsing and importance weighting
PASS  calculateCompositeATS — 5-pillar weighted scoring validation
```

```bash
npm test                    # All 6 ATS modules pass
npx tsc --noEmit            # Zero TypeScript errors
npm run lint -- --quiet     # Zero ESLint errors
npm run build               # Clean production build (~35s)
```

### 5. Clean, Predictable Error Contracts

```typescript
// Persistence failure is explicit — never returns a token for a failed save
if (!analysisId) {
  return NextResponse.json({ error: 'persistence_failed' }, { status: 503 });
}
// Unknown result IDs return 404 — never fabricated data
if (!snapshot.exists) {
  return NextResponse.json({ error: 'not_found' }, { status: 404 });
}
```

### 6. Gemini Client — Key Rotation and Model Fallback

`lib/gemini.ts` implements enterprise-grade AI resilience:

- Reads a **comma-separated key pool** from `GEMINI_API_KEYS`
- Round-robins across keys on 429 rate limits
- Falls back across model tiers: `gemini-2.5-flash -> gemini-2.0-flash`
- Hard `AbortSignal.timeout(10000)` on every Gemini call
- JSON mode enforced via `responseMimeType: "application/json"` with optional `responseSchema`

---

## Latency Optimization

> **Evaluation criteria:** P50/P95 API latency, time-to-first-result, critical path elimination, bundle size, and caching strategy.

### 1. Zero-AI Critical Path — < 200ms to First Result

| Architecture | Behavior |
|---|---|
| **Before** | User waited for full Gemini round-trip before seeing any result |
| **After** | Gemini is completely off the critical path |

```
User submits resume + JD
         |
         v
/api/analyze -> Local deterministic engine only
         |  (< 200ms)
         v
Firestore write (awaited for correctness guarantee)
         |
         v
Result token returned -> user sees dashboard instantly
         |  (non-blocking background task)
         v
/api/analyze/[id]/enrich -> Gemini evidence extraction
```

### 2. Async AI Enrichment with Deduplication

- A Firestore transaction lock prevents duplicate AI runs from concurrent browser tabs
- The client polls with exponential backoff: max 8 retries with 1.5s gap
- If AI fails at any step, local result remains intact and is marked `fallback`

### 3. LRU Cache for Resource Generation

`lib/resource-generator.ts` uses an in-memory LRU cache so repeated requests for the same skill never trigger a new AI call:

```typescript
// lib/rate-limit.ts — LRU cache with 1-minute TTL window, 5000 entry max
const ipTracker = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 60 * 1000,
});
```

### 4. Dynamic Imports — Route-Level Code Splitting

Heavy components are lazily loaded so the initial JS bundle stays lean:

```typescript
const SecondaryTools = dynamic(
  () => import('@/components/results/SecondaryTools').then((m) => m.SecondaryTools),
  { ssr: false, loading: () => <div className="animate-pulse h-16" /> }
);
```

### 5. Route Bundle Sizes — Latest Production Build

| Route | First Load JS |
|---|---|
| Shared bundle | **340 kB** |
| /analyze | **495 kB** |
| /results/[id] | **507 kB** — reduced from ~601 kB via lazy loading |
| /explore | **401 kB** |
| /battle | **716 kB** |

### 6. Edge Middleware — Zero Cold-Start Headers and Rate Limiting

`middleware.ts` runs at the Vercel Edge:

```typescript
// Public GET pages get 1-hour cache + stale-while-revalidate
response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
// Sliding window rate limiter: 15 requests/min per IP on /api/analyze
```

### 7. PDF Parsing — No External API Round-Trip

`lib/pdf-extract.ts` uses `pdf2json` as a pure server-side Node.js binary buffer parser. Zero network hop, zero external API cost, no added latency for PDF uploads.

### 8. Firestore Admin SDK — Server-Only, No Client Bundle Overhead

All Firestore reads/writes use the **Admin SDK** server-side only. Client-side Firestore reads are blocked in security rules (`allow get: if false`), keeping the client bundle free of Firestore SDK weight.

---

## Production Readiness

> **Evaluation criteria:** Security headers, secrets management, input validation, auth, privacy, database rules, monitoring hooks, and deployment config.

### 1. Security Headers — Global via next.config.ts

```
X-Content-Type-Options:     nosniff
X-Frame-Options:            DENY
Referrer-Policy:            strict-origin-when-cross-origin
Permissions-Policy:         camera=(), microphone=(), geolocation=()
Strict-Transport-Security:  max-age=31536000; includeSubDomains
Content-Security-Policy:    [full CSP enforced]
```

### 2. Privacy-First Resume Handling — AES-256-GCM

Raw resume text **never** persists in the analysis document. The enrichment pipeline uses a short-lived encrypted payload store:

```
lib/analyze-enrichment-store.ts
  encrypt()   ->  AES-256-GCM + gzip compression + IV + GCM auth tag
  TTL         ->  30-minute auto-expiry enforced on every read
  Max size    ->  750KB compressed limit enforced before write
  Wipe        ->  deleted immediately after AI enrichment completes
```

Firebase rules block all client reads of the encrypted collection:

```javascript
match /analysis_enrichment_jobs/{analysisId} {
  allow read, write: if false; // Server Admin SDK only
}
```

### 3. Firebase Security Rules — Zero Trust Client

```javascript
// Sensitive collections: client access completely blocked
match /analyses/{analysisId}  { allow get, list: if false; }
match /explorations/{id}      { allow read, write: if false; }
match /resource_cache/{id}    { allow read, write: if false; }

// User data: strict ownership checks
match /profiles/{userId}      { allow get, write: if isOwner(userId); }
match /active_jobs/{userId}   { allow get, write: if isOwner(userId); }
```

### 4. Input Validation on Every Route

- Upload size hard limit: **10 MB** enforced before PDF parsing
- PDF signature check: `%PDF-` magic bytes verified before any extraction
- Request guard `lib/request-guard.ts`: UUID-based request IDs, rate limit enforcement
- AI JSON output: field-level runtime validation before any database write

### 5. Rate Limiting — Multi-Layer Defense

```
Layer 1: Edge Middleware   ->  15 req/min per IP on /api/analyze
Layer 2: LRU route guard   ->  10 req/min per IP on all AI generation routes
Layer 3: Gemini client     ->  key rotation + model fallback on 429
```

### 6. Auth Architecture — Firebase Bearer Tokens

```
Client   -> getToken()           -> Firebase ID Token (JWT)
Request  -> Authorization: Bearer <token>
Server   -> firebase-admin verifyIdToken()  -> UID extracted
Firestore write -> Admin SDK with UID as ownership key
```

All protected routes verify the bearer token server-side. Guest access is supported for the analysis pipeline; authenticated endpoints enforce token presence.

### 7. Vercel Production Configuration

```json
"vercel": {
  "functions": {
    "app/api/analyze/route.ts": { "maxDuration": 30 }
  }
}
```

TypeScript errors block production builds (`ignoreBuildErrors: false`). Source maps are opt-in only via `NEXT_PUBLIC_ENABLE_SOURCE_MAPS`.

### 8. Observability Hooks — Request Tracing

Every analyze and explore response returns tracing headers:

```
X-Request-Id:        <uuid>             traces the specific request end-to-end
X-Pipeline-Source:   local | ai         shows which engine served the result
X-Enrichment-Status: pending | complete | fallback
```

### 9. Persistence Correctness — No Token Without a Confirmed Save

```typescript
// /api/analyze/route.ts — the Firestore write is awaited
await db.collection('analyses').doc(shareToken).set(analysisDocument);
// If this throws, no token is returned.
// Users never receive a result link that points to a missing document.
```

### 10. Graceful Degradation Contract

| Failure Scenario | Behavior |
|---|---|
| Gemini API down | Local result shown; enrichment marked fallback |
| Firebase write fails | 503 returned — no dangling token issued |
| PDF parsing fails | User prompted to paste raw text; no crash |
| Rate limit hit | 429 + Retry-After: 60 header |
| Unknown analysis ID | 404 — never returns fake or sample data |
| AI output malformed | Sanitized via schema validator; only safe fields merged |

---

## Database Schema

```
cloud.firestore
  /analyses/{shareToken}                  Analysis results (Admin SDK only)
  /analysis_enrichment_jobs/{token}       AES-256 encrypted resume (30min TTL)
  /profiles/{userId}                      User profiles and preferences
  /active_jobs/{userId}                   Pinned job tracking + skill progress
  /job_history/{userId}/jobs/{jobId}      Past job search history
  /share_cards/{cardId}                   Public career score cards
  /explorations/{explorationId}           Skill deep-dive cache (Admin SDK only)
  /resource_cache/{resourceId}            AI learning resource cache
```

**Sample Analysis Document:**

```json
{
  "share_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "gap_score": 38,
  "ready_by_date": "2026-09-17",
  "weeks_required": 6,
  "role_label": "Senior Frontend Engineer",
  "enrichment_status": "complete",
  "skill_gaps": [
    {
      "skill": "TypeScript",
      "priority": 1,
      "weeks_to_learn": 2,
      "in_mvc": true,
      "importance": "must_have",
      "match_status": "missing"
    }
  ],
  "matches": [
    {
      "requirement_id": "req-1",
      "status": "matched",
      "reason": "Supported by resume evidence: Built React components with hooks",
      "confidence": 0.92
    }
  ]
}
```

---

## API Reference

| Route | Method | Auth | Description |
|---|---|---|---|
| /api/analyze | POST | Optional | Parse resume + JD -> deterministic result + token |
| /api/analyze/[id]/enrich | POST | Optional | Async Gemini evidence enrichment |
| /api/results/[id] | GET | Optional | Fetch analysis by token |
| /api/results/[id]/plan | POST | Required | Generate weekly learning plan |
| /api/explore | POST | Optional | Role exploration with local skeleton |
| /api/explore/[id]/enrich | POST | Optional | Enrich exploration with Gemini |
| /api/generate-resources | POST | Optional | Skill-specific learning resources |
| /api/generate-star-bullets | POST | Optional | STAR resume bullet points |
| /api/generate-cover-lines | POST | Optional | Cover letter paragraph generator |
| /api/generate-linkedin-headlines | POST | Optional | LinkedIn headline optimizer |
| /api/generate-interview-questions | POST | Optional | Role-targeted interview prep |
| /api/battle/estimate | POST | Guest | Skill comparison estimate |
| /api/battle/ai | POST | Guest | Gemini skill battle verdict |
| /api/active-job | GET/POST/PATCH | Required | Job tracking: read/pin/update |
| /api/active-job/history | GET | Required | Archived job history |
| /api/profile | GET/PATCH | Required | User profile management |
| /api/profile/share | POST | Required | Create public share card |
| /api/profile/streak | POST | Required | Increment daily streak |
| /api/profile/timeline | GET/POST | Required | Career timeline events |
| /api/recruiter/rank | POST | Optional | Rank multiple candidates against JD |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Auth enabled
- Google Gemini API key (optional — local engine runs fully without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/Harshit-harry09/skillpath-hackathon.git
cd skillpath-hackathon/skillpath

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run the development server
npm run dev
# Open http://localhost:3000

# Run tests
npm test

# Build for production
npm run build
```

---

## Environment Variables

```env
# Required — Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Optional — AI enrichment
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEYS=key1,key2,key3
ANALYZE_ENCRYPTION_KEY=your_random_32_char_secret

# Optional — debugging
NEXT_PUBLIC_ENABLE_SOURCE_MAPS=false
TRUST_PROXY_HEADERS=false
```

> Note: SkillPath's core analysis pipeline runs fully without GEMINI_API_KEY. The local deterministic engine works offline. AI enrichment is an optional upgrade layer.

---

## Project Structure

```
skillpath/
  app/
    api/
      analyze/route.ts                Core analysis pipeline
      analyze/[id]/enrich/route.ts    Async AI enrichment
      results/[id]/route.ts           Result fetch and sanitize
      results/[id]/plan/route.ts      Learning plan generator
      battle/estimate/route.ts        Skill Battle estimate
      battle/ai/route.ts              Skill Battle Gemini verdict
      explore/route.ts                Role exploration
      explore/[id]/enrich/route.ts    Role enrichment
      profile/route.ts                Profile management
      profile/share/route.ts          Public share card
      profile/streak/route.ts         Daily streak
      profile/timeline/route.ts       Career timeline
      active-job/route.ts             Active job tracker
      active-job/history/route.ts     Job history
      recruiter/rank/route.ts         Candidate ranking
    analyze/page.tsx                  Resume + JD input page
    results/[id]/page.tsx             Results dashboard
    battle/page.tsx                   Skill Battle arena
    explore/page.tsx                  Role explorer
    profile/page.tsx                  User profile hub
    history/page.tsx                  Past analyses
    auth/page.tsx                     Firebase Auth

  components/
    results/                          SkillCard, ReadinessRing, SecondaryTools
    profile/                          ProfileHeader, ActiveJobCard, SkillTimeline
    landing/                          Hero, HowItWorks, FeaturesGrid
    ui/                               AsciiFire, FloatingDock, Chip, Accordion

  lib/
    mvc-profiler.ts                   5,000+ JD MVC frequency model across 60+ roles
    semantic-skill-matcher.ts         Cosine similarity and Levenshtein matching
    ai-analysis-schema.ts             Runtime AI output validation and sanitization
    analyze-enrichment-store.ts       AES-256-GCM encrypted payload store
    ats-composite-scorer.ts           5-Pillar enterprise ATS scoring engine
    ats-experience-parser.ts          YOE and seniority extraction
    ats-fraud-detector.ts             Red flag and format audit
    confidence-reweighter.ts          Self-assessment score recomputation
    gap-scorer.ts                     Weighted skill gap scoring
    gemini.ts                         Gemini client: key rotation, fallback, timeout
    pdf-extract.ts                    Server-side PDF binary buffer parser
    readiness.ts                      Weeks-to-ready countdown engine
    resource-generator.ts             LRU-cached learning resource generator
    skill-battle.ts                   Market frequency battle engine
    dijkstra.ts                       Role transition shortest-path graph
    rate-limit.ts                     LRU sliding-window per-IP rate limiter

  types/
    analysis.ts                       All shared TypeScript interfaces

  tests/
    engineering-contract.test.mjs     API contract regression tests
    ats-pipeline.test.ts              ATS module unit tests

  firestore.rules                     Zero-trust Firestore security rules
  middleware.ts                       Edge rate limiting and security headers
  next.config.ts                      Security headers, HSTS, CSP
```

---

## Evaluation Summary

| Parameter | Evidence |
|---|---|
| **Code Quality** | TypeScript 5 strict mode across 90+ files, layered architecture with clean lib/api/component separation, AI output schema validation, 6-module ATS test suite, structured error contracts (404/503/429), zero-any policy |
| **Latency Optimization** | < 200ms deterministic critical path with zero AI dependency, async background AI enrichment, LRU resource cache, dynamic imports with route-level code splitting, edge middleware for zero cold-start overhead |
| **Production Readiness** | AES-256-GCM resume encryption with 30min TTL, HSTS + CSP + Permissions-Policy headers, Firebase zero-trust security rules, 3-layer rate limiting, awaited persistence with explicit failure contracts, full graceful AI degradation |

---

<div align="center">

**Built for Nehru Hackathon 2026**

*SkillPath — Close Your Skill Gap. Master Any Role.*

</div>
