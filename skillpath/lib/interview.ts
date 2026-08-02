export type InterviewQuestionType =
  | 'technical'
  | 'coding'
  | 'system_design'
  | 'behavioral'
  | 'role_specific';

export type InterviewAnswerMode = 'text' | 'code';

export interface InterviewQuestion {
  id: string;
  type: InterviewQuestionType;
  label: string;
  prompt: string;
  focus: string;
  answerMode: InterviewAnswerMode;
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
  followUp: string | null;
  source?: 'gemini' | 'deterministic_fallback';
}

export interface SavedInterviewQuestion {
  question: InterviewQuestion;
  answer: string;
  feedback: InterviewFeedback;
}

export interface SavedInterviewSession {
  id: string;
  role: string;
  experience: string;
  questionTypes: InterviewQuestionType[];
  questionCount: number;
  completedAt: string;
  averageScore: number;
  questions: SavedInterviewQuestion[];
}

export const INTERVIEW_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'ML Engineer',
  'Product Manager',
] as const;

export const INTERVIEW_LEVELS = [
  { value: 'Junior', description: '0–2 years · fundamentals and execution' },
  { value: 'Mid-level', description: '2–5 years · ownership and tradeoffs' },
  { value: 'Senior', description: '5–8 years · ambiguity and influence' },
  { value: 'Lead / Staff', description: '8+ years · strategy and systems thinking' },
] as const;

export const INTERVIEW_QUESTION_TYPES: Array<{
  value: InterviewQuestionType;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'technical', label: 'Technical', description: 'Core concepts and debugging', icon: '⚙' },
  { value: 'coding', label: 'Coding test', description: 'Solve and explain a problem', icon: '</>' },
  { value: 'system_design', label: 'System design', description: 'Architecture and tradeoffs', icon: '⌘' },
  { value: 'behavioral', label: 'Behavioral', description: 'Stories, judgment, and ownership', icon: '✦' },
  { value: 'role_specific', label: 'Role-specific', description: 'Questions tuned to your target role', icon: '◎' },
];

const QUESTION_BANK: Record<InterviewQuestionType, Array<{ prompt: string; focus: string; answerMode: InterviewAnswerMode }>> = {
  technical: [
    { prompt: 'Explain a technical concept that is important for a {role} to a teammate who is new to it.', focus: 'clarity, correctness, and a concrete example', answerMode: 'text' },
    { prompt: 'Tell me how you would debug a production issue where a {role} service suddenly became slow.', focus: 'structured diagnosis, observability, and prioritization', answerMode: 'text' },
    { prompt: 'What is a technical tradeoff you made recently, and what would make you choose the opposite option?', focus: 'judgment, constraints, and tradeoff awareness', answerMode: 'text' },
    { prompt: 'How do you decide whether a piece of work is ready to ship as a {role}?', focus: 'quality bar, testing, and risk management', answerMode: 'text' },
  ],
  coding: [
    { prompt: 'Write a function that returns the first non-repeating character in a string. Explain the time and space complexity and the edge cases you would test.', focus: 'correctness, complexity, and communication', answerMode: 'code' },
    { prompt: 'Given a list of intervals, merge all overlapping intervals. Write the solution and explain why your approach works.', focus: 'algorithm choice, edge cases, and complexity', answerMode: 'code' },
    { prompt: 'Design a small function that retries an operation with exponential backoff. Include a limit and explain failure handling.', focus: 'implementation quality, failure modes, and maintainability', answerMode: 'code' },
    { prompt: 'You receive a stream of events and need to remove duplicates within a time window. Sketch the code or pseudocode and explain your data structure.', focus: 'data structures, constraints, and scalability', answerMode: 'code' },
  ],
  system_design: [
    { prompt: 'Design a notification system for a product with one million users. Start with requirements, then describe the architecture and the tradeoffs.', focus: 'requirements, components, scale, and tradeoffs', answerMode: 'text' },
    { prompt: 'Design an API that lets users upload and process large files asynchronously. What happens when parts of the system fail?', focus: 'boundaries, queues, retries, and observability', answerMode: 'text' },
    { prompt: 'Design a feed or search experience for a growing product. Explain how you would keep latency predictable as usage increases.', focus: 'data access, caching, scale, and latency', answerMode: 'text' },
    { prompt: 'A team needs to move from a monolith to services. How would you choose the first boundary and manage the migration?', focus: 'sequencing, risk, ownership, and incremental delivery', answerMode: 'text' },
  ],
  behavioral: [
    { prompt: 'Tell me about a time you disagreed with a technical or product decision. What did you do and what happened?', focus: 'context, communication, ownership, and reflection', answerMode: 'text' },
    { prompt: 'Tell me about a project that went off track. How did you respond?', focus: 'judgment, adaptation, and measurable outcome', answerMode: 'text' },
    { prompt: 'Describe a time you had to make progress with incomplete information.', focus: 'decision-making, assumptions, and risk management', answerMode: 'text' },
    { prompt: 'Tell me about a time you improved a process or helped another person become more effective.', focus: 'impact, influence, and evidence', answerMode: 'text' },
  ],
  role_specific: [
    { prompt: 'What would you focus on in your first 30 days as a {role}, and how would you know you were making progress?', focus: 'role understanding, prioritization, and outcomes', answerMode: 'text' },
    { prompt: 'What separates a good {role} from an exceptional one at the {level} level?', focus: 'role judgment, scope, and self-awareness', answerMode: 'text' },
    { prompt: 'Walk me through a piece of work that best represents your readiness for a {role} position.', focus: 'relevance, ownership, and evidence', answerMode: 'text' },
    { prompt: 'What is the hardest problem you expect to face in a {role} role, and how would you approach it?', focus: 'anticipation, problem framing, and execution', answerMode: 'text' },
  ],
};

