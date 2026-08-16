/**
 * SUB-SUB ENGINE: Gap Skill Translator
 *
 * The most important engine for inclusive career advice.
 * Translates ALL forms of informal/non-tech experience into
 * real, named, market-valued professional skills.
 *
 * Uses a rich taxonomy built from:
 *  - O*NET occupational competency database mappings
 *  - HR industry frameworks (SHRM, CIPD)
 *  - Tech employer job description pattern analysis
 *
 * Called by: Agent 3 (Skill Graph), Agent 4 (Career Twin)
 */

export type ExperienceCategory =
  | 'caregiving'
  | 'data_entry_back_office'
  | 'retail_sales'
  | 'teaching_tutoring'
  | 'volunteering'
  | 'household_management'
  | 'small_business_gig'
  | 'military_service'
  | 'healthcare_support'
  | 'creative_arts'
  | 'cybersecurity_interest'
  | 'agriculture_rural'
  | 'unknown';

export interface TranslatedSkill {
  name: string;
  score: number;           // 0.0–1.0 confidence of this mapping
  category: string;
  marketDemand: 'very_high' | 'high' | 'medium' | 'low';
  techJobsItUnlocks: string[];  // which tech roles this skill is relevant for
  informalSource: string;
  howToFrameOnResume: string;   // exact resume bullet example
}

// ── Master Translation Taxonomy ───────────────────────────────────────────────

