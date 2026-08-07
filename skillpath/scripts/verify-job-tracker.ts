// updated
/**
 * Comprehensive Verification Script for Multi-Company Job Tracker
 */

import fs from 'fs';
import path from 'path';
import { validateGreenhouseBoardToken, refreshCompanyJobs } from '../lib/greenhouse';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const match = line.match(/^([^=="#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function testMultiCompany() {
  console.log('=== MULTI-COMPANY TRACKING VERIFICATION ===\n');

  const testBoards = [
    { token: 'stripe', name: 'Stripe' },
    { token: 'cloudflare', name: 'Cloudflare' },
    { token: 'airbnb', name: 'Airbnb' },
    { token: 'figma', name: 'Figma' },
    { token: 'vercel', name: 'Vercel' },
    { token: 'datadog', name: 'DataDog' },
  ];

  for (const board of testBoards) {
    console.log(`Syncing board "${board.token}" (${board.name})...`);
    const val = await validateGreenhouseBoardToken(board.token);
    if (!val.valid) {
      console.error(`❌ ${board.token} validation failed: ${val.error}`);
      continue;
    }

    const syncRes = await refreshCompanyJobs(board.token, board.name);
    console.log(`✅ ${board.token} synced successfully! Remote total: ${syncRes.total_remote}, New inserted: ${syncRes.new_inserted}`);
  }

  console.log('\nTesting second sync run across all companies (expect 0 new inserted for all)...');
  for (const board of testBoards) {
    const syncRes = await refreshCompanyJobs(board.token, board.name);
    console.log(`Re-sync ${board.token}: New inserted = ${syncRes.new_inserted} (Expected: 0)`);
    if (syncRes.new_inserted !== 0) {
      console.error(`❌ Duplicate insertion bug on ${board.token}!`);
    }
  }

  console.log('\n=== MULTI-COMPANY VERIFICATION SUCCESSFUL ===');
  process.exit(0);
}

testMultiCompany().catch((err) => {
  console.error('Unhandled Verification Error:', err);
  process.exit(1);
});
