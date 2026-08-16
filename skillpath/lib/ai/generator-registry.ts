import { z } from "zod";

export const CoverLinesInputSchema = z.object({
  role: z.string().default("Software Engineer"),
  topSkills: z.array(z.string()).default(["TypeScript", "React", "Node.js"]),
});

export const LinkedInHeadlinesInputSchema = z.object({
  role: z.string().default("Software Engineer"),
  topSkills: z.array(z.string()).default(["TypeScript", "React", "Node.js"]),
});

export const StarBulletsInputSchema = z.object({
  skill: z.string().default("Engineering"),
  role: z.string().default("Software Engineer"),
});

export const InterviewQuestionsInputSchema = z.object({
  roleLabel: z.string().min(1, "roleLabel is required"),
  skillGaps: z.array(z.string()).optional().default([]),
  userSkills: z.array(z.string()).optional().default([]),
});

export const ResourcesInputSchema = z.object({
  analysis_id: z.string().min(1),
  skill: z.string().min(1),
  role: z.string().min(1),
  seniority: z.string().optional().default("entry"),
  company_type: z.string().min(1),
  existing_urls: z.array(z.string()).optional().default([]),
  click_count: z.number().min(0).max(3).optional().default(0),
});

export const RewriteBulletInputSchema = z.object({
  bullet: z.string().min(1),
  targetRole: z.string().default('Target Role'),
  missingSkills: z.array(z.string()).default([]),
  matchedSkills: z.array(z.string()).default([]),
});

export type GeneratorToolId =
  | "cover-lines"
  | "linkedin-headlines"
  | "star-bullets"
  | "interview-questions"
  | "resources"
  | "rewrite-bullet";

export interface ToolConfig<TInput = any, TOutput = any> {
  id: GeneratorToolId;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  systemPrompt: string;
  buildPrompt: (input: TInput) => string;
  getFallback: (input: TInput) => TOutput;
  model: string;
  temperature: number;
  maxTokens: number;
}