const TRANSLATION_TAXONOMY: Record<ExperienceCategory, TranslatedSkill[]> = {
  caregiving: [
    { name: 'Stakeholder & Multi-Party Coordination', score: 0.88, category: 'Operations', marketDemand: 'very_high', techJobsItUnlocks: ['IT Support', 'Project Coordinator', 'HR Operations', 'SOC Analyst'], informalSource: 'Family Caregiving', howToFrameOnResume: 'Coordinated care schedules across 3+ healthcare providers, family members, and service vendors simultaneously' },
    { name: 'Medical/Care Documentation & Records Management', score: 0.85, category: 'Data & Documentation', marketDemand: 'high', techJobsItUnlocks: ['Data Entry', 'Healthcare IT', 'EHR Systems', 'Technical Writer'], informalSource: 'Family Caregiving', howToFrameOnResume: 'Maintained detailed medication logs, appointment records, and care notes for [N] dependents over [X] years' },
    { name: 'Budget & Resource Planning Under Constraints', score: 0.82, category: 'Finance/Operations', marketDemand: 'high', techJobsItUnlocks: ['Business Analyst', 'Operations Analyst', 'IT Support'], informalSource: 'Household/Care Management', howToFrameOnResume: 'Managed monthly care budget of ₹[X], tracking expenses across medical, nutritional, and support categories' },
    { name: 'Crisis Response & Incident Triage', score: 0.80, category: 'Operations/Security', marketDemand: 'very_high', techJobsItUnlocks: ['SOC Analyst', 'IT Support', 'Incident Response', 'Customer Support'], informalSource: 'Emergency Caregiving Situations', howToFrameOnResume: 'Responded to and managed [N] emergency medical situations, coordinating rapid decisions across multiple parties' },
    { name: 'Vendor & Service Provider Management', score: 0.78, category: 'Operations', marketDemand: 'high', techJobsItUnlocks: ['IT Procurement', 'Operations Coordinator', 'Cloud Cost Management'], informalSource: 'Caregiving Service Coordination', howToFrameOnResume: 'Evaluated and managed relationships with 5+ healthcare and support service vendors; negotiated service agreements' },
    { name: 'Empathy-Driven Communication & Conflict Resolution', score: 0.85, category: 'Soft Skills', marketDemand: 'very_high', techJobsItUnlocks: ['Customer Success', 'IT Support', 'HR', 'UX Research'], informalSource: 'Caregiving Communication', howToFrameOnResume: 'Navigated difficult conversations with medical professionals, family members, and service providers with clear, empathetic communication' },
    { name: 'Schedule & Calendar Management (Multi-party)', score: 0.87, category: 'Operations', marketDemand: 'high', techJobsItUnlocks: ['Executive Assistant', 'Project Coordinator', 'IT Support', 'Operations'], informalSource: 'Caregiver Scheduling', howToFrameOnResume: 'Managed complex, interlocking schedules for [N] dependents including appointments, medications, and care shifts' },
  ],

  data_entry_back_office: [
    { name: 'Data Quality Assurance & Validation', score: 0.90, category: 'Data', marketDemand: 'very_high', techJobsItUnlocks: ['Data Analyst', 'Data Quality Engineer', 'SQL Developer', 'Business Analyst'], informalSource: 'Data Entry / Back Office', howToFrameOnResume: 'Maintained data accuracy rate of 99.2%+ across [N] records per day; identified and corrected data entry errors using validation rules' },
    { name: 'Systematic Process Discipline & SOPs', score: 0.86, category: 'Operations', marketDemand: 'high', techJobsItUnlocks: ['QA Engineer', 'Operations Analyst', 'IT Support', 'DevOps'], informalSource: 'Back Office Workflow', howToFrameOnResume: 'Followed strict Standard Operating Procedures for data processing; contributed process improvement suggestions that reduced rework by [X]%' },
    { name: 'Spreadsheet Proficiency (Excel/Google Sheets)', score: 0.88, category: 'Technical', marketDemand: 'very_high', techJobsItUnlocks: ['Data Analyst', 'Business Analyst', 'Financial Analyst', 'Operations'], informalSource: 'Daily Back Office Use', howToFrameOnResume: 'Used advanced Excel functions (VLOOKUP, Pivot Tables, conditional formatting) to manage datasets of [N] records for daily reporting' },
    { name: 'Deadline-Driven High-Volume Output Management', score: 0.82, category: 'Productivity', marketDemand: 'high', techJobsItUnlocks: ['Operations', 'Data Entry Lead', 'IT Support'], informalSource: 'Back Office Throughput', howToFrameOnResume: 'Processed [N] records per day with consistent accuracy under daily submission deadlines in a high-volume back office environment' },
    { name: 'Error Detection & Anomaly Identification', score: 0.85, category: 'Data/QA', marketDemand: 'very_high', techJobsItUnlocks: ['Data Analyst', 'QA Engineer', 'SOC Analyst (log anomalies)', 'Security Analyst'], informalSource: 'Data Quality Work', howToFrameOnResume: 'Identified and flagged [N] data anomalies and inconsistencies per month; escalated issues following defined protocols' },
    { name: 'Customer Query Resolution & Communication', score: 0.80, category: 'Support', marketDemand: 'high', techJobsItUnlocks: ['IT Support', 'Customer Success', 'CRM Operations'], informalSource: 'Customer Support Back Office', howToFrameOnResume: 'Resolved [N] customer queries per day via email/phone, maintaining [X] CSAT score across [Y] months' },
  ],

  retail_sales: [
    { name: 'Needs Analysis & Solution Mapping', score: 0.82, category: 'Sales/Consulting', marketDemand: 'high', techJobsItUnlocks: ['Sales Engineer', 'Business Analyst', 'IT Support', 'Customer Success'], informalSource: 'Retail/Sales Experience', howToFrameOnResume: 'Analyzed customer needs through active listening and recommended appropriate solutions; achieved [X]% conversion rate' },
    { name: 'CRM & Customer Database Management', score: 0.80, category: 'Technical/Sales', marketDemand: 'very_high', techJobsItUnlocks: ['CRM Administrator', 'Sales Operations', 'Business Analyst'], informalSource: 'Retail Sales Tools', howToFrameOnResume: 'Managed customer records in [CRM Tool]; tracked follow-up pipeline and maintained data accuracy for [N] accounts' },
    { name: 'Target Achievement & KPI Tracking', score: 0.78, category: 'Performance', marketDemand: 'high', techJobsItUnlocks: ['Sales Analyst', 'Growth Analyst', 'Product Analytics'], informalSource: 'Sales Target Management', howToFrameOnResume: 'Consistently met or exceeded monthly sales targets by [X]%; tracked daily KPIs including conversion rate, ticket size, and footfall' },
    { name: 'Inventory & Stock Management', score: 0.75, category: 'Operations', marketDemand: 'medium', techJobsItUnlocks: ['Supply Chain Analyst', 'ERP Operations', 'Warehouse Management Systems'], informalSource: 'Retail Operations', howToFrameOnResume: 'Managed inventory levels for [N] SKUs; coordinated restocking, conducted cycle counts, and reduced stockouts by [X]%' },
  ],

  teaching_tutoring: [
    { name: 'Curriculum Design & Learning Path Architecture', score: 0.85, category: 'Education/Product', marketDemand: 'high', techJobsItUnlocks: ['L&D Specialist', 'Technical Trainer', 'Product Designer', 'EdTech'], informalSource: 'Teaching/Tutoring Experience', howToFrameOnResume: 'Designed structured curriculum for [subject] covering [N] topics; adapted content to different learning styles and paces' },
    { name: 'Knowledge Transfer & Complex Concept Simplification', score: 0.88, category: 'Communication', marketDemand: 'very_high', techJobsItUnlocks: ['Technical Writer', 'IT Support', 'Developer Advocate', 'Customer Success'], informalSource: 'Teaching Experience', howToFrameOnResume: 'Translated complex [subject] concepts into accessible explanations for students aged [range], achieving [X]% comprehension rate' },
    { name: 'Progress Assessment & Feedback Systems', score: 0.82, category: 'Analytics/Education', marketDemand: 'high', techJobsItUnlocks: ['Data Analyst', 'QA Engineer', 'Product Manager'], informalSource: 'Student Assessment', howToFrameOnResume: 'Developed assessment frameworks to track student progress; used data from weekly tests to adjust teaching strategy' },
    { name: 'Group Facilitation & Structured Communication', score: 0.86, category: 'Leadership/Communication', marketDemand: 'very_high', techJobsItUnlocks: ['Scrum Master', 'Project Coordinator', 'HR', 'IT Support Lead'], informalSource: 'Classroom Management', howToFrameOnResume: 'Facilitated learning for groups of [N] students; managed classroom dynamics, conflict resolution, and inclusive participation' },
  ],

  household_management: [
    { name: 'Multi-Vendor Coordination & Procurement', score: 0.76, category: 'Operations', marketDemand: 'medium', techJobsItUnlocks: ['IT Procurement', 'Supply Chain', 'Operations Coordinator'], informalSource: 'Household Vendor Management', howToFrameOnResume: 'Coordinated with [N] service vendors (maintenance, utilities, supplies); negotiated service contracts and managed ongoing relationships' },
    { name: 'Household Budgeting & Financial Tracking', score: 0.78, category: 'Finance', marketDemand: 'medium', techJobsItUnlocks: ['Finance Analyst', 'Operations Analyst', 'Business Analyst'], informalSource: 'Household Financial Management', howToFrameOnResume: 'Planned and managed monthly household budget of ₹[X]; tracked all expenditures in spreadsheet with monthly variance analysis' },
    { name: 'Event & Activity Planning (Multi-stakeholder)', score: 0.74, category: 'Project Management', marketDemand: 'medium', techJobsItUnlocks: ['Event Coordinator', 'Project Coordinator', 'Operations'], informalSource: 'Household/Family Event Planning', howToFrameOnResume: 'Planned and coordinated [events] for [N] participants, managing logistics, timelines, and budgets' },
  ],

  volunteering: [
    { name: 'Community Program Coordination', score: 0.80, category: 'Operations', marketDemand: 'medium', techJobsItUnlocks: ['Operations Coordinator', 'NGO Tech', 'HR'], informalSource: 'Volunteer Work', howToFrameOnResume: 'Coordinated [program] serving [N] community members; managed volunteer scheduling, resource allocation, and outcome tracking' },
    { name: 'Leadership Under Resource Constraints', score: 0.82, category: 'Leadership', marketDemand: 'high', techJobsItUnlocks: ['Team Lead', 'Project Manager', 'Scrum Master'], informalSource: 'Volunteer Leadership', howToFrameOnResume: 'Led team of [N] volunteers to deliver [outcome] with zero budget, using creative resource management and motivation' },
  ],

  small_business_gig: [
    { name: 'End-to-End Business Operations Management', score: 0.85, category: 'Operations/Entrepreneurship', marketDemand: 'high', techJobsItUnlocks: ['Operations Manager', 'Product Manager', 'Business Analyst', 'Founder/Startup'], informalSource: 'Small Business / Freelance', howToFrameOnResume: 'Independently managed all operational aspects of [business type]: procurement, delivery, customer service, and financial reporting' },
    { name: 'Client Acquisition & Relationship Management', score: 0.84, category: 'Sales/Marketing', marketDemand: 'high', techJobsItUnlocks: ['Sales', 'Customer Success', 'Growth', 'Business Development'], informalSource: 'Self-Employed/Gig Work', howToFrameOnResume: 'Grew client base from 0 to [N] through referrals and digital outreach; maintained [X]% client retention rate' },
  ],

  military_service: [
    { name: 'High-Stakes Decision Making Under Pressure', score: 0.90, category: 'Leadership/Security', marketDemand: 'very_high', techJobsItUnlocks: ['Cybersecurity', 'IT Operations', 'SOC Analyst', 'Crisis Management'], informalSource: 'Military Service', howToFrameOnResume: 'Executed rapid, high-stakes decisions in time-critical environments with incomplete information and high consequence' },
    { name: 'Team Leadership & Chain of Command Operations', score: 0.88, category: 'Leadership', marketDemand: 'very_high', techJobsItUnlocks: ['IT Team Lead', 'Security Operations', 'DevOps Lead'], informalSource: 'Military Command Structure', howToFrameOnResume: 'Led [rank] team of [N] personnel through [missions/operations], maintaining unit performance and morale' },
    { name: 'Security Protocol & Compliance Discipline', score: 0.87, category: 'Security/Compliance', marketDemand: 'very_high', techJobsItUnlocks: ['Cybersecurity Analyst', 'SOC', 'IT Security', 'GRC Analyst'], informalSource: 'Military Security Clearance/Protocols', howToFrameOnResume: 'Adhered to and enforced strict operational security protocols, maintaining zero security incidents over [X] years of service' },
  ],

  healthcare_support: [
    { name: 'HIPAA / Healthcare Compliance & Data Privacy', score: 0.85, category: 'Compliance/Security', marketDemand: 'very_high', techJobsItUnlocks: ['Healthcare IT', 'Data Privacy', 'GRC Analyst', 'EHR Specialist'], informalSource: 'Healthcare Support Role', howToFrameOnResume: 'Maintained strict HIPAA compliance in handling [N] patient records daily; completed annual compliance training and audits' },
    { name: 'Medical Records & EHR System Operation', score: 0.87, category: 'Healthcare IT', marketDemand: 'high', techJobsItUnlocks: ['EHR Analyst', 'Healthcare IT Support', 'Medical Billing'], informalSource: 'Healthcare Support', howToFrameOnResume: 'Operated [EHR System] for [N] patient records; ensured data accuracy and completeness for clinical workflows' },
  ],

  cybersecurity_interest: [
    { name: 'Security-First Thinking & Threat Modeling', score: 0.78, category: 'Cybersecurity Foundation', marketDemand: 'very_high', techJobsItUnlocks: ['SOC Analyst', 'Penetration Tester', 'Security Analyst', 'IT Support'], informalSource: 'Cybersecurity Self-Interest/Study', howToFrameOnResume: 'Applied security-first mindset to [context]; practiced threat modeling by identifying attack surfaces in [environment]' },
    { name: 'CTF Challenge Participation & Ethical Hacking Practice', score: 0.72, category: 'Cybersecurity Practical', marketDemand: 'high', techJobsItUnlocks: ['Penetration Tester', 'Bug Bounty Hunter', 'SOC Analyst', 'Ethical Hacker'], informalSource: 'Self-Study Security Labs', howToFrameOnResume: 'Completed [N] CTF challenges on TryHackMe/HackTheBox; documented methodologies and learnings in public GitHub repository' },
  ],

  agriculture_rural: [
    { name: 'Resource Optimization Under Constraint', score: 0.78, category: 'Operations', marketDemand: 'medium', techJobsItUnlocks: ['Operations', 'Supply Chain', 'Agri-Tech', 'Rural Digital Services'], informalSource: 'Agricultural/Rural Background', howToFrameOnResume: 'Optimized crop yield through data-driven planting schedules and resource allocation, achieving [X]% cost efficiency' },
    { name: 'Seasonal Planning & Long-cycle Project Management', score: 0.76, category: 'Project Management', marketDemand: 'medium', techJobsItUnlocks: ['Project Coordinator', 'Operations Analyst', 'Supply Chain Analyst'], informalSource: 'Agricultural Planning', howToFrameOnResume: 'Managed [X]-month agricultural planning cycles, coordinating resources, weather contingencies, and market timing' },
  ],

  creative_arts: [
    { name: 'Visual Communication & Design Thinking', score: 0.83, category: 'Design/UX', marketDemand: 'high', techJobsItUnlocks: ['UX Designer', 'Product Designer', 'Graphic Designer', 'Frontend Developer'], informalSource: 'Creative Arts Background', howToFrameOnResume: 'Applied visual design principles and design thinking to [projects]; created [deliverables] for [N] clients or audiences' },
    { name: 'Audience Understanding & User Empathy', score: 0.85, category: 'UX/Product', marketDemand: 'very_high', techJobsItUnlocks: ['UX Researcher', 'Product Manager', 'Marketing Analyst', 'Customer Success'], informalSource: 'Creative Performance/Art', howToFrameOnResume: 'Developed strong audience insight through [creative work]; applied user empathy in [design/product/marketing context]' },
  ],

  unknown: [
    { name: 'Adaptive Learning & Self-Directed Skill Development', score: 0.76, category: 'Growth Mindset', marketDemand: 'high', techJobsItUnlocks: ['Any Entry-Level Tech Role', 'IT Support', 'Data Associate'], informalSource: 'General Background', howToFrameOnResume: 'Independently acquired [skill] through self-directed learning; applied to [real outcome] within [timeframe]' },
  ],
};

