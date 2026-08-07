<!-- updated -->
# 🚀 SKILLPATH — Complete Hackathon Pitch & Deep Technical Documentation

> **Event / Context**: Nehru Hackathon Pitch & Technical Review  
> **Project Name**: SkillPath (`skillpath`)  
> **Tagline**: Bridge the Gap Between Your Resume and Your Dream Job with AI-Driven Career Intelligence  
> **Document Purpose**: Exhaustive A-to-Z Technical Architecture, Database Schemas, Dataset Specs, Slide-by-Slide Pitch Presentation Deck, and Judge Q&A Cheat Sheet.

---

## 📌 Table of Contents
1. [Project Overview & Core Vision](#1-project-overview--core-vision)
2. [Problem Statement & Market Gap](#2-problem-statement--market-gap)
3. [The Solution & Unique Value Proposition](#3-the-solution--unique-value-proposition)
4. [Dual-Engine Architecture (Local + AI)](#4-dual-engine-architecture-local--ai)
5. [Complete Technology Stack (A-to-Z)](#5-complete-technology-stack-a-to-z)
6. [Complete Database Schema (Firestore Collections)](#6-complete-database-schema-firestore-collections)
7. [Trained Datasets & Data Files Deep-Dive](#7-trained-datasets--data-files-deep-dive)
8. [Codebase Map & File Breakdown](#8-codebase-map--file-breakdown)
9. [Slide-by-Slide Pitch Deck (With Hinglish & English Scripts)](#9-slide-by-slide-pitch-deck-with-hinglish--english-scripts)
10. [Judge Q&A Cheat Sheet & Winning Answers](#10-judge-qa-cheat-sheet--winning-answers)

---

## 🎯 1. Project Overview & Core Vision

**SkillPath** is a production-grade **AI-Powered Career Intelligence and Skill Gap Analysis Platform**.

When candidates apply for jobs online, **over 75% of resumes are filtered out by ATS (Applicant Tracking Systems)** without giving candidates any constructive feedback on *why* they were rejected or *what specific skills* they need to acquire to become competitive.

SkillPath takes a candidate's uploaded **Resume (PDF or raw text)** and a target **Job Description (JD)**, diffs them using a **Dual-Brain Hybrid Engine**, isolates non-negotiable **MVC (Minimum Viable Candidate) deal-breaker skills**, calculates a precise **Weeks-to-Job-Ready timeline**, estimates **Salary ROI**, and generates a customized **Week-by-Week AI Learning Roadmap**.

---

## 💥 2. Problem Statement & Market Gap

### ❌ The Core Problems in Tech Hiring Today:
1. **The ATS Black Hole**:
   - Candidates send hundreds of resumes on LinkedIn/Indeed, receiving generic automated rejections ("We've decided to move forward with other candidates"). No feedback is ever given.
2. **Job Description Noise & Fatigue**:
   - JDs list 20–30 requirements (often written by HR recruiters without deep tech knowledge). Candidates face **analysis paralysis** — they don't know which 3-4 skills are actual deal-breakers versus nice-to-haves.
3. **Inability to Plan Career Readiness**:
   - Job seekers cannot answer simple questions: *"Am I 60% ready or 80% ready?"*, *"How many weeks of study do I need?"*, and *"Which specific courses/projects should I build?"*
4. **Vague AI Prompts**:
   - Standard ChatGPT prompts fail because LLMs lack domain-specific frequency models from thousands of real JDs and often give hallucinated, unquantified advice.
5. **Data Privacy Concerns**:
   - Job seekers hesitate uploading private resumes into third-party AI databases.

---

## 💡 3. The Solution & Unique Value Proposition

### ⚡ How SkillPath Fixes This:
- **Instant Deterministic Pipeline**: Local algorithm runs in < 200ms without needing an external API key to give initial results.
- **5,000+ JDs Trained MVC Model**: Uses statistical market frequency data across **60+ role categories** (Frontend, Backend, ML Engineer, DevOps, Cybersecurity, etc.) to isolate the **top 4-5 deal-breaker skills**.
- **Interactive Confidence Reweighter**: Candidates rate their own confidence level on missing skills (`never_used`, `heard_of_it`, `used_it`, `comfortable`, `strong`), automatically updating their readiness score and weekly timeline in real time.
- **Skill Decay & Market Trend Engine**: Detects obsolete technologies on resumes (e.g. jQuery, SVN, AngularJS v1) and suggests modern replacements (React, Git, Angular 17+).
- **Privacy-First AES Encryption**: Short-lived encrypted Firestore payloads auto-expire and wipe after 30 minutes.

---

## 🧠 4. Dual-Engine Architecture (Local + AI)

SkillPath implements a **Hybrid Dual-Brain Architecture**:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            USER INPUT                                   │
 │                Upload PDF Resume  +  Paste Target JD                   │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │               STEP 1: LOCAL DETERMINISTIC ENGINE (<200ms)               │
 │ ├─ Node.js pdf2json buffer parser                                       │
 │ ├─ Keyword & Levenshtein Fuzzy Skill Extractor                          │
 │ ├─ Role Category Detector (60+ Roles)                                   │
 │ ├─ MVC Model Lookup (Cross-references 5,000+ JD dataset)               │
 │ └─ Baseline Gap Scorer & Weeks-to-Ready Countdown                       │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │           STEP 2: ASYNC AI ENRICHMENT ENGINE (Google Gemini API)        │
 │ ├─ Transient AES-256 Payload Storage (30-min encrypted TTL)            │
 │ ├─ Resume Quote vs JD Requirement Evidence Matcher                      │
 │ ├─ Zod Schema Enforced Structured Analysis Output                        │
 │ └─ Personalized Weekly Learning Roadmap & Video Resource Generator      │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 5. Complete Technology Stack (A-to-Z)

| Layer | Technology | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** | Modern SSR, SSG, and API route handler. Uses React 19 concurrent features. |
| **Language** | **TypeScript (v5)** | End-to-end type safety with strict contracts (`types/analysis.ts`, `types/profile.ts`). |
| **Styling & Design System** | **Tailwind CSS v3 + CSS Variables** | Custom glassmorphism dark theme (`var(--color-canvas)`, `var(--color-ink)`). |
| **3D & Canvas Graphics** | **Three.js + React Three Fiber + OGL** | WebGL ASCII Fire shader background (`components/ui/AsciiFire.tsx`). |
| **Animations & Transitions** | **Framer Motion + Lenis** | Hardware-accelerated fluid scroll and micro-interactions. |
| **AI LLM Provider** | **Google Gemini 2.5 API (`@google/genai`)** | Deep evidence quote extraction, resume/JD diffing, and resource generation. |
| **Schema Validation** | **Zod** | Enforces structured JSON returns from LLM (`lib/ai-analysis-schema.ts`). |
| **PDF Extraction** | **`pdf2json`** | Direct server-side PDF binary array-buffer parsing without external API cost. |
| **Cloud Database** | **Firebase Firestore** | Serverless NoSQL document store for analyses, share cards, and user profiles. |
| **Authentication** | **Firebase Auth + Firebase Admin** | User authentication and session verification (`lib/auth-helpers.ts`). |
| **Dynamic Counters** | **`@number-flow/react`** | Animated score counters for percentage rings and salary jumps. |
| **Deploy & Infrastructure** | **Vercel / Node.js Runtime** | Configured with `maxDuration = 30` for Vercel Serverless Functions. |

---

## 🗄️ 6. Complete Database Schema (Firestore Collections)

Security rules (`firestore.rules`) enforce strict privacy. Below is the full schema breakdown across all **8 collections**:

```
cloud.firestore
├── /analyses/{shareToken}                  (Analysis Reports)
├── /analysis_enrichment_jobs/{shareToken}   (Short-lived Encrypted Resume Payloads)
├── /profiles/{userId}                      (User Profile & Preferences)
├── /active_jobs/{userId}                   (Saved Target Jobs)
├── /job_history/{userId}/jobs/{jobId}       (User Search History)
├── /share_cards/{cardId}                   (Public Viral Social Cards)
├── /explorations/{explorationId}           (Cached Skill Deep Dives)
└── /resource_cache/{resourceId}            (Cached Learning Resources)
```

### JSON Schema Representations:

#### 1. `analyses` Collection (`/analyses/{shareToken}`)
```json
{
  "share_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "user_id": "usr_9981247",
  "gap_score": 38,
  "ready_by_date": "2026-09-17",
  "weeks_required": 6,
  "company_type": "enterprise",
  "role_category": "frontend-developer",
  "role_label": "Frontend Developer",
  "summary": "You are 6 weeks away from being competitive...",
  "mvc_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "State Management"],
  "user_skills": ["JavaScript", "HTML", "CSS", "React", "Git"],
  "matched_skills": ["React", "JavaScript", "HTML", "CSS"],
  "skill_gaps": [
    {
      "skill": "TypeScript",
      "priority": 1,
      "weeks_to_learn": 2,
      "in_mvc": true,
      "reason": "High frequency in job description; required for type safety.",
      "category": "frontend"
    }
  ],
  "trajectory": {
    "current_level": "mid",
    "current_salary": 85000,
    "next_salary": 115000,
    "salary_jump": 35.29,
    "next_role_label": "Fullstack Developer"
  },
  "created_at": "2026-08-06T21:34:00Z"
}
```

#### 2. `analysis_enrichment_jobs` Collection (`/analysis_enrichment_jobs/{shareToken}`)
*(Server-Only Access for Privacy)*
```json
{
  "shareToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "encryptedPayload": "U2FsdGVkX19v8zN...[AES-256 Encrypted Ciphertext]",
  "createdAt": "2026-08-06T21:34:00Z",
  "expiresAt": "2026-08-06T22:04:00Z"
}
```

---

## 📊 7. Trained Datasets & Data Files Deep-Dive

Located in [`lib/data/`](file:///c:/Users/shaur/OneDrive/web2/skillpath/skillpath/lib/data), SkillPath incorporates proprietary structured dataset files:

1. **`mvc_model.json` (309 KB)**:
   - Contains statistical skill frequency counts from **5,000+ parsed global JDs**.
   - Covers 60+ role slugs. Assigns importance weights (e.g. `count`, `frequency`, `premium`).
2. **`mvc_model_india.json` (298 KB)**:
   - Indian Tech Market variant calibrated for Bangalore/NCR/Hyderabad tech ecosystems.
3. **`skill_trends.json` (4.6 KB)**:
   - Tracks technology decay vs modern equivalents:
     - `jQuery` ➔ Replace with Vanilla JS / React.
     - `Hadoop` ➔ Replace with Apache Spark / Databricks.
     - `SVN` ➔ Replace with Git.
     - `AngularJS (v1)` ➔ Migrate to Angular 17+ or React.
4. **`role_adjacency.json` (7.3 KB)**:
   - Multi-directional career progression graph mapping adjacent transition roles (e.g., `frontend-developer` ➔ `fullstack-developer` ➔ `solutions-architect`).
5. **`fuzzy-dictionary.ts` & `noise-dictionary.ts`**:
   - Normalizes alias variations (`k8s` ➔ `kubernetes`, `postgres` ➔ `postgresql`) and removes fluff filler words.

---

## 📁 8. Codebase Map & File Breakdown

```
skillpath/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts             <-- Core POST endpoint for analysis pipeline
│   │   └── results/[id]/enrich/route.ts <-- Async AI Gemini enrichment route
│   ├── analyze/page.tsx                <-- Input page (Resume upload & JD input)
│   ├── results/[id]/page.tsx           <-- Main Dashboard (Readiness ring, skill cards)
│   ├── history/page.tsx                <-- Saved job history
│   ├── explore/page.tsx                <-- Interactive Skill Taxonomy Explorer
│   ├── share/[id]/page.tsx              <-- Public Share Preview Page
│   ├── layout.tsx                      <-- Root Layout & Theme Providers
│   └── page.tsx                        <-- Landing Page (Hero, Stats, AsciiFire)
├── components/
│   ├── landing/                        <-- Hero, HowItWorks, FeaturesGrid, Differentiators
│   ├── results/                        <-- ReadinessRing, SkillCard, ResourceCard, ConfidenceStrip
│   └── ui/                             <-- AsciiFire, Preloader, Buttons, TextPath
├── lib/
│   ├── mvc-profiler.ts                 <-- Minimum Viable Candidate statistical profiler
│   ├── role-matcher.ts                 <-- Role detection engine
│   ├── semantic-skill-matcher.ts       <-- Levenshtein & fuzzy skill normalization
│   ├── gap-scorer.ts                   <-- Skill gap scoring algorithm
│   ├── confidence-reweighter.ts        <-- Interactive self-assessment re-scoring
│   ├── resource-generator.ts           <-- Learning roadmap & link generator
│   ├── ai-evidence-extractor.ts        <-- Gemini evidence quote extractor
│   ├── gemini.ts                       <-- Google Gemini API wrapper
│   ├── pdf-extract.ts                  <-- Node pdf2json buffer parser
│   └── firebase-admin.ts               <-- Firestore Admin SDK initialization
├── types/
│   └── analysis.ts                     <-- Core AnalysisResult, SkillGap, LearningPlan interfaces
└── firestore.rules                     <-- Security Rules configuration
```

---

## 🎤 9. Slide-by-Slide Pitch Deck (With Hinglish & English Scripts)

### 📌 Slide 1: Title & Hook
* **Visual**: SkillPath Logo, ASCII Fire Canvas visualizer, Tagline: *"Closing the Gap Between Talent and Opportunity"*.
* **Speaker Script**:
  > *"Good morning judges! Every day, thousands of talented engineers apply for jobs online, only to receive generic rejection emails like 'We chose to proceed with other candidates.' Unhe kabhi ye nahi bataya jata ki **unke resume mein kya missing tha**. Today we introduce **SkillPath** — an AI-powered Career Intelligence engine that turns job rejection into an exact, actionable roadmap."*

---

### 📌 Slide 2: Problem Statement
* **Visual**: Diagram showing 100 Resumes ➔ ATS Black Hole ➔ Vague Rejection Email ➔ Confused Candidate.
* **Speaker Script**:
  > *"The core problem has 3 layers:  
  > 1. **ATS Black Hole**: No feedback is provided to candidates.  
  > 2. **Job Description Noise**: JDs list 30+ requirements. Candidates don't know which 4-5 skills are actual deal-breakers versus optional nice-to-haves.  
  > 3. **Generic AI Hallucinations**: Standard ChatGPT prompts give vague, unquantified advice."*

---

### 📌 Slide 3: The Solution — SkillPath
* **Visual**: Architecture Diagram highlighting the **Dual-Engine Brain** (Local Fast Engine + AI Gemini Engine).
* **Speaker Script**:
  > *"SkillPath solves this with a **Dual-Engine Brain Architecture**:  
  > - **Instant Local Engine (<200ms)**: Extract skills instantly using fuzzy keyword matching and cross-reference them against our trained dataset of **5,000+ JDs**.  
  > - **Async AI Enrichment Engine**: Uses Google Gemini to extract exact proof-quotes from the candidate's resume and map them against JD requirements."*

---

### 📌 Slide 4: Live Demo Walkthrough
* **Visual**: Screen Recording or Live Browser Demo of SkillPath in action.
* **Speaker Script (Demo Walkthrough)**:
  > *"Let us show you a live demo:  
  > 1. We upload a PDF Resume and paste a Senior Frontend JD.  
  > 2. Instantly, SkillPath generates the **Readiness Score (e.g., 68%)**, **Target Date (e.g., 6 Weeks to Ready)**, and **Salary ROI Jump ($85k ➔ $115k)**.  
  > 3. Notice the **MVC Dealbreakers**: Out of 20 JD requirements, SkillPath isolates the top 4 non-negotiable gaps.  
  > 4. **Interactive Self-Assessment**: Watch as I adjust my confidence level on 'TypeScript' from 'Heard of it' to 'Comfortable' — the graph and target readiness date automatically recalibrate!"*

---

### 📌 Slide 5: Key Value-Added Micro-Tools
* **Visual**: Grid showing STAR Bullet Generator, LinkedIn Headline Optimizer, and Cover Letter Generator.
* **Speaker Script**:
  > *"SkillPath doesn't just identify skill gaps; it actively helps candidates fix them:  
  > - **Curated AI Learning Roadmap**: Instant YouTube videos, documentation links, and project ideas.  
  > - **STAR Resume Bullet Generator**: AI writes custom STAR-formatted bullet points targeting missing skills.  
  > - **LinkedIn Headline & Cover Letter Generator**: Custom-tailored for the candidate's target job."*

---

### 📌 Slide 6: Engineering & Privacy Innovation
* **Visual**: Encryption flowchart (AES-256 Encryption ➔ 30-min TTL Firestore Doc ➔ Auto-Wipe).
* **Speaker Script**:
  > *"On the engineering side, SkillPath is built with **Next.js 15, TypeScript, Tailwind, and Firebase Firestore**.  
  > To address candidate privacy, we engineered a **Privacy-First Payload Pipeline**: Resumes and JDs are stored with a 30-minute AES-256 encrypted TTL and automatically destroyed after processing."*

---

### 📌 Slide 7: Business Model & Future Scale
* **Visual**: B2C Subscription + B2B Ed-Tech Integration Flow.
* **Speaker Script**:
  > *"SkillPath operates on a **B2C Premium Model** for job seekers needing detailed career analytics, and a **B2B SaaS API Model** for ed-tech platforms like Coursera or Udemy to recommend targeted course bundles based on candidate skill gaps."*

---

### 📌 Slide 8: Conclusion & Q&A
* **Visual**: Call to Action & Thank You slide with GitHub link / Live URL.
* **Speaker Script**:
  > *"Thank you judges! SkillPath bridges the gap between talent and opportunity. We are now open for your questions!"*

---

## ❓ 10. Judge Q&A Cheat Sheet & Winning Answers

#### 💬 Judge Q1: *"How does SkillPath differ from just pasting your resume and JD into ChatGPT?"*
> **Winning Answer**:  
> *"ChatGPT is a generic unconstrained language model that suffers from hallucinations and lacks structured dataset weights. SkillPath is a **specialized engineering system**:  
> 1. We trained an **MVC (Minimum Viable Candidate) Dataset** on over 5,000 real-world job descriptions to know exactly which skills are statistical deal-breakers for 60+ job roles.  
> 2. We use a **Local Deterministic Pipeline** that calculates exact readiness percentage rings and weeks-to-ready timelines.  
> 3. We enforce strict Zod JSON schemas on Gemini to ensure evidence-backed quote matching."*

---

#### 💬 Judge Q2: *"What if a candidate uploads a bad/scanned PDF resume?"*
> **Winning Answer**:  
> *"Our backend uses Node's native binary buffer check (`pdf2json`) to verify header signatures (`%PDF-`). If text extraction fails due to scanned image PDFs, our pipeline gracefully catches the exception and prompts the user to paste their raw resume text without breaking the app."*

---

#### 💬 Judge Q3: *"How do you calculate the 'Weeks Required' to become job ready?"*
> **Winning Answer**:  
> *"Each missing skill has two parameters: **Complexity Index** (weeks required to learn) and **Market Frequency Weight** (from our MVC dataset). When the candidate rates their confidence (`never_used` vs `comfortable`), our `confidence-reweighter.ts` algorithm recalculates the adjusted priority and aggregates the remaining study weeks."*

---

#### 💬 Judge Q4: *"How do you handle user data privacy?"*
> **Winning Answer**:  
> *"Resumes contain sensitive PII. We designed a short-lived **AES-256 Encrypted Payload Store** in Firestore (`analysis_enrichment_jobs`). Data is encrypted at rest, expires after 30 minutes, and is wiped immediately after AI enrichment completes."*

---

> 📄 **Document Generated**: Ready to present for **Nehru Hackathon**.  
> 🌐 **SkillPath**: *Close Your Skill Gap. Master Any Role.*
