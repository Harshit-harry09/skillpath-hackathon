import type { ContactInfo } from '@/types/analysis';

/**
 * Extracts candidate contact information and web handles deterministically from resume text.
 */
export function extractContactInfo(resumeText: string): ContactInfo {
  if (!resumeText || !resumeText.trim()) {
    return {
      name: null,
      email: null,
      phone: null,
      location: null,
      linkedin_url: null,
      github_url: null,
      portfolio_url: null,
    };
  }

  // 1. Email Extraction
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  // 2. Phone Extraction (Supports US/International formats, e.g. +1 555-123-4567, (555) 123-4567, +91 9876543210)
  const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // 3. LinkedIn URL
  const linkedinMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin_url = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : null;

  // 4. GitHub URL
  const githubMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const github_url = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : null;

  // 5. Portfolio / Website URL (excluding github/linkedin/common email providers)
  const urlMatches = resumeText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|io|dev|me|net|org|co)(?:\/[^\s,)]*)?/gi) || [];
  let portfolio_url: string | null = null;
  for (const url of urlMatches) {
    const lower = url.toLowerCase();
    if (!lower.includes('linkedin.com') && !lower.includes('github.com') && !lower.includes('gmail.com') && !lower.includes('yahoo.com') && !lower.includes('hotmail.com') && !lower.includes('outlook.com')) {
      portfolio_url = url.startsWith('http') ? url : `https://${url}`;
      break;
    }
  }

  // 6. Location Extraction (City, State / Country heuristics)
  const locationMatch = resumeText.match(/\b([A-Z][a-zA-B\s]{2,15}),\s*([A-Z]{2}|[A-Z][a-z]{2,15})\b/);
  const location = locationMatch ? locationMatch[0] : null;

  // 7. Candidate Name Extraction (First 3 lines heuristic: capital words without digits/symbols/email)
  const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
  let name: string | null = null;

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.match(/\d/) &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('page')
    ) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z'-]+$/.test(w))) {
        name = line;
        break;
      }
    }
  }

  return {
    name,
    email,
    phone,
    location,
    linkedin_url,
    github_url,
    portfolio_url,
  };
}
