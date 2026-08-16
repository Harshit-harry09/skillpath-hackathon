import fs from 'fs';
import path from 'path';

console.log("=== SKILLPATH API ROUTE SMOKE TEST ===");

const apiDir = path.join(process.cwd(), 'app', 'api');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const routes = findRouteFiles(apiDir);
console.log(`Total Route Files Detected: ${routes.length}`);

let passed = 0;
let failed = 0;

for (const routePath of routes) {
  const relPath = path.relative(process.cwd(), routePath).replace(/\\/g, '/');
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    const hasExport = /export\s+(async\s+)?function\s+(GET|POST|PATCH|DELETE|PUT)/.test(content);
    if (hasExport) {
      console.log(`[PASS] ${relPath}`);
      passed++;
    } else {
      console.error(`[FAIL] ${relPath} - No HTTP method exports found`);
      failed++;
    }
  } catch (err) {
    console.error(`[FAIL] ${relPath} - ${err.message}`);
    failed++;
  }
}

console.log(`\nSmoke Test Summary: ${passed} passed, ${failed} failed.`);
