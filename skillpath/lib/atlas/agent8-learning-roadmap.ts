/**
 * ATLAS AGENT 8 — Learning Roadmap Agent
 *
 * Brain: Gemini generates a week-by-week, project-based personalized
 * learning roadmap. Not a generic course list — a strategic curriculum
 * engineered specifically for this candidate's missing skills, available
 * learning time, and target role prerequisites.
 */

import { callGeminiJSON, DEFAULT_GEMINI_MODEL } from '@/lib/gemini';
import type { AtlasRoadmapStep } from '@/types/atlas';
import type { CareerTwinOutput } from './agent4-career-twin';
import type { PathfinderOutput } from './agent7-pathfinder';
import type { CriticVerdict } from './agent6-critic';

export interface RoadmapModule {
  week: number;
  moduleTitle: string;
  learningObjective: string;
  coreTopic: string;
  keySkillsThisWeek: string[];
  resources: {
    type: 'free_course' | 'practice_lab' | 'youtube_channel' | 'documentation' | 'certification_prep';
    name: string;
    platform: string;
    estimatedHours: number;
    url: string;
  }[];
  handsOnProject: {
    title: string;
    description: string;
    outcomeEvidence: string; // What should the candidate have to show for this week?
  };
  progressCheck: string; // A simple test the candidate can self-administer
  weeklyTimeCommitment: number; // Hours
  unlocks: string; // What becomes possible after this week
}

export interface DayMilestone {
  dayRange: string; // e.g. "Days 1 - 14"
  phaseTitle: string; // e.g. "Foundational Skill Sprint & Lab Setup"
  keyDeliverables: string[];
  readyToApply: boolean;
}

export interface LearningRoadmapOutput {
  totalWeeks: number;
  totalDaysToJobReady: number; // e.g. 42
  estimatedJobReadyDate: string; // e.g. "Sept 20, 2026"
  dailyPacingHours: number; // e.g. 2.5
  targetRole: string;
  weeklyHoursRequired: number;
  totalHoursInvestment: number;
  dayMilestones: DayMilestone[];
  roadmapModules: RoadmapModule[];
  roadmapText: string[]; // Simple "Week N: Title" format for quick display
  completionMilestones: string[];
  resumeUpdateWeek: number;
  applicationStartWeek: number;
  certificationTargets: string[];
  aiCoachNote: string; // Gemini's personal coaching message
}

const SYSTEM_PROMPT = `You are the Atlas Learning Roadmap Agent — an expert curriculum designer and career coach.

Your job is to create a HIGHLY SPECIFIC, week-by-week learning roadmap for this exact candidate.

This is NOT a generic "learn Python week 1" plan. It must be:
1. Calibrated to the candidate's MISSING SKILLS (not skills they already have).
2. Structured around PROJECTS, not just courses. Every week must have a tangible output.
3. Time-realistic based on their available hours per week.
4. Sequenced correctly — foundational skills before advanced ones.
5. Include FREE resources where possible (candidates may not have money for paid courses).
6. Include at least one offline / low-bandwidth resource per topic (for tier-2/3 candidates).
7. End with: resume update week, portfolio publication, and job application strategy.

For each week:
- Define a clear learning objective
- Specify 3-5 key skills to acquire
- List 2-3 real resources (name the actual platform: Coursera, YouTube, TryHackMe, Kaggle, etc.)
- Define a concrete hands-on project with a specific, verifiable outcome
- Provide a simple self-assessment progress check
- Note the weekly time commitment in hours
- Explain what this week "unlocks" for the candidate

IMPORTANT CONTEXT:
- Candidate's available learning hours: {LEARNING_HOURS}/week
- Candidate's location tier: {LOCATION_TIER} (consider offline/mobile-friendly resources for tier-2/3)
- Career gap context: {GAP_CONTEXT} (frame learning as re-entry, not starting from zero)
- Missing skills to cover: {MISSING_SKILLS}
- Target role: {TARGET_ROLE}

Return ONLY valid JSON. No explanation.`;

