/**
 * Performance Regression Detection
 * 
 * Compares current performance snapshot against baseline and fails if regressions exceed threshold.
 * Usage: tsx src/test/perf-diff.util.ts [--threshold=20] [--baseline=.artifacts/perf-snapshot.json]
 */

import fs from 'node:fs';
// import path from 'node:path';

interface Metric {
  median: number;
  p95: number;
  mean: number;
}

interface Snapshot {
  generatedAt: string;
  environment: {
    node: string;
    platform: string;
  };
  metrics: Record<string, Metric | number>;
}

interface Regression {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
}

const DEFAULT_THRESHOLD = 20; // 20% regression threshold
const DEFAULT_BASELINE = '.artifacts/perf-snapshot.json';

function parseArgs() {
  const args = process.argv.slice(2);
  let threshold = DEFAULT_THRESHOLD;
  let baseline = DEFAULT_BASELINE;

  for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
      const thresholdValue = arg.split('=')[1];
      if (thresholdValue) {
        threshold = parseFloat(thresholdValue);
      }
    } else if (arg.startsWith('--baseline=')) {
      const baselineValue = arg.split('=')[1];
      if (baselineValue) {
        baseline = baselineValue;
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx src/test/perf-diff.util.ts [options]

Options:
  --threshold=<number>  Regression threshold percentage (default: ${DEFAULT_THRESHOLD})
  --baseline=<path>     Path to baseline snapshot (default: ${DEFAULT_BASELINE})
  --help, -h           Show this help message

Examples:
  tsx src/test/perf-diff.util.ts
  tsx src/test/perf-diff.util.ts --threshold=15 --baseline=./baseline.json
      `);
      process.exit(0);
    }
  }

  return { threshold, baseline };
}

function loadSnapshot(filePath: string): Snapshot | null {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Baseline snapshot not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as Snapshot;
  } catch (error) {
    console.error(`❌ Failed to load snapshot ${filePath}:`, error);
    return null;
  }
}

function extractNumericValue(value: Metric | number): number {
  if (typeof value === 'number') return value;
  return value.p95; // Use p95 as the primary metric for regression detection
}

function detectRegressions(baseline: Snapshot, current: Snapshot, threshold: number): Regression[] {
  const regressions: Regression[] = [];

  for (const [metric, currentValue] of Object.entries(current.metrics)) {
    const baselineValue = baseline.metrics[metric];
    if (!baselineValue) {
      console.log(`⚠️  New metric: ${metric} (no baseline)`);
      continue;
    }

    const baselineNum = extractNumericValue(baselineValue);
    const currentNum = extractNumericValue(currentValue);

    if (!Number.isFinite(baselineNum) || !Number.isFinite(currentNum)) {
      continue; // Skip non-numeric metrics
    }

    const change = currentNum - baselineNum;
    const changePercent = (change / baselineNum) * 100;

    // Only flag as regression if performance got worse (higher numbers = slower)
    if (changePercent > threshold) {
      regressions.push({
        metric,
        baseline: baselineNum,
        current: currentNum,
        change,
        changePercent,
      });
    }
  }

  return regressions;
}

function formatRegression(regression: Regression): string {
  const { metric, baseline, current, changePercent } = regression;
  const direction = changePercent > 0 ? '📈' : '📉';
  return `${direction} ${metric}: ${baseline.toFixed(2)}ms → ${current.toFixed(2)}ms (${changePercent.toFixed(1)}%)`;
}

function main() {
  const { threshold, baseline } = parseArgs();

  console.log(`🔍 Checking performance regressions (threshold: ${threshold}%)`);
  console.log(`📊 Baseline: ${baseline}`);

  // Load current snapshot from stdin or environment
  let currentSnapshot: Snapshot;
  try {
    const currentPath = process.env.PERF_SNAPSHOT_PATH || '.artifacts/perf-snapshot.json';
    const loadedSnapshot = loadSnapshot(currentPath);
    if (!loadedSnapshot) {
      console.error('❌ Failed to load current snapshot');
      process.exit(1);
    }
    currentSnapshot = loadedSnapshot;
  } catch (error) {
    console.error('❌ Failed to load current snapshot:', error);
    process.exit(1);
  }

  // Load baseline snapshot
  const baselineSnapshot = loadSnapshot(baseline);
  if (!baselineSnapshot) {
    console.log('⚠️  No baseline found - treating as first run');
    console.log('✅ Performance check passed (no baseline)');
    process.exit(0);
  }

  // Detect regressions
  const regressions = detectRegressions(baselineSnapshot, currentSnapshot, threshold);

  if (regressions.length === 0) {
    console.log('✅ Performance check passed - no regressions detected');
    process.exit(0);
  }

  // Report regressions
  console.log(`\n❌ Performance regressions detected (${regressions.length}):`);
  regressions.forEach(regression => {
    console.log(`  ${formatRegression(regression)}`);
  });

  console.log(`\n💡 Consider investigating these metrics or adjusting the threshold (currently ${threshold}%)`);
  process.exit(1);
}

// Run main function
main();
