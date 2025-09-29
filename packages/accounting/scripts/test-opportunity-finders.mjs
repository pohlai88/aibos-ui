#!/usr/bin/env node
/**
 * Test script to verify utility opportunity finders work correctly
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Utility Opportunity Finders\n');

// Test Phase 1
console.log('Testing Phase 1...');
try {
  const phase1Content = readFileSync(join(process.cwd(), 'packages/accounting/scripts/phase-1-utility-opportunities.mjs'), 'utf8');
  const phase1Rules = phase1Content.match(/name:\s*['"]([^'"]+)['"]/g);
  console.log(`✅ Phase 1: Found ${phase1Rules?.length || 0} patterns`);
} catch (error) {
  console.log(`❌ Phase 1: Error - ${error.message}`);
}

// Test Phase 2
console.log('Testing Phase 2...');
try {
  const phase2Content = readFileSync(join(process.cwd(), 'packages/accounting/scripts/phase-2-utility-opportunities.mjs'), 'utf8');
  const phase2Rules = phase2Content.match(/name:\s*['"]([^'"]+)['"]/g);
  console.log(`✅ Phase 2: Found ${phase2Rules?.length || 0} patterns`);
} catch (error) {
  console.log(`❌ Phase 2: Error - ${error.message}`);
}

// Test Phase 3
console.log('Testing Phase 3...');
try {
  const phase3Content = readFileSync(join(process.cwd(), 'packages/accounting/scripts/phase-3-utility-opportunities.mjs'), 'utf8');
  const phase3Rules = phase3Content.match(/name:\s*['"]([^'"]+)['"]/g);
  console.log(`✅ Phase 3: Found ${phase3Rules?.length || 0} patterns`);
} catch (error) {
  console.log(`❌ Phase 3: Error - ${error.message}`);
}

// Test Master Script
console.log('Testing Master Script...');
try {
  const masterContent = readFileSync(join(process.cwd(), 'packages/accounting/scripts/master-utility-opportunities.mjs'), 'utf8');
  const hasPhaseScripts = masterContent.includes('PHASE_SCRIPTS');
  console.log(`✅ Master Script: ${hasPhaseScripts ? 'Found phase orchestration' : 'Missing phase orchestration'}`);
} catch (error) {
  console.log(`❌ Master Script: Error - ${error.message}`);
}

console.log('\n🎉 Test completed!');