export function buildDayMilestones(totalDaysToJobReady: number): DayMilestone[] {
  return [
    {
      dayRange: `Days 1 – ${Math.round(totalDaysToJobReady * 0.25)}`,
      phaseTitle: 'Foundational Skill Sprint & Lab Setup',
      keyDeliverables: [
        'Set up local Virtual VM and development tools',
        'Complete basic CLI terminal & OS fundamentals labs',
        'Verify first hands-on lab exercise'
      ],
      readyToApply: false,
    },
    {
      dayRange: `Days ${Math.round(totalDaysToJobReady * 0.25) + 1} – ${Math.round(totalDaysToJobReady * 0.5)}`,
      phaseTitle: 'Core Competency & Mini-Projects',
      keyDeliverables: [
        'Build and publish 2 mini-projects on GitHub',
        'Complete practice labs for core role prerequisites',
        'Self-assess score on technical progress checks'
      ],
      readyToApply: false,
    },
    {
      dayRange: `Days ${Math.round(totalDaysToJobReady * 0.5) + 1} – ${Math.round(totalDaysToJobReady * 0.75)}`,
      phaseTitle: 'Capstone Portfolio & Resume Refactor',
      keyDeliverables: [
        'Complete end-to-end industry capstone project',
        'Update resume with gap-translated experience & skills',
        'Publish live portfolio project on GitHub & LinkedIn'
      ],
      readyToApply: true,
    },
    {
      dayRange: `Days ${Math.round(totalDaysToJobReady * 0.75) + 1} – ${totalDaysToJobReady}`,
      phaseTitle: 'Application Sprint & Interview Pacing',
      keyDeliverables: [
        'Apply to 5+ targeted remote & bridge roles per week',
        'Practice mock technical & behavioral interview scenarios',
        'Secure first interviews and negotiate offer terms'
      ],
      readyToApply: true,
    },
  ];
}

