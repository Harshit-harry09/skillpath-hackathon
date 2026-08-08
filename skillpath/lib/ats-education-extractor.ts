import type { CertificationItem, EducationItem } from '@/types/analysis';

const DEGREE_PATTERNS = [
  { key: 'Ph.D.', pattern: /\b(Ph\.?D\.?|Doctor of Philosophy|Doctorate)\b/i },
  { key: 'Master’s Degree (M.S. / M.Tech / MBA)', pattern: /\b(M\.?S\.?|M\.?T\.?ech|Master|MBA|M\.?A\.?|M\.?C\.?A\.?)\b/i },
  { key: 'Bachelor’s Degree (B.S. / B.Tech / B.E.)', pattern: /\b(B\.?S\.?|B\.?T\.?ech|Bachelor|B\.?E\.?|B\.?A\.?|B\.?C\.?A\.?|B\.?B\.?A\.?)\b/i },
  { key: 'Associate’s Degree', pattern: /\b(Associate|A\.?S\.?|A\.?A\.?)\b/i },
];

const CERT_PROVIDERS = [
  'AWS', 'Amazon Web Services',
  'Google Cloud', 'GCP',
  'Microsoft', 'Azure',
  'Cisco', 'CCNA', 'CCNP',
  'PMP', 'PMI',
  'Kubernetes', 'CKA', 'CKAD',
  'CompTIA', 'Security+', 'Network+',
  'Oracle', 'Scrum Alliance', 'CSM',
  'HashiCorp', 'Terraform',
  'Databricks', 'Snowflake',
];

/**
 * Deterministically extracts education, degrees, graduation years, and industry certifications.
 */
export function extractEducationAndCerts(resumeText: string): {
  education_info: EducationItem[];
  certifications: CertificationItem[];
} {
  if (!resumeText || !resumeText.trim()) {
    return { education_info: [], certifications: [] };
  }

  const education_info: EducationItem[] = [];
  const certifications: CertificationItem[] = [];

  // Extract Degrees
  for (const item of DEGREE_PATTERNS) {
    if (item.pattern.test(resumeText)) {
      // Find graduation year near the degree
      const gradYearMatch = resumeText.match(/\b(19[89]\d|20[0-2]\d)\b/);
      const grad_year = gradYearMatch ? parseInt(gradYearMatch[0], 10) : null;

      // Major / Field of study heuristic
      let field_of_study = 'Computer Science / Engineering';
      if (/computer science|cs\b/i.test(resumeText)) field_of_study = 'Computer Science';
      else if (/information technology|it\b/i.test(resumeText)) field_of_study = 'Information Technology';
      else if (/electrical|electronics/i.test(resumeText)) field_of_study = 'Electrical Engineering';
      else if (/data science|analytics/i.test(resumeText)) field_of_study = 'Data Science';
      else if (/business|management|finance/i.test(resumeText)) field_of_study = 'Business Administration';

      // University / Institution heuristic
      const uniMatch = resumeText.match(/\b([A-Z][a-zA-Z\s]{2,25}(?:University|College|Institute|Polytechnic|IIT|NIT|MIT|Stanford|Harvard|UC|State))\b/i);
      const institution = uniMatch ? uniMatch[0].trim() : 'Accredited Institution';

      education_info.push({
        degree: item.key,
        field_of_study,
        institution,
        grad_year,
      });

      // Break after primary highest degree found to avoid duplicates
      break;
    }
  }

  // Extract Certifications
  const certLines = resumeText.split('\n').map((l) => l.trim()).filter((l) => l.length > 3);
  for (const line of certLines) {
    const isCertSection = /certification|certifications|certified|licenses/i.test(line);
    const hasProvider = CERT_PROVIDERS.some((p) => new RegExp(`\\b${p}\\b`, 'i').test(line));

    if (isCertSection || hasProvider) {
      // Extract specific provider name
      const foundProvider = CERT_PROVIDERS.find((p) => new RegExp(`\\b${p}\\b`, 'i').test(line)) || 'Industry Provider';
      const yearMatch = line.match(/\b(20[0-2]\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

      const certName = line.replace(/certifications?:?/i, '').trim();

      if (certName.length > 3 && certName.length < 80 && !certifications.some((c) => c.name.toLowerCase() === certName.toLowerCase())) {
        certifications.push({
          name: certName,
          issuer: foundProvider,
          year,
          validity_status: year && new Date().getFullYear() - year > 3 ? 'expired' : 'valid',
        });
      }
    }
  }

  return { education_info, certifications };
}