function interpolate(value: string, role: string, level: string) {
  return value.replaceAll('{role}', role).replaceAll('{level}', level.toLowerCase());
}

export function buildInterviewQuestions(
  role: string,
  experience: string,
  selectedTypes: InterviewQuestionType[],
  questionCount: number,
): InterviewQuestion[] {
  const types: InterviewQuestionType[] = selectedTypes.length > 0 ? selectedTypes : ['technical'];
  const questions: InterviewQuestion[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const type = types[index % types.length];
    const bank = QUESTION_BANK[type];
    const template = bank[Math.floor(index / types.length) % bank.length];
    questions.push({
      id: `q-${index + 1}-${type}`,
      type,
      label: INTERVIEW_QUESTION_TYPES.find((item) => item.value === type)?.label || 'Interview question',
      prompt: interpolate(template.prompt, role, experience),
      focus: template.focus,
      answerMode: template.answerMode,
    });
  }

  return questions;
}

export function fallbackFollowUp(question: InterviewQuestion) {
  const followUps: Record<InterviewQuestionType, string> = {
    technical: 'Can you give me a concrete example and explain how you would verify that your approach worked?',
    coding: 'What edge case would break your first solution, and how would you change it?',
    system_design: 'Which part of your design would become the bottleneck first, and how would you know?',
    behavioral: 'What was your specific contribution, and what would you do differently next time?',
    role_specific: 'What evidence from your past work supports that approach?',
  };
  return followUps[question.type];
}

export function fallbackFeedback(question: InterviewQuestion, answer: string): InterviewFeedback {
  const normalized = answer.trim().toLowerCase();
  const wordCount = normalized ? normalized.split(/\s+/).length : 0;
  const signals: Record<InterviewQuestionType, string[]> = {
    technical: ['example', 'test', 'monitor', 'tradeoff', 'debug', 'because'],
    coding: ['return', 'complexity', 'edge', 'loop', 'map', 'sort', 'null', 'o(n)'],
    system_design: ['requirement', 'scale', 'queue', 'cache', 'database', 'retry', 'monitor', 'tradeoff'],
    behavioral: ['situation', 'action', 'result', 'learned', 'impact', 'team', 'metric'],
    role_specific: ['example', 'impact', 'prioritize', 'measure', 'stakeholder', 'tradeoff'],
  };
  const matchedSignals = signals[question.type].filter((signal) => normalized.includes(signal));
  const score = Math.max(2, Math.min(9, 3 + Math.min(3, Math.floor(wordCount / 45)) + Math.min(3, matchedSignals.length)));

  return {
    score,
    strengths: wordCount >= 30
      ? ['You gave enough detail to evaluate your thinking.']
      : ['You answered directly and created a starting point for the discussion.'],
    improvements: [
      matchedSignals.length < 2 ? `Make the ${question.focus} more explicit.` : 'Tie the answer to a concrete outcome or decision.',
      wordCount < 45 ? 'Add a specific example, constraint, or measurable result.' : 'Finish with the result and what you learned.',
    ],
    idealAnswer: `A stronger answer would be structured around ${question.focus}. Start with the context, explain your decision or approach, name the tradeoff, and close with the result or how you would validate it.`,
    followUp: score < 7 ? fallbackFollowUp(question) : null,
    source: 'deterministic_fallback',
  };
}
