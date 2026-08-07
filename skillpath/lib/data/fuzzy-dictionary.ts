// updated
/**
 * Expert Fuzzy Dictionary for SkillPath
 * Master map of technical aliases, abbreviations, and common typos.
 */

export const TECH_ALIASES: Record<string, string> = {
  // Languages
  "js": "JavaScript",
  "ts": "TypeScript",
  "py": "Python",
  "rb": "Ruby",
  "cpp": "C++",
  "csharp": "C#",
  "golang": "Go",
  "pyton": "Python",
  "javscript": "JavaScript",
  "jscript": "JavaScript",

  // Frameworks
  "reactjs": "React",
  "nextjs": "Next.js",
  "vuejs": "Vue.js",
  "angularjs": "Angular",
  "tailwindcss": "Tailwind CSS",
  "tailwind": "Tailwind CSS",
  "expressjs": "Express",
  "nodejs": "Node.js",
  "node": "Node.js",

  // Cloud & DevOps
  "k8s": "Kubernetes",
  "dockerize": "Docker",
  "kube": "Kubernetes",
  "aws-cloud": "AWS",
  "gcp-cloud": "GCP",
  "azure-cloud": "Azure",
  "terraform-infra": "Terraform",

  // Roles & Concepts
  "hackear": "Hacker",
  "growth-hackear": "Growth Hacker",
  "ml": "Machine Learning",
  "ai": "Artificial Intelligence",
  "dl": "Deep Learning",
  "fullstack": "Full Stack",
  "frontend": "Front End",
  "backend": "Back End",
  "ui/ux": "UI/UX Design",
  "ux": "UX Design",
  "ui": "UI Design"
};

/**
 * Common typo patterns to catch programmatically
 */
export const TYPO_PATTERNS = [
  { pattern: /react\.?js/i, replacement: "React" },
  { pattern: /next\.?js/i, replacement: "Next.js" },
  { pattern: /node\.?js/i, replacement: "Node.js" },
  { pattern: /vue\.?js/i, replacement: "Vue.js" }
];
