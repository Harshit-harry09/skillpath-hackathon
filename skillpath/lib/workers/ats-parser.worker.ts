import * as Comlink from 'comlink';
import { extractContactInfo } from '../ats-contact-extractor';
import { parseWorkExperience } from '../ats-experience-parser';
import { extractEducationAndCerts } from '../ats-education-extractor';
import { auditFraudAndFormatting } from '../ats-fraud-detector';

export interface AtsWorkerParseParams {
  resumeText: string;
  mustHaveSkills?: string[];
}

export interface AtsWorkerParseResult {
  contact: ReturnType<typeof extractContactInfo>;
  experience: ReturnType<typeof parseWorkExperience>;
  educationInfo: ReturnType<typeof extractEducationAndCerts>['education_info'];
  certifications: ReturnType<typeof extractEducationAndCerts>['certifications'];
  fraudAudit: ReturnType<typeof auditFraudAndFormatting>;
  parsedAt: number;
}

export const atsParserWorker = {
  parseResumeText({ resumeText, mustHaveSkills = [] }: AtsWorkerParseParams): AtsWorkerParseResult {
    const contact = extractContactInfo(resumeText);
    const experience = parseWorkExperience(resumeText, mustHaveSkills);
    const { education_info: educationInfo, certifications } = extractEducationAndCerts(resumeText);
    const fraudAudit = auditFraudAndFormatting(resumeText);

    return {
      contact,
      experience,
      educationInfo,
      certifications,
      fraudAudit,
      parsedAt: Date.now(),
    };
  },
};

Comlink.expose(atsParserWorker);