export const GENERATOR_REGISTRY: Record<GeneratorToolId, ToolConfig> = {
  "cover-lines": {
    id: "cover-lines",
    inputSchema: CoverLinesInputSchema,
    outputSchema: z.object({
      lines: z.array(z.string()).min(1),
    }),
    systemPrompt: `You are an expert cover letter coach. Generate punchy cover letter opening sentences.`,
    buildPrompt: (input: z.infer<typeof CoverLinesInputSchema>) => {
      const skillsStr = input.topSkills.join(", ") || "software architecture";
      return `Generate EXACTLY 3 punchy cover letter opening sentences for a candidate targeting the role "${input.role}".
Top skills: ${skillsStr}.
Rules:
- 1 sentence each (max 50 words)
- Lead with quantified impact or bold engineering capability
- Do NOT start with "I am writing" or "I am excited"`;
    },
    getFallback: (input: z.infer<typeof CoverLinesInputSchema>) => {
      const skillsStr = input.topSkills.join(", ") || "software architecture";
      return {
        lines: [
          `With extensive experience in ${skillsStr}, I specialize in building high-throughput solutions as a ${input.role}.`,
          `Having architected production systems using ${input.topSkills[0] || 'modern tech'}, I bring immediate technical velocity to your ${input.role} team.`,
          `My proven track record in ${input.topSkills.slice(0, 2).join(' and ')} positions me to drive measurable technical impact in the ${input.role} role.`,
        ],
      };
    },
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 350,
  },

  "linkedin-headlines": {
    id: "linkedin-headlines",
    inputSchema: LinkedInHeadlinesInputSchema,
    outputSchema: z.object({
      headlines: z.array(z.string()).min(1),
    }),
    systemPrompt: `You are an expert LinkedIn profile optimization coach. Generate data-driven headlines under 200 chars.`,
    buildPrompt: (input: z.infer<typeof LinkedInHeadlinesInputSchema>) => {
      const skillsStr = input.topSkills.join(", ") || "Engineering & System Design";
      return `Generate EXACTLY 3 data-driven LinkedIn headlines for a candidate targeting the role "${input.role}".
Their top skills: ${skillsStr}.
Rules:
- Under 200 characters each
- Use pipe " | " as skill separator
- End each with "Open to ${input.role} Roles"`;
    },
    getFallback: (input: z.infer<typeof LinkedInHeadlinesInputSchema>) => {
      const skillsStr = input.topSkills.join(", ") || "Engineering & System Design";
      return {
        headlines: [
          `${input.role} | ${skillsStr} | Scaling High-Throughput Systems | Open to ${input.role} Roles`,
          `Data-Driven ${input.role} | ${input.topSkills.slice(0, 3).join(' • ')} | Open to Opportunities`,
          `${input.role} Specialist | ${input.topSkills[0] || 'Architecture'} & Systems Engineering | Open to ${input.role} Roles`,
        ],
      };
    },
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 300,
  },

  "star-bullets": {
    id: "star-bullets",
    inputSchema: StarBulletsInputSchema,
    outputSchema: z.object({
      bullets: z.array(z.string()).min(1),
    }),
    systemPrompt: `You are a professional resume writer for top silicon valley engineers. Generate ATS-optimized STAR bullet points.`,
    buildPrompt: (input: z.infer<typeof StarBulletsInputSchema>) => {
      return `Target Skill: "${input.skill}"
Target Role: "${input.role}"

Generate 3 highly impact-driven STAR format resume bullet points for this skill.
Rules:
- Start with strong action verbs (e.g. "Spearheaded", "Architected", "Engineered").
- Use metric placeholders such as [X%] or [N hours] when the user has not supplied evidence. Never invent achievements.
- Keep each bullet between 15 and 25 words.`;
    },
    getFallback: (_input: z.infer<typeof StarBulletsInputSchema>) => ({
      bullets: [
        `Architected high-throughput services, reducing P99 latency by [X%] across production APIs.`,
        `Engineered robust system pipelines, improving infrastructure utilization by [X%].`,
        `Spearheaded production module deployment, eliminating downstream bottlenecks for [N] daily users.`,
      ],
    }),
    model: "gemini-3.6-flash",
    temperature: 0.3,
    maxTokens: 512,
  },

  "interview-questions": {
    id: "interview-questions",
    inputSchema: InterviewQuestionsInputSchema,
    outputSchema: z.object({
      questions: z.array(
        z.object({
          category: z.string(),
          question: z.string(),
          target_skill: z.string(),
          expected_answer_points: z.array(z.string()),
          difficulty: z.string(),
        })
      ),
    }),
    systemPrompt: `You are an executive technical interviewer preparing interview questions for a candidate.`,
    buildPrompt: (input: z.infer<typeof InterviewQuestionsInputSchema>) => {
      const gapsList = input.skillGaps.slice(0, 5).join(', ') || 'General role requirements';
      const skillsList = input.userSkills.slice(0, 5).join(', ') || 'Core candidate skills';
      return `Role: ${input.roleLabel}
Candidate Skill Gaps: ${gapsList}
Candidate Proven Skills: ${skillsList}

Generate 6 high-impact interview questions tailored specifically to test their skill gaps and verify proven experience.`;
    },
    getFallback: (input: z.infer<typeof InterviewQuestionsInputSchema>) => ({
      questions: [
        {
          category: 'technical',
          question: `How would you architect a production system utilizing ${input.skillGaps[0] || 'modern tech stack'}?`,
          target_skill: input.skillGaps[0] || 'Technical Architecture',
          expected_answer_points: ['Scalability principles', 'Error handling', 'Data persistence'],
          difficulty: 'hard',
        },
        {
          category: 'project',
          question: `Describe a recent project where you demonstrated proficiency in ${input.userSkills[0] || 'software development'}.`,
          target_skill: input.userSkills[0] || 'Project Execution',
          expected_answer_points: ['Quantified impact', 'Trade-offs made', 'Tech stack choice'],
          difficulty: 'medium',
        },
        {
          category: 'behavioral',
          question: 'How do you handle technical debt when working against tight production deadlines?',
          target_skill: 'Engineering Rigor',
          expected_answer_points: ['Communication with stakeholders', 'Refactoring strategy', 'Prioritization'],
          difficulty: 'medium',
        },
        {
          category: 'hr',
          question: `What attracts you to this ${input.roleLabel} position and how do your skills align?`,
          target_skill: 'Role Alignment',
          expected_answer_points: ['Career vision', 'Core competency fit', 'Long-term motivation'],
          difficulty: 'easy',
        },
      ],
    }),
    model: "gemini-2.5-flash",
    temperature: 0.2,
    maxTokens: 2048,
  },

  "resources": {
    id: "resources",
    inputSchema: ResourcesInputSchema,
    outputSchema: z.object({
      skill_resources: z.any(),
    }),
    systemPrompt: `You are a learning resource curator.`,
    buildPrompt: (input: z.infer<typeof ResourcesInputSchema>) => {
      return `Skill: ${input.skill}, Role: ${input.role}, Seniority: ${input.seniority}, Company: ${input.company_type}`;
    },
    getFallback: (_input: z.infer<typeof ResourcesInputSchema>) => ({
      skill_resources: {
        resources: [
          { title: "Official Documentation", url: "https://docs.example.com", type: "article" }
        ]
      }
    }),
    model: "gemini-2.5-flash",
    temperature: 0.2,
    maxTokens: 1024,
  },

  "rewrite-bullet": {
    id: "rewrite-bullet",
    inputSchema: RewriteBulletInputSchema,
    outputSchema: z.object({
      originalBullet: z.string(),
      improvedBullet: z.string(),
      addedKeywords: z.array(z.string()),
      addedMetricPrompt: z.string(),
      confidence: z.number().min(0).max(1),
    }),
    systemPrompt: `You are a precise resume editor. Rewrite one bullet without inventing achievements.`,
    buildPrompt: (input: z.infer<typeof RewriteBulletInputSchema>) => `
Target role: ${input.targetRole}
Original bullet: ${input.bullet}
Missing JD skills that may be relevant: ${input.missingSkills.join(', ') || 'none'}
Matched skills: ${input.matchedSkills.join(', ') || 'none'}
Return JSON with originalBullet, improvedBullet, addedKeywords, addedMetricPrompt, and confidence.
Use [X%] or [N] placeholders instead of making up metrics.
`,
    getFallback: (input: z.infer<typeof RewriteBulletInputSchema>) => {
      const keyword = input.missingSkills[0] || input.matchedSkills[0] || 'the target workflow';
      return {
        originalBullet: input.bullet,
        improvedBullet: `Improved ${input.bullet.replace(/^[•*-]\s*/, '').replace(/[.!?]+$/, '').toLowerCase()} using ${keyword} for ${input.targetRole}, improving [measurable outcome] by [X%].`,
        addedKeywords: input.missingSkills[0] ? [input.missingSkills[0]] : [],
        addedMetricPrompt: 'Replace [X%] with a metric you can prove.',
        confidence: 0.62,
      };
    },
    model: "gemini-2.5-flash",
    temperature: 0.2,
    maxTokens: 512,
  },
};
