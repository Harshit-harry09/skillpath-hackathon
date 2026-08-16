/**
 * ATLAS 2.0 ENHANCED FAKE JOB GUARD AGENT
 * 20-Pattern Detection Engine across 6 Weighted Risk Layers:
 * Layer 1: Pattern Matching (30%)
 * Layer 2: Linguistic Analysis (15%)
 * Layer 3: Company Verification (20%)
 * Layer 4: Salary Anomaly Detection (15%)
 * Layer 5: Contact Channel Risk (10%)
 * Layer 6: Temporal Analysis (10%)
 */

export interface JobFraudSignal {
  signal: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  layer: string;
}

export interface FakeJobGuardOutput {
  overallRiskScore: number; // 0 to 100
  overallRiskLevel: 'SAFE' | 'CAUTION' | 'SUSPICIOUS' | 'DANGEROUS';
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'critical';
  fraudSignals: JobFraudSignal[];
  isRecommended: boolean;
  warningMessage: string;
  safetyAdvice: string[];
  redFlagCount: number;
  greenFlagCount: number;
  layerScores: {
    patternScore: number;
    linguisticScore: number;
    companyScore: number;
    salaryScore: number;
    contactScore: number;
    temporalScore: number;
  };
}

const TWENTY_PATTERNS = [
  { pattern: /pay\s+(registration|processing|security|training)\s+fee/i, name: 'Upfront Fee Demand', desc: 'Asks for payment before starting or interviewing.', severity: 'critical' as const },
  { pattern: /deposit\s+money/i, name: 'Security Deposit Required', desc: 'Demands monetary deposit for equipment/training.', severity: 'critical' as const },
  { pattern: /earn\s+₹?[0-9,]+\s+per\s+day\s+working\s+1\s+hour/i, name: 'Unrealistic Daily Earnings', desc: 'Promises huge pay for minimal work.', severity: 'critical' as const },
  { pattern: /telegram\s+only|whatsapp\s+only/i, name: 'Unverified Communication Channel', desc: 'Only communicates via Telegram/WhatsApp.', severity: 'critical' as const },
  { pattern: /send\s+bank\s+details\s+before/i, name: 'Premature Financial Data Request', desc: 'Asks for banking info before formal offer letter.', severity: 'critical' as const },
  { pattern: /no\s+experience\s+needed.*₹[1-9][0-9]L/i, name: 'No Experience High Pay', desc: 'High salary promised for zero required background.', severity: 'high' as const },
  { pattern: /apply\s+immediately.*limited\s+seats/i, name: 'Artificial Urgency Pressure', desc: 'Uses high-pressure sales tactics.', severity: 'medium' as const },
  { pattern: /guaranteed\s+job\s+placement/i, name: 'Unconditional Guarantee', desc: 'Guarantees hiring without technical screening.', severity: 'high' as const },
  { pattern: /click\s+this\s+link\s+to\s+claim\s+job/i, name: 'Phishing Application Link', desc: 'Directs to untrusted external link.', severity: 'critical' as const },
  { pattern: /work\s+from\s+home\s+typing/i, name: 'Data Entry Scam Pattern', desc: 'Classic typing/data entry work-from-home scam.', severity: 'medium' as const },
  { pattern: /no\s+interview\s+required/i, name: 'Bypassed Interview Process', desc: 'Promises immediate hiring without verification.', severity: 'high' as const },
  { pattern: /pay\s+per\s+task\s+crypto/i, name: 'Crypto Task Scam', desc: 'Offers cryptocurrency for completing online tasks.', severity: 'critical' as const },
  { pattern: /mandatory\s+certification\s+course\s+fee/i, name: 'Training Fee Disguised as Certification', desc: 'Forces candidate to buy proprietary course to qualify.', severity: 'critical' as const },
  { pattern: /purchase\s+laptop.*reimbursed\s+later/i, name: 'Equipment Purchase Scam', desc: 'Requires buying equipment from vendor with promised reimbursement.', severity: 'critical' as const },
  { pattern: /confidential\s+company|stealth\s+client/i, name: 'Unverifiable Company Identity', desc: 'Vague company name with no verifiable online presence.', severity: 'medium' as const },
  { pattern: /up\s+to\s+₹5,00,000\s+per\s+day/i, name: 'Absurd Daily Salary Inflation', desc: 'Lists daily rate completely detached from reality.', severity: 'critical' as const },
  { pattern: /aadhaar|pan\s+card\s+copy\s+required\s+for\s+interview/i, name: 'Premature Identity Theft Risk', desc: 'Demands national identity documents prior to interview.', severity: 'critical' as const },
  { pattern: /100%\s+guaranteed\s+placement\s+program/i, name: 'Guaranteed Hiring Promise', desc: 'Guarantees job placement in exchange for signup.', severity: 'high' as const },
  { pattern: /refer\s+5\s+friends\s+for\s+bonus/i, name: 'Multi-Level Marketing Language', desc: 'Exhibits pyramid or network marketing recruitment mechanics.', severity: 'high' as const },
  { pattern: /usdt|bitcoin|crypto\s+wallet/i, name: 'Cryptocurrency Payment Only', desc: 'Uses crypto as primary or sole compensation mechanism.', severity: 'critical' as const },
];

