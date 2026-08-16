/**
 * Safe migration switches for the Results/Atlas product split.
 *
 * Values are intentionally server-safe and read once per module load. The
 * defaults keep the new ownership model enabled while leaving legacy surfaces
 * available behind explicit opt-in switches during rollout.
 */

function envBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const featureFlags = {
  // Use direct public-env references so Next.js inlines overrides in client bundles.
  showLegacyResultsPlan: envBoolean(process.env.NEXT_PUBLIC_SHOW_LEGACY_RESULTS_PLAN, false),
  showResultsRoleSwitch: envBoolean(process.env.NEXT_PUBLIC_SHOW_RESULTS_ROLE_SWITCH, false),
  showResultsGenericCoverLetter: envBoolean(process.env.NEXT_PUBLIC_SHOW_RESULTS_GENERIC_COVER_LETTER, false),
  showResultsGenericLinkedIn: envBoolean(process.env.NEXT_PUBLIC_SHOW_RESULTS_GENERIC_LINKEDIN, false),

  showAtlasRawAtsScore: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATLAS_RAW_ATS_SCORE, false),
  showAtlasKeywordDiff: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATLAS_KEYWORD_DIFF, false),
  showAtlasPdfBinaryAudit: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATLAS_PDF_BINARY_AUDIT, false),
  showAtlasResumeExporter: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATLAS_RESUME_EXPORTER, false),

  showAtsBotVision: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATS_BOT_VISION, true),
  showKeywordBounty: envBoolean(process.env.NEXT_PUBLIC_SHOW_KEYWORD_BOUNTY, true),
  showResumeAutopsy: envBoolean(process.env.NEXT_PUBLIC_SHOW_RESUME_AUTOPSY, true),
  showRecruiterHeatmap: envBoolean(process.env.NEXT_PUBLIC_SHOW_RECRUITER_HEATMAP, true),
  showBulletSurgery: envBoolean(process.env.NEXT_PUBLIC_SHOW_BULLET_SURGERY, true),
  showEvidenceLocker: envBoolean(process.env.NEXT_PUBLIC_SHOW_EVIDENCE_LOCKER, true),
  showAtlasLaunchCTA: envBoolean(process.env.NEXT_PUBLIC_SHOW_ATLAS_LAUNCH_CTA, true),

  showCareerTwinDNA: envBoolean(process.env.NEXT_PUBLIC_SHOW_CAREER_TWIN_DNA, true),
  showGapAlchemy: envBoolean(process.env.NEXT_PUBLIC_SHOW_GAP_ALCHEMY, true),
  showBridgeRoleLadder: envBoolean(process.env.NEXT_PUBLIC_SHOW_BRIDGE_ROLE_LADDER, true),
  showFutureProofRadar: envBoolean(process.env.NEXT_PUBLIC_SHOW_FUTURE_PROOF_RADAR, true),
  showInterviewDojo: envBoolean(process.env.NEXT_PUBLIC_SHOW_INTERVIEW_DOJO, true),
  showSalaryWarRoom: envBoolean(process.env.NEXT_PUBLIC_SHOW_SALARY_WAR_ROOM, true),
  showHiddenDoorNetwork: envBoolean(process.env.NEXT_PUBLIC_SHOW_HIDDEN_DOOR_NETWORK, true),
  showEmployerCourt: envBoolean(process.env.NEXT_PUBLIC_SHOW_EMPLOYER_COURT, true),
  showShadowBoard: envBoolean(process.env.NEXT_PUBLIC_SHOW_SHADOW_BOARD, true),
} as const;
