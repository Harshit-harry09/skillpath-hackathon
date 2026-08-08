const fs = require('fs');

const routes = [
  'app/api/active-job/archive/route.ts',
  'app/api/active-job/history/route.ts',
  'app/api/active-job/route.ts',
  'app/api/analyze-resume-flaws/route.ts',
  'app/api/battle/ai/route.ts',
  'app/api/battle/estimate/route.ts',
  'app/api/explore/[id]/route.ts',
  'app/api/generate-cover-lines/route.ts',
  'app/api/generate-linkedin-headlines/route.ts',
  'app/api/generate-resources/route.ts',
  'app/api/generate-star-bullets/route.ts',
  'app/api/profile/route.ts',
  'app/api/profile/share/route.ts',
  'app/api/profile/streak/route.ts',
  'app/api/profile/timeline/route.ts',
  'app/api/results/[id]/route.ts',
];

// Routes that also need force-dynamic (auth-gated, no dynamic currently)
const needDynamic = [
  'app/api/active-job/history/route.ts',
  'app/api/profile/streak/route.ts',
];

// Routes that also need force-dynamic for interview/recruiter
const alsoNeedDynamic = [
  'app/api/generate-interview-questions/route.ts',
  'app/api/recruiter/rank/route.ts',
];

const runtimeLine = "export const runtime = 'nodejs';";
const dynamicLine = "export const dynamic = 'force-dynamic';";

function addAfterLastImport(lines, lineToAdd) {
  let lastImportIdx = -1;
  // Also skip comment lines at top and empty lines
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('import ')) lastImportIdx = i;
  }
  if (lastImportIdx === -1) {
    // No import found, add after first non-empty line
    lastImportIdx = lines.findIndex(l => l.trim() !== '');
  }
  lines.splice(lastImportIdx + 1, 0, lineToAdd);
}

function addAfterRuntime(lines, lineToAdd) {
  const runtimeIdx = lines.findIndex(l => l.includes("runtime = 'nodejs'"));
  if (runtimeIdx !== -1) {
    lines.splice(runtimeIdx + 1, 0, lineToAdd);
  }
}

// Fix routes missing runtime
for (const r of routes) {
  let src = fs.readFileSync(r, 'utf8');
  const lines = src.split('\n');
  let changed = false;

  if (!src.includes("'nodejs'")) {
    addAfterLastImport(lines, runtimeLine);
    changed = true;
    console.log('Added runtime -> ' + r);
  }

  if (needDynamic.includes(r) && !src.includes('force-dynamic')) {
    addAfterRuntime(lines, dynamicLine);
    changed = true;
    console.log('Added dynamic -> ' + r);
  }

  if (changed) fs.writeFileSync(r, lines.join('\n'));
}

// Fix generate-interview-questions and recruiter/rank (missing dynamic only)
for (const r of alsoNeedDynamic) {
  let src = fs.readFileSync(r, 'utf8');
  if (!src.includes('force-dynamic')) {
    const lines = src.split('\n');
    const runtimeIdx = lines.findIndex(l => l.includes("runtime = 'nodejs'"));
    if (runtimeIdx !== -1) {
      lines.splice(runtimeIdx + 1, 0, dynamicLine);
    } else {
      addAfterLastImport(lines, dynamicLine);
    }
    fs.writeFileSync(r, lines.join('\n'));
    console.log('Added dynamic -> ' + r);
  }
}

console.log('\nAll done.');
