#!/usr/bin/env node

/**
 * Bundle Budget Checker - Milestone 8 Performance Optimization
 * 
 * Enforces bundle size budgets to prevent performance regressions.
 * Fails CI if bundles exceed defined limits.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Bundle size budgets (in bytes, gzipped)
const BUDGETS = {
  main: 150_000,        // 150KB - main bundle
  async: 180_000,       // 180KB - largest async chunk
  totalInitial: 220_000, // 220KB - total initial JS
  individual: 50_000,   // 50KB - individual component chunks
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function gzSize(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return zlib.gzipSync(buffer).length;
  } catch (error) {
    log(`❌ Error reading file ${filePath}: ${error.message}`, 'red');
    return 0;
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function checkBundleBudgets() {
  log('🔍 Checking bundle size budgets...', 'blue');
  
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    log('❌ dist/ directory not found. Run build first.', 'red');
    process.exit(1);
  }

  const results = [];
  let totalInitialSize = 0;
  let largestAsyncSize = 0;
  let mainBundleSize = 0;

  // Check main bundle
  const mainBundlePath = path.join(distPath, 'index.js');
  if (fs.existsSync(mainBundlePath)) {
    mainBundleSize = gzSize(mainBundlePath);
    results.push({
      name: 'Main Bundle (index.js)',
      size: mainBundleSize,
      budget: BUDGETS.main,
      path: mainBundlePath,
    });
    totalInitialSize += mainBundleSize;
  }

  // Check individual component bundles
  const componentsPath = path.join(distPath, 'components');
  if (fs.existsSync(componentsPath)) {
    const componentFiles = fs.readdirSync(componentsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(componentsPath, file));

    componentFiles.forEach(filePath => {
      const size = gzSize(filePath);
      const fileName = path.basename(filePath);
      
      results.push({
        name: `Component: ${fileName}`,
        size,
        budget: BUDGETS.individual,
        path: filePath,
      });
      
      totalInitialSize += size;
    });
  }

  // Check async chunks (largest ones)
  const chunkFiles = fs.readdirSync(distPath)
    .filter(file => file.startsWith('chunk-') && file.endsWith('.js'))
    .map(file => path.join(distPath, file));

  chunkFiles.forEach(filePath => {
    const size = gzSize(filePath);
    const fileName = path.basename(filePath);
    
    if (size > largestAsyncSize) {
      largestAsyncSize = size;
    }
    
    // Only report chunks over 10KB
    if (size > 10_000) {
      results.push({
        name: `Chunk: ${fileName}`,
        size,
        budget: BUDGETS.async,
        path: filePath,
      });
    }
  });

  // Add budget checks
  results.push({
    name: 'Total Initial JS',
    size: totalInitialSize,
    budget: BUDGETS.totalInitial,
    path: 'calculated',
  });

  results.push({
    name: 'Largest Async Chunk',
    size: largestAsyncSize,
    budget: BUDGETS.async,
    path: 'calculated',
  });

  // Display results
  log('\n📊 Bundle Size Analysis:', 'bold');
  log('─'.repeat(80), 'blue');
  
  let hasFailures = false;
  
  results.forEach(result => {
    const isOverBudget = result.size > result.budget;
    const status = isOverBudget ? '❌ OVER BUDGET' : '✅ OK';
    const color = isOverBudget ? 'red' : 'green';
    
    log(`${status.padEnd(15)} ${result.name.padEnd(30)} ${formatBytes(result.size).padStart(10)} / ${formatBytes(result.budget)}`, color);
    
    if (isOverBudget) {
      hasFailures = true;
    }
  });

  log('─'.repeat(80), 'blue');
  
  // Summary
  if (hasFailures) {
    log('\n❌ Bundle size budgets exceeded!', 'red');
    log('Consider implementing code splitting or removing unused dependencies.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All bundle size budgets met!', 'green');
    log(`Main bundle: ${formatBytes(mainBundleSize)} (target: ${formatBytes(BUDGETS.main)})`, 'green');
    log(`Total initial: ${formatBytes(totalInitialSize)} (target: ${formatBytes(BUDGETS.totalInitial)})`, 'green');
    log(`Largest async: ${formatBytes(largestAsyncSize)} (target: ${formatBytes(BUDGETS.async)})`, 'green');
  }
}

// Run the check
checkBundleBudgets();