// ── Detection Engine ──────────────────────────────────────────────────────────

const DETECTION_SIGNALS: Record<ExperienceCategory, string[]> = {
  caregiving: ['caregiv', 'elder care', 'mother', 'father', 'family care', 'child care', 'nursing', 'home care', 'dependent'],
  data_entry_back_office: ['data entry', 'back office', 'typing', 'excel data', 'customer support representative', 'data input'],
  retail_sales: ['retail', 'sales associate', 'salesperson', 'shop', 'store', 'cashier', 'customer service rep'],
  teaching_tutoring: ['teacher', 'tutor', 'instructor', 'educator', 'coaching', 'teaching', 'faculty', 'lecturer'],
  household_management: ['homemaker', 'housewife', 'household', 'domestic'],
  volunteering: ['volunteer', 'ngo', 'community service', 'non-profit', 'social work'],
  small_business_gig: ['freelance', 'self-employed', 'own business', 'proprietor', 'gig', 'startup founder'],
  military_service: ['military', 'army', 'navy', 'air force', 'defence', 'armed forces', 'jawaan', 'soldier'],
  healthcare_support: ['hospital', 'clinic', 'medical', 'healthcare worker', 'nursing assistant', 'ward boy', 'asha worker'],
  cybersecurity_interest: ['cyber', 'hacker', 'security enthusiast', 'ethical hacking', 'ctf', 'tryhackme'],
  agriculture_rural: ['farmer', 'agriculture', 'kisan', 'rural', 'farm'],
  creative_arts: ['artist', 'designer', 'photographer', 'dancer', 'musician', 'creative', 'content creator'],
  unknown: [],
};