function buildLocalRoadmap(twin: CareerTwinOutput, critic: CriticVerdict, pathfinder: PathfinderOutput): LearningRoadmapOutput {
  const isCyber = twin.interests.some(i => i.toLowerCase().includes('cyber') || i.toLowerCase().includes('security') || i.toLowerCase().includes('hacker'));
  const weeklyHours = twin.preferences.learning_hours_per_week || 12;
  const cyberModules: RoadmapModule[] = [
    {
      week: 1,
      moduleTitle: 'Computer Systems & OS Foundations',
      learningObjective: 'Understand how operating systems, hardware, and file systems work at a functional level.',
      coreTopic: 'OS fundamentals, file systems, CLI basics',
      keySkillsThisWeek: ['Windows OS navigation', 'Linux terminal basics (ls, cd, mkdir, chmod)', 'File system hierarchy', 'Process management'],
      resources: [
        { type: 'free_course', name: 'Google IT Support Certificate (Week 1)', platform: 'Coursera (audit free)', estimatedHours: 6, url: 'https://www.coursera.org/professional-certificates/google-it-support' },
        { type: 'practice_lab', name: 'Linux Survival (interactive CLI)', platform: 'linuxsurvival.com (free)', estimatedHours: 3, url: 'https://linuxsurvival.com' },
        { type: 'youtube_channel', name: 'NetworkChuck - Linux for Hackers', platform: 'YouTube', estimatedHours: 2, url: 'https://www.youtube.com/results?search_query=networkchuck+linux+for+hackers' },
      ],
      handsOnProject: {
        title: 'Virtual Lab Setup',
        description: 'Install VirtualBox, set up an Ubuntu Linux VM, navigate to 10 different directories using only the terminal, create a folder structure, and save a text file.',
        outcomeEvidence: 'Screenshot of your terminal showing successful navigation + a README file describing what you learned.',
      },
      progressCheck: 'Can you open a terminal, navigate to /etc, list all files, and explain what 3 of them do? If yes, Week 1 is complete.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'Networking basics — you need OS knowledge first to understand how networks connect machines.',
    },
    {
      week: 2,
      moduleTitle: 'Networking Fundamentals (TCP/IP, DNS, Ports)',
      learningObjective: 'Understand how computers communicate over networks — the backbone of all cybersecurity.',
      coreTopic: 'TCP/IP model, IP addressing, DNS, HTTP/HTTPS, common ports',
      keySkillsThisWeek: ['IP address structure (IPv4/IPv6)', 'Subnetting basics', 'Port numbers (80, 443, 22, 3389)', 'DNS resolution', 'Ping, traceroute, nslookup'],
      resources: [
        { type: 'free_course', name: 'Professor Messer CompTIA Network+ (N10-009)', platform: 'YouTube (free)', estimatedHours: 5, url: 'https://www.youtube.com/results?search_query=professor+messer+network+plus' },
        { type: 'practice_lab', name: 'TryHackMe - Pre-Security Path (Networking)', platform: 'TryHackMe (free tier)', estimatedHours: 4, url: 'https://tryhackme.com/path/outline/presecurity' },
        { type: 'documentation', name: 'Cisco Networking Academy - Intro to Networks', platform: 'NetAcad.com (free)', estimatedHours: 3, url: 'https://www.netacad.com/courses/networking/networking-essentials' },
      ],
      handsOnProject: {
        title: 'Network Discovery Lab',
        description: 'On your Ubuntu VM, use nmap to scan your local network, identify open ports on your machine, capture packets with Wireshark for 5 minutes, and document what you found.',
        outcomeEvidence: 'Written report listing 5 open ports with their services, plus a Wireshark screenshot with at least one identified protocol.',
      },
      progressCheck: 'Without looking at notes: What does TCP stand for? What port does HTTPS use? What does DNS do? If you answered all 3, Week 2 is complete.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'Security monitoring — you now understand the traffic that SOC analysts monitor.',
    },
    {
      week: 3,
      moduleTitle: 'Security Fundamentals & Threat Landscape',
      learningObjective: 'Understand the CIA Triad, common attack types, and how defenders think.',
      coreTopic: 'CIA Triad, malware types, phishing, OWASP Top 10, defense-in-depth',
      keySkillsThisWeek: ['CIA Triad (Confidentiality, Integrity, Availability)', 'Malware taxonomy (ransomware, trojans, spyware)', 'Social engineering attacks', 'Password security & MFA', 'Security policies & access control'],
      resources: [
        { type: 'free_course', name: 'TryHackMe - SOC Level 1 Path', platform: 'TryHackMe (free tier)', estimatedHours: 6, url: 'https://tryhackme.com/path/outline/soclevel1' },
        { type: 'free_course', name: 'Cybersecurity for Everyone (U of Maryland)', platform: 'Coursera (audit free)', estimatedHours: 4, url: 'https://www.coursera.org/learn/cybersecurity-for-everyone' },
        { type: 'youtube_channel', name: 'John Hammond - Security Walkthroughs', platform: 'YouTube', estimatedHours: 2, url: 'https://www.youtube.com/results?search_query=john+hammond+security' },
      ],
      handsOnProject: {
        title: 'Security Audit Simulation',
        description: 'Using a provided checklist, perform a basic security audit of your home or virtual lab environment. Identify 5 vulnerabilities and write mitigation recommendations.',
        outcomeEvidence: 'A 1-page security audit report in PDF format listing vulnerabilities found + recommended fixes.',
      },
      progressCheck: 'Can you explain: What is a phishing attack? What is the difference between authentication and authorization? What does a firewall do? If yes, Week 3 done.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'SIEM and log analysis — you now understand WHAT you are looking for when monitoring security events.',
    },
    {
      week: 4,
      moduleTitle: 'SIEM & Log Analysis (SOC Analyst Core Skill)',
      learningObjective: 'Use a real SIEM tool to ingest logs, detect anomalies, and create security alerts.',
      coreTopic: 'SIEM concepts, log sources, alert creation, incident triage',
      keySkillsThisWeek: ['What SIEM is and why it matters', 'Log sources (Windows Event Logs, Syslog)', 'Wazuh or Splunk Free Tier basics', 'Creating detection rules', 'Writing an incident ticket'],
      resources: [
        { type: 'practice_lab', name: 'Wazuh Open Source SIEM (local install)', platform: 'wazuh.com (100% free)', estimatedHours: 5, url: 'https://wazuh.com' },
        { type: 'practice_lab', name: 'TryHackMe - Splunk Basics Room', platform: 'TryHackMe (free tier)', estimatedHours: 3, url: 'https://tryhackme.com/room/splunk101' },
        { type: 'free_course', name: 'Blue Team Labs Online (free tier)', platform: 'blueteamlabs.online', estimatedHours: 3, url: 'https://blueteamlabs.online' },
      ],
      handsOnProject: {
        title: 'First SIEM Alert',
        description: 'Set up Wazuh on your local VM, ingest 3 different log sources, trigger a simulated brute-force attack, and create an alert rule that detects it. Write an incident ticket documenting what happened.',
        outcomeEvidence: 'Screenshot of your Wazuh dashboard showing the triggered alert + a filled incident ticket template.',
      },
      progressCheck: 'Can you explain: What is the difference between a log and an alert? What event ID indicates a failed Windows login? Week 4 done if you know both.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'Penetration testing basics and ethical hacking tools — you now understand what you are defending against.',
    },
    {
      week: 5,
      moduleTitle: 'Hands-On Ethical Hacking Introduction',
      learningObjective: 'Understand attacker methodology using legal, sandboxed CTF environments.',
      coreTopic: 'Kali Linux, nmap, Metasploit basics, CTF challenges',
      keySkillsThisWeek: ['Kali Linux setup', 'nmap scanning techniques', 'OWASP WebGoat (vulnerable web app)', 'Basic Metasploit usage (in lab only)', 'CTF challenge solving'],
      resources: [
        { type: 'practice_lab', name: 'TryHackMe - Offensive Pentesting Path (first 3 rooms)', platform: 'TryHackMe (free)', estimatedHours: 6, url: 'https://tryhackme.com/path/outline/pentesting' },
        { type: 'practice_lab', name: 'HackTheBox Starting Point (free tier)', platform: 'hackthebox.com', estimatedHours: 4, url: 'https://www.hackthebox.com' },
        { type: 'documentation', name: 'Kali Linux Documentation', platform: 'kali.org (free)', estimatedHours: 2, url: 'https://www.kali.org/docs/' },
      ],
      handsOnProject: {
        title: 'First CTF Challenge',
        description: 'Complete 2 beginner CTF challenges on TryHackMe. Document your methodology: reconnaissance → enumeration → exploitation → flag capture. Write a 300-word writeup.',
        outcomeEvidence: 'Your CTF completion badge on TryHackMe + a published writeup on GitHub or a personal blog.',
      },
      progressCheck: 'Have you captured at least 2 CTF flags and can explain what technique you used? Week 5 done.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'Resume update and professional certification preparation.',
    },
    {
      week: 6,
      moduleTitle: 'Resume Rebuild — Translating Your Full Journey',
      learningObjective: 'Craft a professional, ATS-optimized resume that correctly represents ALL your skills — including translated informal experience.',
      coreTopic: 'Skills translation, ATS optimization, caregiving-to-IT narrative',
      keySkillsThisWeek: ['ATS keyword optimization (Jobscan, Resume Worded)', 'Professional summary writing', 'Skills translation framing', 'Project portfolio formatting', 'LinkedIn profile optimization'],
      resources: [
        { type: 'free_course', name: 'Resume Worded (free resume grader)', platform: 'resumeworded.com', estimatedHours: 2, url: 'https://resumeworded.com' },
        { type: 'youtube_channel', name: 'Jeff Su - ATS Resume Tips', platform: 'YouTube', estimatedHours: 2, url: 'https://www.youtube.com/results?search_query=jeff+su+ats+resume' },
        { type: 'documentation', name: 'Google IT Support Certificate Resume Template', platform: 'grow.google (free)', estimatedHours: 1, url: 'https://grow.google/certificates/it-support/' },
      ],
      handsOnProject: {
        title: 'Complete Resume & LinkedIn Overhaul',
        description: 'Rewrite your resume from scratch using the Atlas skill translation guide. Your caregiving experience becomes "Stakeholder Coordination & Resource Planning." Upload to LinkedIn. Get a Resume Worded score of 75+.',
        outcomeEvidence: 'A PDF resume scored 75+ on Resume Worded + updated LinkedIn profile with all lab projects listed.',
      },
      progressCheck: 'Does your resume include your lab projects? Does it translate informal experience into professional skills? Resume Worded score 75+? If yes, Week 6 done.',
      weeklyTimeCommitment: Math.round(weeklyHours * 0.75),
      unlocks: 'Interview preparation and employer outreach.',
    },
    {
      week: 7,
      moduleTitle: 'Interview Preparation — Technical & Behavioral',
      learningObjective: 'Prepare to confidently answer IT Support / SOC Analyst interview questions, including questions about career gaps.',
      coreTopic: 'Technical questions, gap explanation frameworks, STAR method, remote interview prep',
      keySkillsThisWeek: ['Technical Q&A: DNS troubleshooting, port numbers, log analysis', 'STAR method for behavioral questions', 'Gap explanation: empowered narrative', 'Remote interview setup', 'Salary negotiation basics'],
      resources: [
        { type: 'free_course', name: '100 SOC Analyst Interview Questions (GitHub)', platform: 'GitHub (free)', estimatedHours: 3, url: 'https://github.com' },
        { type: 'youtube_channel', name: 'TechWorld with Nana - Cybersecurity Interview', platform: 'YouTube', estimatedHours: 2, url: 'https://www.youtube.com/results?search_query=techworld+with+nana+cybersecurity+interview' },
        { type: 'practice_lab', name: 'Pramp (free mock interviews)', platform: 'pramp.com', estimatedHours: 3, url: 'https://www.pramp.com' },
      ],
      handsOnProject: {
        title: 'Video Mock Interview',
        description: 'Record a 7-minute video answering: (1) Tell me about your career gap. (2) What is a SOC analyst? (3) Walk me through how you would investigate a brute-force login alert. Review and improve.',
        outcomeEvidence: 'A recorded video you are confident sharing with a mentor or recruiter.',
      },
      progressCheck: 'Can you answer the 3 questions above without notes? Can you explain your career gap confidently? Week 7 done.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'Targeted job application strategy with remote-first employers.',
    },
    {
      week: 8,
      moduleTitle: 'Launch — Targeted Application & Professional Outreach',
      learningObjective: 'Execute a focused, strategic job application campaign targeting remote-friendly IT Support and SOC Trainee roles.',
      coreTopic: 'Job search strategy, remote platforms, recruiter outreach, returnship programs',
      keySkillsThisWeek: ['Remote job platforms (Remote.co, We Work Remotely, Wellfound)', 'Returnship program applications (Microsoft LEAP, Salesforce Returnship, Amazon Return-to-Work)', 'Cold outreach message templates', 'Portfolio project sharing on LinkedIn', 'Application tracking sheet'],
      resources: [
        { type: 'documentation', name: 'Remote.co - Remote IT Jobs', platform: 'remote.co', estimatedHours: 2, url: 'https://remote.co' },
        { type: 'documentation', name: 'Microsoft LEAP Returnship Program', platform: 'microsoft.com/en-us/leap', estimatedHours: 1, url: 'https://experience.microsoft.com/leap/' },
        { type: 'free_course', name: 'LinkedIn Job Search Strategies', platform: 'LinkedIn Learning (free)', estimatedHours: 2, url: 'https://www.linkedin.com/learning/' },
      ],
      handsOnProject: {
        title: 'Application Campaign Launch',
        description: 'Apply to 5 targeted roles (3 remote IT Support, 2 SOC Trainee). Send 3 personalized LinkedIn connection requests to hiring managers or IT professionals. Post your lab project on LinkedIn with a 200-word caption.',
        outcomeEvidence: 'Application tracking spreadsheet with 5 applications sent + LinkedIn post with 10+ reactions.',
      },
      progressCheck: 'Have you applied to 5 roles? Have you sent 3 outreach messages? LinkedIn post live? Week 8 and the roadmap are complete.',
      weeklyTimeCommitment: weeklyHours,
      unlocks: 'First interviews and SOC Trainee / IT Support Specialist roles.',
    },
  ];

  const dataModules: RoadmapModule[] = [
    {
      week: 1, moduleTitle: 'Advanced Spreadsheet & Data Fundamentals',
      learningObjective: 'Master Excel and Google Sheets at a professional level, the foundation of all data work.',
      coreTopic: 'VLOOKUP, INDEX/MATCH, Pivot Tables, data cleaning functions',
      keySkillsThisWeek: ['VLOOKUP / XLOOKUP', 'Pivot Tables & Charts', 'Text functions (TRIM, CONCATENATE, LEFT, RIGHT)', 'Conditional formatting', 'Data validation rules'],
      resources: [
        { type: 'free_course', name: 'Excel Skills for Business (Macquarie Uni)', platform: 'Coursera (audit free)', estimatedHours: 5, url: 'https://www.coursera.org/specializations/excel' },
        { type: 'youtube_channel', name: 'ExcelJet - Excel Tricks', platform: 'YouTube', estimatedHours: 2, url: 'https://exceljet.net' },
        { type: 'practice_lab', name: 'Kaggle - Spreadsheet exercises', platform: 'kaggle.com (free)', estimatedHours: 2, url: 'https://www.kaggle.com/learn' },
      ],
      handsOnProject: { title: 'Data Cleaning Challenge', description: 'Download a messy 5,000-row sales dataset from Kaggle. Clean it using Excel/Sheets: remove duplicates, fix formatting, fill nulls, and build a summary Pivot Table.', outcomeEvidence: 'A before/after comparison Excel file with your cleaning steps documented.' },
      progressCheck: 'Can you explain INDEX/MATCH and when it is better than VLOOKUP? Can you build a Pivot Table from scratch? Week 1 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'SQL — you now understand what structured data looks like.'
    },
    {
      week: 2, moduleTitle: 'SQL Fundamentals (SELECT to JOINs)',
      learningObjective: 'Write queries to extract, filter, and combine data from relational databases.',
      coreTopic: 'SELECT, WHERE, GROUP BY, HAVING, INNER/LEFT JOIN',
      keySkillsThisWeek: ['SELECT and filtering (WHERE)', 'Aggregations (COUNT, SUM, AVG, MAX)', 'GROUP BY and HAVING', 'INNER JOIN and LEFT JOIN', 'Subqueries'],
      resources: [
        { type: 'free_course', name: 'Mode Analytics SQL Tutorial', platform: 'mode.com/sql-tutorial (free)', estimatedHours: 4, url: 'https://mode.com/sql-tutorial/' },
        { type: 'practice_lab', name: 'SQLZoo Interactive Exercises', platform: 'sqlzoo.net (free)', estimatedHours: 4, url: 'https://sqlzoo.net' },
        { type: 'practice_lab', name: 'Kaggle SQL Course', platform: 'kaggle.com (free)', estimatedHours: 3, url: 'https://www.kaggle.com/learn/intro-to-sql' },
      ],
      handsOnProject: { title: 'Sales Database Analysis', description: 'Using the free SQLite Northwind database, write 8 queries: top 5 customers by revenue, monthly sales by product, and inventory below reorder point.', outcomeEvidence: 'A .sql file on GitHub with all 8 queries + a screenshot of each result.' },
      progressCheck: 'Write a query that joins two tables and returns customers who spent more than ₹10,000. If you can do it, Week 2 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'Data visualization — you can now get the data; next you will present it.'
    },
    {
      week: 3, moduleTitle: 'Data Visualization with Power BI',
      learningObjective: 'Build interactive dashboards that communicate business insights clearly.',
      coreTopic: 'Power BI Desktop, DAX basics, dashboard design principles',
      keySkillsThisWeek: ['Power BI Desktop installation and data import', 'DAX basics (CALCULATE, SUM, DIVIDE)', 'Chart types and when to use each', 'Dashboard layout and design', 'Publishing and sharing'],
      resources: [
        { type: 'free_course', name: 'Microsoft Power BI Full Course', platform: 'YouTube - Guy in a Cube', estimatedHours: 5, url: 'https://www.youtube.com/c/GuyinaCube' },
        { type: 'free_course', name: 'Power BI Desktop for Beginners', platform: 'Microsoft Learn (free)', estimatedHours: 3, url: 'https://learn.microsoft.com/en-us/power-bi/' },
        { type: 'practice_lab', name: 'Maven Analytics Power BI Practice Files', platform: 'mavenanalytics.io (free)', estimatedHours: 2, url: 'https://www.mavenanalytics.io' },
      ],
      handsOnProject: { title: 'E-Commerce Sales Dashboard', description: 'Build a 3-page Power BI dashboard for an e-commerce dataset: (1) Executive Summary, (2) Product Analysis, (3) Regional Sales Map. Publish online.', outcomeEvidence: 'A shareable Power BI dashboard link + a 5-slide PowerPoint "story" explaining your key findings.' },
      progressCheck: 'Can you explain what DAX is? Can you build a line chart showing monthly trend? Can you publish to Power BI Service? Week 3 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'Python data analysis — the most powerful tool in a data analyst\'s toolkit.'
    },
    {
      week: 4, moduleTitle: 'Python for Data Analysis (Pandas & NumPy)',
      learningObjective: 'Automate data cleaning and analysis tasks that would take hours in Excel.',
      coreTopic: 'Python basics, Pandas DataFrames, NumPy, Matplotlib',
      keySkillsThisWeek: ['Python environment setup (Jupyter Notebooks)', 'Pandas: read_csv, head, describe, groupby, merge', 'Data cleaning with Pandas (dropna, fillna, rename)', 'Basic statistics with NumPy', 'Matplotlib: bar, line, scatter plots'],
      resources: [
        { type: 'free_course', name: 'Kaggle Python + Pandas Courses', platform: 'kaggle.com (free)', estimatedHours: 6, url: 'https://www.kaggle.com/learn/pandas' },
        { type: 'youtube_channel', name: 'Keith Galli - Pandas Tutorial', platform: 'YouTube', estimatedHours: 3, url: 'https://www.youtube.com/results?search_query=keith+galli+pandas' },
        { type: 'practice_lab', name: 'Google Colab (free Python notebooks)', platform: 'colab.research.google.com', estimatedHours: 2, url: 'https://colab.research.google.com' },
      ],
      handsOnProject: { title: 'EDA (Exploratory Data Analysis) Notebook', description: 'Pick a dataset from Kaggle. Write a Jupyter Notebook performing full EDA: data shape, missing values, distributions, correlations, and 5 visualizations. Publish on Kaggle.', outcomeEvidence: 'A public Kaggle notebook with 5+ visualizations and a written summary of 3 business insights.' },
      progressCheck: 'Can you read a CSV in Pandas, find the top 5 rows, group by a column, and plot the result? Week 4 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'Advanced portfolio project — combining everything into a real-world analysis.'
    },
    {
      week: 5, moduleTitle: 'Capstone Portfolio Project',
      learningObjective: 'Build a complete, end-to-end data analysis project that demonstrates ALL skills learned.',
      coreTopic: 'Project planning, data pipeline, insights communication',
      keySkillsThisWeek: ['Project scoping and question definition', 'Data collection and cleaning', 'SQL + Python analysis', 'Power BI visualization', 'Written insight presentation'],
      resources: [
        { type: 'practice_lab', name: 'Kaggle Datasets (choose a real business dataset)', platform: 'kaggle.com (free)', estimatedHours: 4, url: 'https://www.kaggle.com/datasets' },
        { type: 'documentation', name: 'How to Write a Data Analysis Report', platform: 'Towards Data Science (free)', estimatedHours: 2, url: 'https://towardsdatascience.com' },
        { type: 'free_course', name: 'Storytelling with Data (book + free resources)', platform: 'storytellingwithdata.com', estimatedHours: 3, url: 'https://www.storytellingwithdata.com' },
      ],
      handsOnProject: { title: 'End-to-End Business Analysis Project', description: 'Choose a real-world dataset (job market, e-commerce, healthcare, education). Ask 5 business questions. Answer them with SQL + Python + Power BI. Write a professional report. Publish everything on GitHub.', outcomeEvidence: 'A GitHub repository with: raw data, SQL queries, Python notebook, Power BI file, and a 10-page PDF analysis report.' },
      progressCheck: 'Could you present this project in a 10-minute interview and answer questions about every decision you made? Week 5 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'Professional resume, LinkedIn, and job applications.'
    },
    {
      week: 6, moduleTitle: 'Resume & Portfolio Publication',
      learningObjective: 'Package everything into a professional job application profile.',
      coreTopic: 'ATS resume, LinkedIn optimization, GitHub portfolio',
      keySkillsThisWeek: ['Resume skill translation (data entry → data quality professional)', 'ATS keyword optimization', 'LinkedIn profile rebuild', 'GitHub portfolio README design', 'Personal branding statement'],
      resources: [
        { type: 'documentation', name: 'Resume Worded', platform: 'resumeworded.com', estimatedHours: 2, url: 'https://resumeworded.com' },
        { type: 'youtube_channel', name: 'Sundas Khalid - Data Analyst Resume', platform: 'YouTube', estimatedHours: 2, url: 'https://www.youtube.com/results?search_query=sundas+khalid+data+analyst+resume' },
        { type: 'documentation', name: 'GitHub README templates', platform: 'github.com (free)', estimatedHours: 2, url: 'https://github.com' },
      ],
      handsOnProject: { title: 'Professional Brand Package', description: 'Update your resume (75+ Resume Worded score), rebuild your LinkedIn with all projects, create a clean GitHub README with project showcase.', outcomeEvidence: 'PDF resume scored 75+ + LinkedIn with 500+ connection target + GitHub with 3 pinned projects.' },
      progressCheck: 'Strangers can find your work online. Your resume scores 75+. Your gap is framed professionally. Week 6 done.',
      weeklyTimeCommitment: Math.round(weeklyHours * 0.75), unlocks: 'Interview preparation.'
    },
    {
      week: 7, moduleTitle: 'Interview Preparation',
      learningObjective: 'Prepare to confidently answer SQL, analytical, and behavioral interview questions.',
      coreTopic: 'Technical SQL challenges, data case questions, STAR method, gap explanation',
      keySkillsThisWeek: ['Top 50 Data Analyst SQL interview questions', 'Business case analysis framework', 'STAR behavioral responses', 'Gap narrative framework', 'Salary negotiation'],
      resources: [
        { type: 'practice_lab', name: 'LeetCode SQL Easy Problems', platform: 'leetcode.com (free)', estimatedHours: 3, url: 'https://leetcode.com/problemset/database/' },
        { type: 'free_course', name: 'DataLemur SQL Interview Questions', platform: 'datalemur.com (free)', estimatedHours: 3, url: 'https://datalemur.com' },
        { type: 'practice_lab', name: 'Pramp Data Analysis Mock Interviews', platform: 'pramp.com (free)', estimatedHours: 2, url: 'https://www.pramp.com' },
      ],
      handsOnProject: { title: 'Mock Interview Recording', description: 'Record answers to: (1) Tell me about yourself. (2) Walk me through your capstone project. (3) SQL: Find the top 3 products by revenue. Review and improve.', outcomeEvidence: 'A recorded video you are confident to share.' },
      progressCheck: 'Can you solve the top 20 LeetCode Easy SQL problems? Can you explain your gap confidently? Week 7 done.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'Job applications and first interviews.'
    },
    {
      week: 8, moduleTitle: 'Application Launch Campaign',
      learningObjective: 'Execute a targeted, high-quality job application strategy.',
      coreTopic: 'Remote job platforms, recruiter outreach, application tracking',
      keySkillsThisWeek: ['Remote job platforms (Naukri Remote, LinkedIn Remote, Wellfound)', 'Customized cover letter templates', 'Recruiter cold message strategy', 'Application ATS tracking', 'Returnship programs (for women returners)'],
      resources: [
        { type: 'documentation', name: 'Naukri Remote Jobs', platform: 'naukri.com (remote filter)', estimatedHours: 2, url: 'https://www.naukri.com/remote-jobs' },
        { type: 'documentation', name: 'Returnship.com Program List', platform: 'returnship.com', estimatedHours: 1, url: 'https://returnship.com' },
        { type: 'documentation', name: 'LinkedIn Easy Apply Strategy', platform: 'linkedin.com', estimatedHours: 2, url: 'https://www.linkedin.com/jobs/' },
      ],
      handsOnProject: { title: 'Application Campaign', description: 'Apply to 5 targeted roles: 3 remote Data Quality / Junior Analyst, 2 returnship programs. Send 3 personalized recruiter messages. Post a LinkedIn update showcasing your project.', outcomeEvidence: 'Tracking sheet with 5 applications + 3 recruiter messages sent + LinkedIn post live.' },
      progressCheck: '5 applications sent. LinkedIn post published. Tracking spreadsheet updated. 8-week roadmap complete.',
      weeklyTimeCommitment: weeklyHours, unlocks: 'First interviews and Data Analyst / Data Quality roles.',
    },
  ];

  const modules = isCyber ? cyberModules : dataModules;
  const targetRole = pathfinder.shortestPath[pathfinder.shortestPath.length - 1]?.role || 'Target Role';
  const totalWeeks = modules.length || 8;
  const totalDaysToJobReady = totalWeeks * 7;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + totalDaysToJobReady);
  const estimatedJobReadyDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dailyPacingHours = Math.round((weeklyHours / 7) * 10) / 10;

  const dayMilestones = buildDayMilestones(totalDaysToJobReady);

  return {
    totalWeeks,
    totalDaysToJobReady,
    estimatedJobReadyDate,
    dailyPacingHours,
    dayMilestones,
    targetRole,
    weeklyHoursRequired: weeklyHours,
    totalHoursInvestment: weeklyHours * totalWeeks,
    roadmapModules: modules,
    roadmapText: modules.map(m => `Week ${m.week}: ${m.moduleTitle}`),
    completionMilestones: pathfinder.keyMilestones,
    resumeUpdateWeek: 6,
    applicationStartWeek: 8,
    certificationTargets: isCyber
      ? ['Google IT Support Certificate', 'CompTIA Security+', 'CEH (Certified Ethical Hacker)']
      : ['Google Data Analytics Certificate', 'Microsoft PL-300 (Power BI)', 'AWS Data Analytics Specialty'],
    aiCoachNote: isCyber
      ? 'Cybersecurity values demonstrated skills over degrees. Focus on finishing the lab projects — your Wazuh SIEM screenshot is worth more than a line on a resume.'
      : 'Data analytics is about telling a business story with data. Don\'t just write SQL — show what business decision your query enabled.',
  };
}

