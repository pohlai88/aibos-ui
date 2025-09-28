#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * Analyzes bundle size, composition, and optimization opportunities
 * for the UI package to ensure it meets enterprise standards.
 */

import { safeJoin } from '@aibos/utils';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync, constants as Z } from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  brotliSize: number;
  files: Array<{
    name: string;
    size: number;
    percentage: number;
    gzippedSize: number;
    brotliSize: number;
  }>;
  dependencies: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  recommendations: string[];
}

interface SizeLimit {
  path: string;
  limit: string;
  actualSize?: number;
  actualGzippedSize?: number;
  actualBrotliSize?: number;
  exceeded?: boolean;
}

function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzippedSize(filePath: string): number {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return 0;

  const buf = fs.readFileSync(filePath);
  try {
    return gzipSync(new Uint8Array(buf), { level: 9 }).length;
  } catch {
    return 0;
  }
}

function getBrotliSize(filePath: string): number {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return 0;

  const buf = fs.readFileSync(filePath);
  try {
    return brotliCompressSync(new Uint8Array(buf), {
      params: {
        [Z.BROTLI_PARAM_QUALITY]: 11,
        [Z.BROTLI_PARAM_MODE]: Z.BROTLI_MODE_TEXT,
      },
    }).length;
  } catch {
    return 0;
  }
}

