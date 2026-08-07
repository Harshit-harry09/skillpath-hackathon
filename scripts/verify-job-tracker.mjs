// updated
/**
 * Verification Script for Live Company Job Tracker
 * Checks:
 * 1. Greenhouse API returns valid data for real board tokens
 * 2. Deduplication keyed on Greenhouse `id` works across multiple sync runs
 * 3. Invalid board token failure isolation works without breaking valid ones
 */

import { validateGreenhouseBoardToken, refreshCompanyJobs } from '../skillpath/lib/greenhouse.js';

// Note: To test DB interactions via Node script, load env vars from .env.local
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../skillpath/.env.local');

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

async function runVerification() {
  console.log('=== STARTING VERIFICATION FOR LIVE COMPANY JOB TRACKER ===\n');

  // Test 1: Greenhouse Endpoint Validation
  console.log('--- Test 1: Greenhouse Board Token Validation ---');
  const tokensToTest = ['stripe', 'cloudflare', 'github', 'nonexistent_token_xyz_9999'];
  
  for (const token of tokensToTest) {
    const val = await validateGreenhouseBoardToken(token);
    console.log(`Token "${token}": valid=${val.valid}, jobs=${val.totalJobs}, error=${val.error || 'none'}`);
  }
  console.log('✓ Test 1 complete.\n');

  // Test 2: Double Refresh & Deduplication
  console.log('--- Test 2: Sync & Deduplication Test on "stripe" ---');
  console.log('Run 1: Initial Sync for stripe...');
  const res1 = await refreshCompanyJobs('stripe', 'Stripe');
  console.log('Sync 1 result:', res1);

  console.log('Run 2: Immediate Re-Sync for stripe (expect 0 new inserted)...');
  const res2 = await refreshCompanyJobs('stripe', 'Stripe');
  console.log('Sync 2 result:', res2);

  if (res2.new_inserted === 0) {
    console.log('✓ SUCCESS: Zero duplicate postings inserted on second run!');
  } else {
    console.error('❌ FAILURE: Duplicates were inserted on second run!');
  }
  console.log('\n--- Test 3: Per-Company Error Isolation ---');
  console.log('Refreshing "cloudflare" and "nonexistent_token_xyz_9999" sequentially...');
  const resCloudflare = await refreshCompanyJobs('cloudflare', 'Cloudflare');
  console.log('Cloudflare Sync Result:', resCloudflare);

  const resInvalid = await refreshCompanyJobs('nonexistent_token_xyz_9999', 'Invalid Board');
  console.log('Invalid Token Sync Result (expected error):', resInvalid);

  if (resCloudflare.error === null && resInvalid.error !== null) {
    console.log('✓ SUCCESS: Error isolated to bad token, valid company sync succeeded!');
  } else {
    console.error('❌ FAILURE: Error handling leak detected!');
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Unhandled Verification Error:', err);
  process.exit(1);
});
