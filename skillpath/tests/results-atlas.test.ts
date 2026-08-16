import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateKeywordBounty } from '../lib/results/keyword-bounty';
import { analyzeBulletQuality } from '../lib/results/bullet-quality';
import { buildRecruiterHeatmap } from '../lib/results/recruiter-heatmap';
import { aStarCareerPath } from '../lib/dijkstra';
import { calculateSkillDecay } from '../lib/atlas/skill-decay';
import { runAtlasSoftParse } from '../lib/atlas/soft-parse';
import { AtlasStartSchema, DEFAULT_ATLAS_GOAL } from '../lib/atlas/schemas';

test('keyword bounty is deterministic and prioritizes must-have skills', () => {
  const items = calculateKeywordBounty(['PostgreSQL', 'Docker'], ['PostgreSQL', 'PostgreSQL', 'Docker'], ['PostgreSQL'], 62);
  assert.equal(items[0].skill, 'PostgreSQL');
  assert.equal(items[0].priority, 'high');
  assert.ok(items[0].scoreImpact > items[1].scoreImpact);
});

test('bullet quality flags vague and unverifiable bullets', () => {
  const quality = analyzeBulletQuality('Worked on dashboards', ['SQL']);
  assert.equal(quality.hasMetric, false);
  assert.equal(quality.hasActionVerb, false);
  assert.ok(quality.reasons.length >= 2);
});

test('recruiter heatmap reflects missing evidence', () => {
  const zones = buildRecruiterHeatmap({} as any);
  assert.equal(zones.find((zone) => zone.id === 'job_title')?.status, 'missing');
  assert.equal(zones.find((zone) => zone.id === 'metrics')?.status, 'warning');
});

test('Atlas A* pathfinder returns an ordered bridge path', () => {
  const graph = {
    start: { slug: 'start', label: 'Support', baseSalary: 40000, adjacentRoles: [{ targetSlug: 'bridge', transitionDifficulty: 2 }] },
    bridge: { slug: 'bridge', label: 'SOC trainee', baseSalary: 60000, adjacentRoles: [{ targetSlug: 'target', transitionDifficulty: 3 }] },
    target: { slug: 'target', label: 'Security analyst', baseSalary: 90000, adjacentRoles: [] },
  };
  const path = aStarCareerPath(graph as any, 'start', 'target');
  assert.equal(path.length, 3);
  assert.equal(path[0].slug, 'start');
  assert.equal(path[2].slug, 'target');
});

test('skill decay returns a bounded strategic freshness signal', () => {
  const result = calculateSkillDecay({ skill: 'SQL', lastUsedAt: '2020-01-01', demandScore: 0.8 }, new Date('2026-01-01'));
  assert.ok(result.freshness >= 0 && result.freshness <= 100);
  assert.equal(result.skill, 'SQL');
});

test('Atlas soft parse translates lived context without producing ATS facts', async () => {
  const result = await runAtlasSoftParse('Three-year caregiving break. Managed medical scheduling, household budgeting, and family logistics.');
  assert.ok(result.informalSkills.includes('Schedule management'));
  assert.ok(result.equitySignals.includes('Career re-entry protection'));
  assert.equal('atsScore' in result, false);
});

test('Atlas accepts an empty optional goal and applies the strategic default', () => {
  const result = AtlasStartSchema.safeParse({
    resumeText: 'Candidate resume text with experience and skills.',
    pdfBase64: null,
    userGoal: '   ',
    mode: 'direct',
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.userGoal, DEFAULT_ATLAS_GOAL);
});

test('Atlas accepts the exact Results-to-Atlas funnel payload shape', () => {
  const result = AtlasStartSchema.safeParse({
    analysisId: 'share-token',
    resumeText: '',
    pdfBase64: null,
    userGoal: '',
    mode: 'funnel',
    confirmedAnswers: {},
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.analysisId, 'share-token');
    assert.equal(result.data.resumeText, undefined);
    assert.equal(result.data.pdfBase64, undefined);
  }
});