export async function runLearningRoadmapAgent(
  twin: CareerTwinOutput,
  critic: CriticVerdict,
  pathfinder: PathfinderOutput
): Promise<LearningRoadmapOutput> {
  const missingSkills = critic.verifiedMatches[0]?.missing_skills || [];
  const targetRole = pathfinder.shortestPath[pathfinder.shortestPath.length - 1]?.role || 'Target Role';
  const weeklyHours = twin.preferences.learning_hours_per_week || 12;

  const systemPrompt = SYSTEM_PROMPT
    .replace('{LEARNING_HOURS}', String(weeklyHours))
    .replace('{LOCATION_TIER}', twin.locationTier || 'tier2')
    .replace('{GAP_CONTEXT}', twin.gap.duration_months > 0 ? `${twin.gap.duration_months}m gap (${twin.gap.reason})` : 'No significant gap')
    .replace('{MISSING_SKILLS}', missingSkills.join(', '))
    .replace('{TARGET_ROLE}', targetRole);

  try {
    const result = await callGeminiJSON<{ roadmapModules: RoadmapModule[]; aiCoachNote?: string; certificationTargets?: string[] }>(
      systemPrompt,
      `Candidate Context:\n- Career Stage: ${twin.career_stage}\n- Translated Gap Skills: ${twin.gap.translated_skills.join(', ')}\n- Technical Skills: ${twin.skills.filter(s => !s.informalSource).map(s => s.name).join(', ')}\n- Missing Skills: ${missingSkills.join(', ')}\n- Target: ${targetRole}\n- Weekly learning hours: ${weeklyHours}\n- Location tier: ${twin.locationTier || 'tier2'}\n- Preferences: ${JSON.stringify(twin.preferences)}\n\nGenerate a detailed 8-week learning roadmap JSON with all fields.`,
      { model: DEFAULT_GEMINI_MODEL, maxTokens: 4000, temperature: 0.3 }
    );

    if (result?.roadmapModules?.length > 0) {
      const modules = result.roadmapModules.slice(0, 8);
      const totalDaysToJobReady = modules.length * 7;
      return {
        totalWeeks: modules.length,
        totalDaysToJobReady,
        estimatedJobReadyDate: new Date(Date.now() + totalDaysToJobReady * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dailyPacingHours: Math.round((weeklyHours / 7) * 10) / 10,
        dayMilestones: buildDayMilestones(totalDaysToJobReady),
        targetRole,
        weeklyHoursRequired: weeklyHours,
        totalHoursInvestment: weeklyHours * modules.length,
        roadmapModules: modules,
        roadmapText: modules.map(m => `Week ${m.week}: ${m.moduleTitle}`),
        completionMilestones: pathfinder.keyMilestones,
        resumeUpdateWeek: modules.length - 2,
        applicationStartWeek: modules.length,
        certificationTargets: result.certificationTargets || [],
        aiCoachNote: result.aiCoachNote || `Your ${twin.gap.translated_skills.length} translated skills are your foundation. Build on them systematically.`,
      };
    }

    return buildLocalRoadmap(twin, critic, pathfinder);
  } catch (err) {
    console.warn('[LearningRoadmapAgent] Gemini failed, using local roadmap:', err);
    return buildLocalRoadmap(twin, critic, pathfinder);
  }
}