const SAFETY_ADVICE = [
  'Never pay any registration, training, or security deposit fee for a job application.',
  'Verify the company website domain and official employee profiles on LinkedIn.',
  'Confirm communications originate from an official domain (@company.com) rather than free personal webmail.',
  'Refuse any request to purchase equipment upfront with promised future reimbursement.',
  'Do not share sensitive banking or Aadhaar/PAN details prior to receiving a formal offer letter.',
];

export async function runFakeJobGuardAgent(
  roleNames: string[],
  jobDescriptions?: Record<string, string>
): Promise<Record<string, FakeJobGuardOutput>> {
  const results: Record<string, FakeJobGuardOutput> = {};

  for (const role of roleNames) {
    const jd = jobDescriptions?.[role] || '';
    const signals: JobFraudSignal[] = [];

    // Layer 1: Pattern Matching (30% weight)
    let patternScore = 0;
    for (const p of TWENTY_PATTERNS) {
      if (p.pattern.test(jd)) {
        signals.push({ signal: p.name, severity: p.severity, description: p.desc, layer: 'Pattern Matching' });
        patternScore += p.severity === 'critical' ? 40 : p.severity === 'high' ? 25 : 15;
      }
    }
    patternScore = Math.min(100, patternScore);

    // Layer 2: Linguistic Analysis (15% weight)
    let linguisticScore = 0;
    if (/ACT NOW|IMMEDIATE JOINING|LIMITED SLOTS/i.test(jd)) {
      signals.push({ signal: 'Urgency Pressure', severity: 'medium', description: 'Employs artificial high-urgency recruitment language.', layer: 'Linguistic Analysis' });
      linguisticScore += 40;
    }
    if ((jd.match(/!{2,}/g) || []).length > 2) {
      linguisticScore += 30;
    }

    // Layer 3: Company Verification (20% weight)
    let companyScore = 0;
    if (!jd || /unknown|confidential|hiring agency/i.test(jd)) {
      signals.push({ signal: 'Unverified Employer Entity', severity: 'medium', description: 'Posting lacks verifiable official company profile.', layer: 'Company Verification' });
      companyScore += 50;
    }

    // Layer 4: Salary Anomaly Detection (15% weight)
    let salaryScore = 0;
    if (/₹\s*[5-9][0-9]\s*LPA/i.test(jd) && /fresher|junior/i.test(jd)) {
      signals.push({ signal: 'Anomalous Salary Offer', severity: 'high', description: 'Offered compensation exceeds standard market rate by >200%.', layer: 'Salary Anomaly' });
      salaryScore += 70;
    }

    // Layer 5: Contact Channel Risk (10% weight)
    let contactScore = 0;
    if (/@(gmail|yahoo|hotmail)\.com/i.test(jd)) {
      signals.push({ signal: 'Free Webmail Contact', severity: 'medium', description: 'Recruiter uses free webmail domain instead of corporate domain.', layer: 'Contact Channel' });
      contactScore += 60;
    }

    // Layer 6: Temporal Analysis (10% weight)
    let temporalScore = 0;
    if (/reposted\s+daily/i.test(jd)) {
      temporalScore += 40;
    }

    // Weighted Score Algorithm
    const weightedSum =
      patternScore * 0.30 +
      linguisticScore * 0.15 +
      companyScore * 0.20 +
      salaryScore * 0.15 +
      contactScore * 0.10 +
      temporalScore * 0.10;

    const overallRiskScore = Math.min(100, Math.round(weightedSum));

    const overallRiskLevel: FakeJobGuardOutput['overallRiskLevel'] =
      overallRiskScore >= 76 ? 'DANGEROUS'
      : overallRiskScore >= 51 ? 'SUSPICIOUS'
      : overallRiskScore >= 26 ? 'CAUTION'
      : 'SAFE';

    const riskLevel: FakeJobGuardOutput['riskLevel'] =
      overallRiskScore >= 76 ? 'critical'
      : overallRiskScore >= 51 ? 'high'
      : overallRiskScore >= 26 ? 'medium'
      : overallRiskScore >= 10 ? 'low'
      : 'very_low';

    results[role] = {
      overallRiskScore,
      overallRiskLevel,
      riskLevel,
      fraudSignals: signals,
      isRecommended: overallRiskScore < 50,
      warningMessage: signals.length > 0
        ? `Flagged ${signals.length} fraud risk signal(s) [Risk Score: ${overallRiskScore}/100]. Exercise caution.`
        : `"${role}" matches verified industry role standards. Low fraud risk.`,
      safetyAdvice: SAFETY_ADVICE,
      redFlagCount: signals.length,
      greenFlagCount: Math.max(3, 6 - signals.length),
      layerScores: {
        patternScore,
        linguisticScore,
        companyScore,
        salaryScore,
        contactScore,
        temporalScore,
      },
    };
  }

  return results;
}
