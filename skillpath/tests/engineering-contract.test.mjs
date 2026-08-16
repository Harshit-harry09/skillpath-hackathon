// updated
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('generated files are excluded from the lint target', () => {
  const config = read('eslint.config.mjs');
  assert.match(config, /\.next\/\*\*/);
  assert.match(config, /next-env\.d\.ts/);
});

test('unknown analysis IDs cannot become successful sample responses', () => {
  const route = read('app/api/results/[id]/route.ts');
  assert.match(route, /status: 404/);
  assert.match(route, /error: "not_found"/);
  assert.match(route, /status: 503/);
  assert.doesNotMatch(route, /Fallback to sample analysis if not found/);
});

test('raw analysis payloads are not cached in browser storage', () => {
  assert.doesNotMatch(read('app/results/[id]/page.tsx'), /sessionStorage/);
  assert.doesNotMatch(read('components/explore/ExploreResultsClient.tsx'), /sessionStorage/);
  assert.doesNotMatch(read('app/analyze/page.tsx'), /analysis_\$\{/);
});

test('the fast analysis response has no synchronous Gemini dependency', () => {
  const route = read('app/api/analyze/route.ts');
  assert.doesNotMatch(route, /callGemini/);
  assert.match(route, /summary_source: 'local_pipeline'/);
  assert.match(route, /persistence_failed/);
});

test('AI routes have an explicit rate-limit guard', () => {
  for (const file of [
    'app/api/analyze/route.ts',
    'app/api/explore/route.ts',
    'app/api/battle/estimate/route.ts',
    'app/api/generate/[tool]/route.ts',
  ]) {
    assert.match(read(file), /runGeneratorTool|guardAiRequest/);
  }
});

test('Atlas routes guard AI work and expose every page connection they call', () => {
  for (const file of [
    'app/api/atlas/analyze/route.ts',
    'app/api/atlas/analyze/stream/route.ts',
    'app/api/atlas/chat/route.ts',
    'app/api/atlas/agent/rerun/route.ts',
    'app/api/atlas/compare/route.ts',
  ]) {
    assert.match(read(file), /guardAiRequest/);
  }
  assert.match(read('app/atlas/page.tsx'), /api\/atlas\/compare/);
  assert.match(read('app/api/atlas/compare/route.ts'), /runRoleSwitchComparisonAgent/);
});

test('public result pages can generate learning plans as guests', () => {
  const route = read('app/api/results/[id]/plan/route.ts');
  assert.match(route, /getAuthUserSafe/);
  assert.match(route, /guardAiRequest\(req, user\?\.uid, user \? 30 : 5\)/);
  assert.doesNotMatch(route, /getAuthUser\(req\)/);
});

test('learning-plan generation has a bounded AI call and deterministic fallback', () => {
  const route = read('app/api/results/[id]/plan/route.ts');
  const gemini = read('lib/gemini.ts');
  assert.match(route, /gemini-2\.5-flash/);
  assert.match(route, /timeoutMs: 15000/);
  assert.match(route, /buildFallbackLearningPlan/);
  assert.match(route, /learning_plan_source/);
  assert.match(gemini, /timeoutMs\?\: number/);
});

test('Results cards expose evidence, action, and accuracy feedback', () => {
  const page = read('app/results/[id]/page.tsx');
  const card = read('components/results/SkillCard.tsx');
  const feedback = read('app/api/results/[id]/feedback/route.ts');
  assert.match(page, /requirements checked/);
  assert.match(page, /learning_plan_source/);
  assert.match(card, /Evidence metadata/);
  assert.match(card, /Next proof/);
  assert.match(card, /Add resume evidence/);
  assert.match(card, /Is this gap accurate/);
  assert.match(feedback, /getAuthUserSafe/);
  assert.match(feedback, /analysis_feedback/);
});

test('analysis enrichment stays off the first response and validates source evidence', () => {
  const analyzeRoute = read('app/api/analyze/route.ts');
  const enrichRoute = read('app/api/analyze/[id]/enrich/route.ts');
  const schema = read('lib/ai-analysis-schema.ts');

  assert.match(analyzeRoute, /enrichment_status: isEnrichmentConfigured\(\) \? 'pending' : 'not_configured'/);
  assert.match(analyzeRoute, /storeEnrichmentPayload/);
  assert.match(enrichRoute, /enrichment_status: 'processing'/);
  assert.match(enrichRoute, /scoreEvidenceCoverage/);
  assert.match(schema, /quoteAppearsInText/);
  assert.match(schema, /filterEvidenceToSource/);
});
