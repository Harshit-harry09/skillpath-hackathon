# SkillPath: The Elite Career Architect 🚀

![SkillPath Banner](https://github.com/shauryap9006/Skillpath/raw/main/public/banner.png)

SkillPath is a high-performance AI platform designed to eliminate the guesswork from career progression in tech. By leveraging deep-learning and data-driven analysis, it bridges the gap between a developer's current skill set and their target role.

---

## ⚠️ The Problem Statement
In the modern tech landscape, engineers face a critical **"Information Asymmetry"** problem:
- **The Vocabulary Gap**: Disconnect between developer language and ATS/Recruiter terminology.
- **The "Noise" Problem**: Generic courses that contain 80% fluff.
- **Cultural Calibration**: Ignoring the difference between Startups, Mid-size, and Enterprise roles.

## ✅ The SkillPath Solution
SkillPath provides a **precision-engineered roadmap** for career transitions. It doesn't just list skills; it calculates the "Delta" (the difference) between your current state and a specific job requirement.

### Core Features:
- 🎯 **Gap Delta Analysis**: Deep-learning comparison engine ranking technical deficiencies by market demand.
- 📚 **The 80/20 Syllabus**: Focus on the high-impact competencies that actually get you hired.
- ⚡ **MVC Profiling (Minimum Viable Competencies)**: Identify the exact 4-5 skills needed for interview readiness.
- 📅 **Time-to-Ready Countdown**: Predicts your "Ready Date" based on pace and skill complexity.
- 🏢 **Company-Type Calibration**: Tailor your trajectory for Startups, Scale-ups, or Big Tech.

---

## 🛠️ Technology Stack

| Category | Tech Stack |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Animations** | Framer Motion, GSAP |
| **Visuals** | Three.js, React Three Fiber |
| **Backend** | Firebase (Real-time Orchestration & Auth) |
| **AI Engine** | Gemini API (`gemini-2.0-flash` / `gemini-2.5-flash`) |
| **Scrolling** | Lenis (Cinematic Smooth Scroll) |

---

## 🎨 Design Philosophy: "Cinematic Engineering"
SkillPath is built to feel like a premium tool for elite talent. Every interaction—from the navigation spotlight to the staggered history list—is designed to provide satisfying, tactile feedback. 

- **Glassmorphism**: Subtle blurs, border-glows, and deep-space color palettes.
- **Typography**: Inter (Technical Precision) & Irish Grover.

---

## 🧠 Backend Architecture: "The Deterministic Delta"
SkillPath uses a **Hybrid Analysis Pipeline** to ensure instant core analysis with creative synthesis:

1. **MVC Data Model**: Curated dataset of 70+ role categories with weighted skills.
2. **Deterministic Pipeline**: Local extraction and scoring via `pdf2json` and regex-based synthesis.
3. **AI Synthesis**: Strategic use of Gemini for contextual resource generation and semantic reasoning.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Firebase Account
- Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shauryap9006/Skillpath.git
   cd Skillpath
   ```

2. **Install Dependencies**
   ```bash
   # Root dependencies (ML & Tools)
   pip install -r scripts/requirements-ml.txt

   # Application dependencies
   cd skillpath
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` in the `skillpath` directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   GEMINI_API_KEY=...
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
├── skillpath/              # Main Next.js Application
│   ├── app/                # App Router (Pages & API)
│   ├── components/         # UI Components
│   ├── context/            # Auth & Global State
│   └── lib/                # Shared Utilities & Datasets
├── scripts/                # Model Training & Evaluation Scripts
└── README.md               # Documentation
```

---