function parseSizeLimit(limit: string): number {
  // Parse size limit without regex to avoid security warnings
  const trimmed = limit.trim();
  const unitMatch = trimmed.match(/(KB|MB|GB)$/i);
  const unit = unitMatch ? unitMatch[0].toUpperCase() : 'KB';
  const valueString = unitMatch ? trimmed.slice(0, -unitMatch[0].length).trim() : trimmed;

  const value = parseFloat(valueString);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid size limit format: ${limit}`);
  }

  switch (unit) {
    case 'KB':
      return value * 1024;
    case 'MB':
      return value * 1024 * 1024;
    case 'GB':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

function analyzeBundle(): BundleAnalysis {
  const arguments_ = process.argv.slice(2);
  const distributionArgument = arguments_.find((a) => a.startsWith('--dist='));
  const distributionPath = distributionArgument
    ? path.resolve(process.cwd(), distributionArgument.split('=')[1]!)
    : path.join(__dirname, '../dist');
  const analysis: BundleAnalysis = {
    totalSize: 0,
    gzippedSize: 0,
    brotliSize: 0,
    files: [],
    dependencies: [],
    recommendations: [],
  };

  // Recursively gather files from dist; ignore source maps by default
  const allowed = new Set(['.js', '.cjs', '.mjs', '.css']);
  function walk(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = safeJoin(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(fp));
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name);
        if (entry.name.endsWith('.map')) continue;
        if (allowed.has(extension)) out.push(fp);
      }
    }
    return out;
  }

  const files = walk(distributionPath);
  for (const fp of files) {
    const rel = path.relative(distributionPath, fp).replaceAll(path.sep, '/');
    const size = getFileSize(fp);
    if (size <= 0) continue;
    const gz = getGzippedSize(fp);
    const br = getBrotliSize(fp);
    analysis.files.push({
      name: rel,
      size,
      percentage: 0,
      gzippedSize: gz,
      brotliSize: br,
    });
    analysis.totalSize += size;
    analysis.gzippedSize += gz;
    analysis.brotliSize += br;
  }

  // Calculate percentages
  if (analysis.totalSize > 0) {
    analysis.files.forEach((file) => {
      file.percentage = (file.size / analysis.totalSize) * 100;
    });
  }

  // Analyze dependencies (simplified - would need more sophisticated analysis)
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    Object.keys(dependencies).forEach((dep) => {
      // Estimate dependency size (this is simplified)
      const estimatedSize = 5000; // 5KB average
      analysis.dependencies.push({
        name: dep,
        size: estimatedSize,
        percentage: analysis.totalSize ? (estimatedSize / analysis.totalSize) * 100 : 0,
      });
    });
  }

  // Generate recommendations
  if (analysis.totalSize > 50 * 1024) {
    // 50KB
    analysis.recommendations.push('Bundle size exceeds 50KB limit - consider code splitting');
  }

  if (analysis.gzippedSize > 20 * 1024) {
    // 20KB gzipped
    analysis.recommendations.push('Gzipped size exceeds 20KB - optimize for critical path');
  }
  if (analysis.brotliSize > 18 * 1024) {
    // Slightly stricter for Brotli
    analysis.recommendations.push(
      'Brotli size exceeds 18KB - consider trimming non-critical exports',
    );
  }

  const largeFiles = analysis.files.filter((file) => file.size > 10 * 1024); // 10KB
  if (largeFiles.length > 0) {
    analysis.recommendations.push(
      `Large files detected: ${largeFiles.map((f) => f.name).join(', ')}`,
    );
  }

  return analysis;
}

interface SizeLimitConfig {
  path: string;
  limit: string;
}

function checkSizeLimits(): SizeLimit[] {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const sizeLimits = packageJson['size-limit'] || [];

  return sizeLimits.map((limit: SizeLimitConfig) => {
    const filePath = path.join(__dirname, '../dist', limit.path);
    const actualSize = getFileSize(filePath);
    const actualGzippedSize = getGzippedSize(filePath);
    const actualBrotliSize = getBrotliSize(filePath);
    const limitSize = parseSizeLimit(limit.limit);

    return {
      path: limit.path,
      limit: limit.limit,
      actualSize,
      actualGzippedSize,
      actualBrotliSize,
      exceeded: actualSize > limitSize,
    };
  });
}

function generateReport(analysis: BundleAnalysis, sizeLimits: SizeLimit[]): void {
  const arguments_ = process.argv.slice(2);
  const json = arguments_.includes('--json');
  if (json) {
    console.log(JSON.stringify({ analysis, sizeLimits }, undefined, 2));
    return;
  }
  console.log('📦 Bundle Analysis Report');
  console.log('=========================');

  console.log(`\n📊 Total Bundle Size:`);
  console.log(`  - Uncompressed: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
  console.log(`  - Gzipped: ${(analysis.gzippedSize / 1024).toFixed(2)} KB`);
  console.log(`  - Brotli: ${(analysis.brotliSize / 1024).toFixed(2)} KB`);

  console.log(`\n📁 File Breakdown:`);
  analysis.files
    .sort((a, b) => b.size - a.size)
    .forEach((file) => {
      console.log(
        `  - ${file.name}: ${(file.size / 1024).toFixed(2)} KB (${file.percentage.toFixed(1)}%) | gzip ${(file.gzippedSize / 1024).toFixed(2)} KB | br ${(file.brotliSize / 1024).toFixed(2)} KB`,
      );
    });

  console.log(`\n🔍 Size Limit Compliance:`);
  sizeLimits.forEach((limit) => {
    const status = limit.exceeded ? '❌' : '✅';
    const actualKB = limit.actualSize ? (limit.actualSize / 1024).toFixed(2) : 'N/A';
    console.log(`  ${status} ${limit.path}: ${actualKB} KB / ${limit.limit}`);
  });

  if (analysis.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    analysis.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });
  }

  // Check for critical path optimization
  const criticalFiles = analysis.files.filter(
    (file) => file.name.includes('tokens') || file.name.includes('utils'),
  );

  if (criticalFiles.length > 0) {
    const criticalSize = criticalFiles.reduce((sum, file) => sum + file.size, 0);
    if (criticalSize > 5 * 1024) {
      // 5KB
      console.log(`\n⚠️  Critical path files exceed 5KB: ${(criticalSize / 1024).toFixed(2)} KB`);
      console.log(`   Consider splitting critical tokens from non-critical ones`);
    }
  }
}

function main(): void {
  try {
    const analysis = analyzeBundle();
    const sizeLimits = checkSizeLimits();
    generateReport(analysis, sizeLimits);

    // Check if any size limits are exceeded
    const exceededLimits = sizeLimits.filter((limit) => limit.exceeded);
    if (exceededLimits.length > 0) {
      console.log('\n❌ Size limits exceeded!');
      process.exit(1);
    }

    console.log('\n🎉 Bundle analysis completed successfully!');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

// Run analysis if this script is executed directly
if (import.meta.url.includes('analyze-bundle.ts')) {
  main();
}

export { analyzeBundle, checkSizeLimits, type BundleAnalysis, type SizeLimit };
