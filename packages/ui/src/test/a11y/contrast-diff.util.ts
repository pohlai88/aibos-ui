/**
 * Contrast Snapshot Diff Utility
 * 
 * Compares two contrast snapshot files and fails if any ratio regresses
 * by more than the specified threshold. Useful for CI regression detection.
 */

import fs from 'node:fs';
// import path from 'node:path';

interface ContrastSnapshot {
  generatedAt: string;
  snapshot: Record<string, Record<string, number>>;
}

interface DiffResult {
  hasRegressions: boolean;
  regressions: Array<{
    theme: string;
    component: string;
    oldRatio: number;
    newRatio: number;
    delta: number;
  }>;
  summary: string;
}

/**
 * Compare two contrast snapshot files
 * @param baselinePath Path to the baseline snapshot file
 * @param currentPath Path to the current snapshot file
 * @param threshold Maximum allowed regression (default: 0.3)
 * @returns Diff result with regressions and summary
 */
export function compareContrastSnapshots(
  baselinePath: string,
  currentPath: string,
  threshold: number = 0.3
): DiffResult {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as ContrastSnapshot;
  const current = JSON.parse(fs.readFileSync(currentPath, 'utf8')) as ContrastSnapshot;

  const regressions: DiffResult['regressions'] = [];

  // Check each theme and component
  for (const [theme, components] of Object.entries(current.snapshot)) {
    const baselineTheme = baseline.snapshot[theme];
    if (!baselineTheme) continue;

    for (const [component, currentRatio] of Object.entries(components)) {
      const baselineRatio = baselineTheme[component];
      if (baselineRatio === undefined) continue;

      const delta = baselineRatio - currentRatio;
      if (delta > threshold) {
        regressions.push({
          theme,
          component,
          oldRatio: baselineRatio,
          newRatio: currentRatio,
          delta,
        });
      }
    }
  }

  const summary = regressions.length > 0
    ? `❌ Found ${regressions.length} contrast regression(s) exceeding threshold ${threshold}`
    : `✅ No contrast regressions found (threshold: ${threshold})`;

  return {
    hasRegressions: regressions.length > 0,
    regressions,
    summary,
  };
}

/**
 * CLI-friendly function for CI usage
 */
export function runContrastDiff(
  baselinePath: string,
  currentPath: string,
  threshold: number = 0.3
): void {
  const result = compareContrastSnapshots(baselinePath, currentPath, threshold);
  
  console.log(result.summary);
  
  if (result.hasRegressions) {
    console.log('\nRegressions:');
    result.regressions.forEach(({ theme, component, oldRatio, newRatio, delta }) => {
      console.log(`  ${theme}:${component} ${oldRatio.toFixed(2)} → ${newRatio.toFixed(2)} (Δ${delta.toFixed(2)})`);
    });
    
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node contrast-diff.util.js <baseline> <current> [threshold]');
    console.error('Example: node contrast-diff.util.js .artifacts/baseline.json .artifacts/current.json 0.3');
    process.exit(1);
  }

  const [baselinePath, currentPath, thresholdStr] = args;
  
  // TypeScript guard: we already checked args.length >= 2 above
  if (!baselinePath || !currentPath) {
    console.error('Error: Missing required arguments');
    process.exit(1);
  }
  
  const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.3;
  
  runContrastDiff(baselinePath, currentPath, threshold);
}
