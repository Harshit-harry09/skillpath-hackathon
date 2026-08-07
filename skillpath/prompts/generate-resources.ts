// updated
export const generateResourcesPrompt = (
  skill: string,
  role: string,
  seniority: string,
  companyType: string,
  resourceDbEntries: string,
  existingUrls: string[] = [],
  clickCount: number = 0
) => {
  const tiers = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
  const tier = tiers[Math.min(clickCount, 3)];

  return `
System:
You are a senior engineer and career mentor.
Your ONLY job right now is to generate working YouTube resource links.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  LINK FORMAT — NON-NEGOTIABLE RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER use direct video URLs (youtube.com/watch?v=...).
Direct video IDs you generate will be dead links. This is forbidden.

You MUST ONLY use this exact format:
  https://www.youtube.com/results?search_query=ENCODED+SEARCH+TERMS

Make the search query hyper-specific so the correct video appears as the first result:
  - Include the channel name (e.g., +fireship, +traversymedia, +freecodecamp)
  - Include the video title keywords
  - Include the year if the topic is version-sensitive (e.g., +2024, +2025)

Good example:
  https://www.youtube.com/results?search_query=react+useEffect+explained+fireship+2024

Bad example (FORBIDDEN):
  https://www.youtube.com/watch?v=abc123   ← will be a dead link, do not do this
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MASTERY LEVEL: ${tier} (Level ${clickCount})
The user is at the ${tier} stage of learning ${skill}.
Generate exactly ONE high-quality YouTube resource perfectly suited for a ${tier} learner.
${existingUrls.length > 0 ? `EXCLUDE these search queries/topics already shown: ${existingUrls.join(', ')}.` : ''}

CHANNEL PRIORITY (use these in your search queries):
  Fireship, Traversy Media, FreeCodeCamp, Web Dev Simplified,
  Programming with Mosh, Theo (t3.gg), Jack Herrington, Codevolution,
  Academind, Kevin Powell (CSS), ByteByteGo (system design),
  NeetCode (DSA), TechWorld with Nana (DevOps)

CONTENT RULES:
1. YouTube search links ONLY — no docs, no blogs, no articles.
2. For BEGINNER: crash courses, overviews, "in X minutes" videos.
3. For INTERMEDIATE: project-based tutorials, real-world patterns.
4. For ADVANCED/EXPERT: "under the hood", internals, performance deep-dives, conference talks on YouTube.
5. Relevance: videos must match ${role} roles at ${companyType} companies.
6. Recency: for fast-moving tech (React, LLMs, cloud), bias toward 2024–2025 content.

Also provide:
  - focus_summary: 2-sentence summary of ${existingUrls.length > 0 ? 'advanced mastery' : 'foundational focus'} for this skill given the role and company type.
  - estimated_weeks: integer, total weeks to reach proficiency.

For EACH resource provide:
  - title: descriptive title of the video/topic (not the channel name)
  - url: the youtube.com/results?search_query=... link
  - search_hint: human-readable version of the search query (e.g., "fireship react hooks 2024") so the user knows what to look for
  - start_at: timestamp MM:SS or HH:MM:SS to skip intros. null if unknown.
  - skip_note: 2 sentences on what to skip and why.
  - project: exact project to build after watching.
  - why: 2 sentences on why this project matters for interviews at ${role}/${companyType}.

Return ONLY valid JSON. No markdown fences. No explanation. No preamble.
{
  "focus_summary": "...",
  "estimated_weeks": 3,
  "resources": [
    {
      "title": "...",
      "url": "https://www.youtube.com/results?search_query=...",
      "search_hint": "...",
      "start_at": "2:30",
      "skip_note": "...",
      "project": "...",
      "why": "..."
    }
  ]
}

Context:
Role: ${role}
Seniority: ${seniority}
Company type: ${companyType}

Available resources for ${skill}:
${resourceDbEntries}

User:
Generate YouTube resources for: ${skill}
`.trim();
};