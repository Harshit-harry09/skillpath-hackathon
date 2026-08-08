<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=40&duration=3000&pause=1000&color=6EE7B7&center=true&vCenter=true&width=600&lines=⚡+SkillPath;AI+Career+Intelligence;Close+Your+Skill+Gap" alt="SkillPath" />

### *AI-Powered Career Intelligence & Skill Gap Analysis Platform*

**Bridge the Gap Between Your Resume and Your Dream Job**

<br/>

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<br/>

> 🏆 **Nehru Hackathon 2026** — Deterministic AI-hybrid career intelligence that gives every candidate an exact, evidence-backed roadmap.

<br/>

[![Code Quality](https://img.shields.io/badge/Code_Quality-TypeScript_Strict_%2B_Tested-brightgreen?style=flat-square)](https://github.com/Harshit-harry09/skillpath-hackathon)
[![Latency](https://img.shields.io/badge/Latency-<200ms_Critical_Path-blue?style=flat-square)](https://github.com/Harshit-harry09/skillpath-hackathon)
[![Production](https://img.shields.io/badge/Production-AES--256_+_HSTS_+_Rate_Limited-orange?style=flat-square)](https://github.com/Harshit-harry09/skillpath-hackathon)

</div>

---

## What is SkillPath?

75% of resumes are rejected by ATS systems before a human reads them. Candidates get no feedback — just silence.

**SkillPath** fixes that. It takes a candidate's resume (PDF or text) and a job description, then delivers in under 200ms:

- 🎯 An exact **Gap Score** (0–100) showing resume coverage of the JD
- 📅 A precise **Weeks-to-Ready** countdown based on skill complexity
- 🔑 The **4–5 real deal-breaker skills** isolated from 20–30 noisy requirements
- 💰 A **Salary ROI estimate** showing the financial upside of closing the gap
- 📋 A **Week-by-Week Learning Roadmap** with curated YouTube and docs links
- 🔍 **AI Evidence Matching** — exact resume quotes mapped to each JD requirement

---

## The Three Judge Parameters

### ⭐ Code Quality

| Dimension | Implementation |
|---|---|
| **TypeScript Strict** | Every file uses `strict: true` — zero `any`, end-to-end typed from API to UI |
| **Layered Architecture** | `lib/` (pure logic) → `app/api/` (thin orchestration) → `components/` (pure UI) |
| **AI Schema Validation** | All Gemini JSON is runtime-validated via `lib/ai-analysis-schema.ts` before touching DB |
| **Test Suite** | 6 ATS pipeline modules tested with Node.js native test runner (`npm test`) |
| **Error Contracts** | Every route returns typed errors: `404 not_found`, `503 persistence_failed`, `429 rate_limited` |
| **Gemini Resilience** | Key pool rotation, model fallback chain, `AbortSignal.timeout(10000)` on every call |

```bash
npm test                   # 6/6 ATS pipeline tests pass
npx tsc --noEmit           # 0 TypeScript errors
npm run lint -- --quiet    # 0 ESLint errors
npm run build              # Clean production build
```

---

### ⚡ Latency Optimization

**Core principle: Gemini is completely off the critical path.**

```
User submits resume + JD
        │
        ▼  ─────────────── < 200ms ───────────────
Local Engine:  pdf2json → MVC profiler → gap scorer → readiness
        │
        ▼  Result token returned → Dashboard visible immediately
        │
        ▼  ─────── Background (non-blocking) ──────
AI Engine:   AES-256 payload → Gemini evidence → cosine matching → merge
```

| Optimization | Detail |
|---|---|
| **< 200ms first result** | Local deterministic engine, zero AI dependency |
| **Async AI enrichment** | Firestore transaction lock prevents duplicate AI runs |
| **LRU resource cache** | 5,000-entry LRU cache, repeated skill lookups never hit Gemini |
| **Dynamic imports** | `SecondaryTools`, charts, and particles are lazily loaded |
| **Edge middleware** | Rate limiting + cache headers at Vercel Edge, zero cold-start cost |
| **No external PDF API** | `pdf2json` runs server-side — zero network round-trip for PDF uploads |
| **Admin SDK only** | No client Firestore SDK in bundle — all DB ops are server-side |

**Route bundle sizes (latest build):**

```
Shared bundle    340 kB
/analyze         495 kB
/results/[id]    507 kB   ← reduced from ~601 kB via lazy loading
/explore         401 kB
```

---

### 🚀 Production Readiness

**Privacy — AES-256-GCM Encrypted Resume Store**

Raw resume text never persists in the analysis document. It lives in a short-lived encrypted Firestore document for 30 minutes, then is wiped automatically after AI enrichment.

```
lib/analyze-enrichment-store.ts
  encrypt()  →  AES-256-GCM + gzip + IV + auth tag
  TTL        →  30 minutes, enforced on every read
  Max size   →  750 KB compressed, rejected before write
  Wipe       →  deleted immediately after enrichment
```

**Security Headers (applied globally)**

```
X-Content-Type-Options:    nosniff
X-Frame-Options:           DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy:        camera=(), microphone=(), geolocation=()
Content-Security-Policy:   [full CSP enforced]
```

**Firebase Zero-Trust Rules**

```javascript
// Sensitive collections: zero client access
match /analyses/{id}               { allow get, list: if false; }
match /analysis_enrichment_jobs/{id} { allow read, write: if false; }

// User data: strict ownership
match /profiles/{userId}           { allow get, write: if isOwner(userId); }
```

**Graceful Degradation — AI Never Breaks the Product**

| Failure | Behavior |
|---|---|
| Gemini API down | Local result shown, marked `fallback` |
| Firebase write fails | `503` returned — no dangling token issued |
| PDF malformed | User prompted to paste text — no crash |
| Rate limit hit | `429` + `Retry-After: 60` |
| Unknown result ID | `404` — never returns fabricated data |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      USER INPUT                          │
│         PDF Resume  +  Job Description (JD)              │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│      STEP 1 — LOCAL DETERMINISTIC ENGINE (< 200ms)       │
│                                                          │
│  pdf-extract.ts     → PDF binary buffer parser           │
│  mvc-profiler.ts    → 5,000+ JD MVC frequency model      │
│  ai-skill-cleaner   → Levenshtein fuzzy normalization    │
│  gap-scorer.ts      → Weighted skill gap scoring         │
│  ats-pipeline       → 5-Pillar enterprise ATS score      │
│  Firestore write    → Return result token                │
└────────────────────────┬─────────────────────────────────┘
                         │  Dashboard loads instantly
                         ▼
┌──────────────────────────────────────────────────────────┐
│      STEP 2 — ASYNC AI ENRICHMENT (background)           │
│                                                          │
│  AES-256-GCM payload → 30min TTL Firestore store         │
│  Transaction lock    → prevents duplicate AI runs        │
│  Gemini 2.5 Flash    → evidence quote extraction         │
│  semantic-matcher    → cosine similarity scoring         │
│  Schema validation   → sanitize before DB write          │
│  Result upgraded     → marked complete or fallback       │
└──────────────────────────────────────────────────────────┘
```

---

## Full Feature Set

<details>
<summary><strong>Core Analysis Engine</strong></summary>

| Feature | Engine |
|---|---|
| Resume Gap Analysis | Local + AI |
| Match Score 0–100 | Local |
| Readiness Score | Local + User |
| Weeks-to-Ready | Local |
| ATS Composite Score (5-Pillar) | Local |
| Skill Freshness Audit | Local |
| AI Evidence Matching | Gemini |
| Interactive Confidence Reweighter | Local |

</details>

<details>
<summary><strong>Career Content Tools</strong></summary>

| Feature | Engine |
|---|---|
| Learning Roadmap (week-by-week) | AI + Local |
| STAR Bullet Generator | Gemini |
| LinkedIn Headline Optimizer | Gemini |
| Cover Letter Generator | Gemini |
| Interview Question Generator | Gemini |
| De-Slopifier / Buzzword Eraser | AI |
| Multi-Format Exporter (PDF/MD/TXT) | Local |

</details>

<details>
<summary><strong>Recruiter & Market Tools</strong></summary>

| Feature | Engine |
|---|---|
| Skill Battle | Local + AI |
| Salary ROI Estimator | Local |
| Role Switch Panel (Dijkstra graph) | Local |
| Recruiter Red Flag Radar | Local |
| Competitive Benchmark Score | Local |
| Seniority Calibrator | Local |
| Resume Time Machine | Local |

</details>

<details>
<summary><strong>Profile & Progress Tracking</strong></summary>

| Feature | Engine |
|---|---|
| User Profile Dashboard | Firebase |
| Active Job Tracker | Firebase |
| Daily Streak System | Firebase |
| Skill Timeline | Firebase |
| Job History | localStorage |
| Public Share Cards | Firebase |

</details>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router + React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v3 + CSS Variables glassmorphism |
| 3D / WebGL | Three.js + React Three Fiber + OGL |
| Animations | Framer Motion + Lenis |
| AI | Google Gemini 2.5 Flash |
| PDF Parsing | pdf2json (server-side, no external API) |
| Database | Firebase Firestore (Admin SDK, server-only) |
| Auth | Firebase Auth (JWT bearer tokens) |
| Rate Limiting | LRU Cache sliding window per IP |
| Deployment | Vercel (Edge middleware + 30s function timeout) |

---

## Getting Started

```bash
# Clone and enter the app directory
git clone https://github.com/Harshit-harry09/skillpath-hackathon.git
cd skillpath-hackathon/skillpath

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local   # fill in Firebase + Gemini keys

# Run locally
npm run dev        # http://localhost:3000

# Run tests
npm test           # 6 ATS pipeline modules

# Production build
npm run build
```

> **Note:** The app works without a Gemini API key. The local engine handles the full analysis pipeline. Gemini enrichment is an optional upgrade.

---

## Environment Variables

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI enrichment (optional)
GEMINI_API_KEY=
GEMINI_API_KEYS=key1,key2,key3   # multi-key pool for rotation
ANALYZE_ENCRYPTION_KEY=           # AES-256 encryption for resume privacy
```

---

## Project Structure

```
skillpath-hackathon/
├── README.md                        ← You are here
└── skillpath/                       ← Next.js application root
    ├── app/
    │   ├── api/                     ← 20 API routes
    │   ├── analyze/                 ← Resume + JD input page
    │   ├── results/[id]/            ← Results dashboard
    │   ├── battle/                  ← Skill Battle arena
    │   ├── explore/                 ← Role explorer
    │   └── profile/                 ← User profile hub
    ├── components/
    │   ├── results/                 ← SkillCard, ReadinessRing, SecondaryTools
    │   ├── profile/                 ← ProfileHeader, ActiveJobCard, SkillTimeline
    │   └── ui/                      ← AsciiFire, FloatingDock, Accordion
    ├── lib/
    │   ├── mvc-profiler.ts          ← 5,000+ JD MVC model (60+ roles)
    │   ├── semantic-skill-matcher   ← Cosine similarity matching
    │   ├── ai-analysis-schema.ts    ← Gemini output validation
    │   ├── analyze-enrichment-store ← AES-256-GCM encrypted store
    │   ├── ats-composite-scorer     ← 5-Pillar ATS engine
    │   └── gemini.ts               ← Key rotation + model fallback client
    ├── types/analysis.ts            ← All shared TypeScript interfaces
    ├── tests/                       ← ATS pipeline + contract tests
    ├── firestore.rules              ← Zero-trust security rules
    └── middleware.ts                ← Edge rate limiting + security headers
```

---

<div align="center">

**Built for Nehru Hackathon 2026**

*SkillPath — Close Your Skill Gap. Master Any Role.*

[![GitHub Stars](https://img.shields.io/github/stars/Harshit-harry09/skillpath-hackathon?style=social)](https://github.com/Harshit-harry09/skillpath-hackathon)

</div>
