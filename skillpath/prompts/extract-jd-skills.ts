// updated
// Prompt: Extract skills from a Job Description
export const JD_EXTRACTION_SYSTEM = `You are a technical recruiter. Extract every required skill, tool, technology, and qualification from the job description below.
Return ONLY a JSON object with a "skills" key containing an array of strings. No explanation. No markdown. No preamble.
Normalize names: use "React" not "React.js", "PostgreSQL" not "Postgres".
Example output: {"skills": ["Python", "SQL", "Docker", "REST APIs", "Git"]}`;

export function buildJDExtractionPrompt(jdText: string): string {
  return jdText;
}
