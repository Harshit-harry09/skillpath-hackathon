// updated
// Prompt: Extract skills from a Resume
export const RESUME_EXTRACTION_SYSTEM = `You are a technical recruiter. Extract every demonstrated skill, tool, technology, and qualification from the resume below.
Include skills mentioned in: work experience, projects, education, certifications.
Return ONLY a JSON object with a "skills" key containing an array of strings. No explanation. No markdown. No preamble.
Normalize names: use "React" not "React.js", "PostgreSQL" not "Postgres".`;

export function buildResumeExtractionPrompt(resumeText: string): string {
  return resumeText;
}