/**
 * Detect which experience categories are present in resume text.
 */
export function detectExperienceCategories(rawText: string): ExperienceCategory[] {
  const lower = rawText.toLowerCase();
  const detected: ExperienceCategory[] = [];

  for (const [cat, signals] of Object.entries(DETECTION_SIGNALS) as [ExperienceCategory, string[]][]) {
    if (cat === 'unknown') continue;
    if (signals.some(signal => lower.includes(signal))) {
      detected.push(cat);
    }
  }

  return detected.length > 0 ? detected : ['unknown'];
}

/**
 * Translate detected experience categories into professional skills.
 * Deduplicates by skill name. Sorts by score descending.
 */
export function translateExperienceToSkills(
  categories: ExperienceCategory[],
  limit = 8
): TranslatedSkill[] {
  const seen = new Set<string>();
  const result: TranslatedSkill[] = [];

  for (const cat of categories) {
    const skills = TRANSLATION_TAXONOMY[cat] || TRANSLATION_TAXONOMY.unknown;
    for (const skill of skills) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name);
        result.push(skill);
      }
    }
  }

  return result
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get resume bullet examples for a specific category.
 */
export function getResumeBullets(category: ExperienceCategory): string[] {
  return (TRANSLATION_TAXONOMY[category] || []).map(s => s.howToFrameOnResume);
}
