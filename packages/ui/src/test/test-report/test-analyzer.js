#!/usr/bin/env node

/**
 * Test Analyzer Utility
 * 
 * Advanced analysis tool for the AI-BOS ERP UI test suite that provides:
 * - Detailed test coverage analysis
 * - Performance metrics
 * - Failure pattern detection
 * - Test suite health monitoring
 * - Recommendations for improvement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestAnalyzer {
    constructor(opts = {}) {
        this.testFiles = [];
        this.rootDir = path.resolve(opts.dir ?? path.join(__dirname, '..'));
        this.maxDepth = Number.isFinite(opts.depth) ? Math.max(0, opts.depth) : 5;
        this.recursive = Boolean(opts.recursive ?? true);
        this._analysisCache = new Map(); // filePath -> analysis
        this.analysisResults = {
            coverage: {},
            performance: {},
            failures: [],
            recommendations: [],
            healthScore: 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Discover all test files
     */
    discoverTestFiles() {
        if (this.recursive) {
            this.scanDirectory(this.rootDir, 0);
        } else {
            try {
                const items = fs.readdirSync(this.rootDir);
                for (const item of items) {
                    if (this.isTestFile(item)) {
                        const fullPath = path.join(this.rootDir, item);
                        const stat = fs.statSync(fullPath);
                        this.testFiles.push({
                            name: item,
                            path: fullPath,
                            relativePath: item,
                            size: stat.size,
                            modified: stat.mtime
                        });
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not scan test directory ${this.rootDir}:`, error.message);
            }
        }
        return this.testFiles;
    }

    /**
     * Recursively scan directory for test files
     */
    scanDirectory(dir, depth = 0) {
        if (depth > this.maxDepth) return;
        const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo', '.cache']);
        const dirName = path.basename(dir);
        if (skipDirs.has(dirName)) return;
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                let stat;
                try {
                    stat = fs.statSync(fullPath);
                } catch {
                    continue;
                }
                if (stat.isDirectory()) {
                    this.scanDirectory(fullPath, depth + 1);
                } else if (this.isTestFile(item)) {
                    this.testFiles.push({
                        name: item,
                        path: fullPath,
                        relativePath: path.relative(this.rootDir, fullPath),
                        size: stat.size,
                        modified: stat.mtime
                    });
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
        }
    }

    /**
     * Check if file is a test file
     */
    isTestFile(filename) {
        return /\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(filename);
    }

    /**
     * Analyze test file content
     */
    analyzeTestFile(filePath) {
        if (this._analysisCache.has(filePath)) return this._analysisCache.get(filePath);
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const content = this.stripCommentsAndStrings(raw);
            const analysis = {
                describeBlocks: this.countMatches(content, /\bdescribe\s*\(/g),
                testCases: this.countMatches(content, /\b(it|test)\s*\(/g),
                beforeEach: this.countMatches(content, /\bbeforeEach\s*\(/g),
                afterEach: this.countMatches(content, /\bafterEach\s*\(/g),
                beforeAll: this.countMatches(content, /\bbeforeAll\s*\(/g),
                afterAll: this.countMatches(content, /\bafterAll\s*\(/g),
                imports: this.extractImports(raw),
                assertions: this.countMatches(content, /\bexpect\s*\(/g),
                mocks: this.countMatches(content, /\b(vi|jest)\.(fn|mock|spyOn|mocked)\b/g),
                performanceTests: this.countMatches(content, /\b(performance|benchmark|speed|timing)\b/gi),
                accessibilityTests: this.countMatches(content, /\b(a11y|accessibility|axe)\b/gi),
                focusedTests: this.countMatches(content, /\.(only)\s*\(/g),
                skippedTests: this.countMatches(content, /\.(skip)\s*\(/g),
                coverage: this.estimateCoverage(content)
            };
            this._analysisCache.set(filePath, analysis);
            return analysis;
        } catch (error) {
            console.warn(`Warning: Could not analyze ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Count regex matches in content
     */
    countMatches(content, regex) {
        const matches = content.match(regex);
        return matches ? matches.length : 0;
    }

    /**
     * Extract import statements
     */
    extractImports(content) {
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }

    /**
     * Estimate test coverage based on content analysis
     */
    estimateCoverage(content) {
        const testKeywords = ['\\bdescribe\\b', '\\bit\\b', '\\btest\\b', '\\bexpect\\b', '\\brender\\b', '\\bscreen\\b'];
        const implementationKeywords = ['\\bfunction\\b', '\\bclass\\b', '\\bconst\\b', '\\blet\\b', '\\bvar\\b', '\\bexport\\b'];
        const testCount = testKeywords.reduce((count, kw) => count + this.countMatches(content, new RegExp(kw, 'gi')), 0);
        const implCount = implementationKeywords.reduce((count, kw) => count + this.countMatches(content, new RegExp(kw, 'gi')), 0);
        return implCount > 0 ? Math.min((testCount / implCount) * 100, 100) : 0;
    }

    /**
     * Very simple stripper for comments/strings to avoid false positives.
     * Not perfect, but good enough for signal.
     */
    stripCommentsAndStrings(src) {
        // remove /* */ comments
        let s = src.replace(/\/\*[\s\S]*?\*\//g, '');
        // remove // comments
        s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
        // remove template strings (naively)
        s = s.replace(/`[\s\S]*?`/g, '``');
        // remove '...' and "..."
        s = s.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, `''`).replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
        return s;
    }

    /**
     * Analyze test suite performance
     */
    analyzePerformance() {
        const performanceMetrics = {
            totalFiles: this.testFiles.length,
            totalSize: this.testFiles.reduce((sum, file) => sum + file.size, 0),
            averageFileSize: 0,
            largestFile: null,
            smallestFile: null,
            complexityScore: 0
        };

        if (this.testFiles.length > 0) {
            performanceMetrics.averageFileSize = performanceMetrics.totalSize / this.testFiles.length;
            performanceMetrics.largestFile = this.testFiles.reduce((max, file) => 
                file.size > max.size ? file : max);
            performanceMetrics.smallestFile = this.testFiles.reduce((min, file) => 
                file.size < min.size ? file : min);
        }

        // Calculate complexity score
        let totalComplexity = 0;
        for (const file of this.testFiles) {
            const analysis = this.analyzeTestFile(file.path);
            if (analysis) {
                const complexity = analysis.describeBlocks + analysis.testCases + 
                                 analysis.beforeEach + analysis.afterEach + 
                                 analysis.mocks + analysis.assertions +
                                 analysis.focusedTests + analysis.skippedTests;
                totalComplexity += complexity;
            }
        }
        
        performanceMetrics.complexityScore = totalComplexity;

        return performanceMetrics;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Analyze test file sizes
        const largeFiles = this.testFiles.filter(file => file.size > 10000);
        if (largeFiles.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                title: 'Large Test Files Detected',
                description: `${largeFiles.length} test files are larger than 10KB. Consider splitting them for better maintainability.`,
                files: largeFiles.map(f => f.name),
                action: 'Split large test files into smaller, focused test suites'
            });
        }

        // Analyze test coverage
        const lowCoverageFiles = this.testFiles.filter(file => {
            const analysis = this.analyzeTestFile(file.path);
            return analysis && analysis.coverage < 50;
        });

        if (lowCoverageFiles.length > 0) {
            recommendations.push({
                type: 'coverage',
                priority: 'high',
                title: 'Low Test Coverage',
                description: `${lowCoverageFiles.length} test files have estimated coverage below 50%.`,
                files: lowCoverageFiles.map(f => f.name),
                action: 'Add more test cases to improve coverage'
            });
        }

        // Check for missing accessibility tests
        const filesWithoutA11y = this.testFiles.filter(file => {
            const analysis = this.analyzeTestFile(file.path);
            return analysis && analysis.accessibilityTests === 0;
        });

        if (filesWithoutA11y.length > 0) {
            recommendations.push({
                type: 'accessibility',
                priority: 'medium',
                title: 'Missing Accessibility Tests',
                description: `${filesWithoutA11y.length} test files don't include accessibility tests.`,
                files: filesWithoutA11y.map(f => f.name),
                action: 'Add accessibility tests using axe-core or similar tools'
            });
        }

        // Check for performance tests
        const filesWithoutPerf = this.testFiles.filter(file => {
            const analysis = this.analyzeTestFile(file.path);
            return analysis && analysis.performanceTests === 0;
        });

        if (filesWithoutPerf.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'low',
                title: 'Missing Performance Tests',
                description: `${filesWithoutPerf.length} test files don't include performance tests.`,
                files: filesWithoutPerf.map(f => f.name),
                action: 'Consider adding performance benchmarks for critical components'
            });
        }

        // Focused/Skipped tests
        const focused = this.testFiles.filter(f => {
            const a = this.analyzeTestFile(f.path); return a && a.focusedTests > 0;
        });
        if (focused.length) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                title: 'Focused Tests Detected (describe.only / it.only)',
                description: `${focused.length} file(s) contain focused tests that can hide failures.`,
                files: focused.map(f => f.name),
                action: 'Remove .only usages or guard in CI (e.g., grep fail on \'.only(\')'
            });
        }
        const skipped = this.testFiles.filter(f => {
            const a = this.analyzeTestFile(f.path); return a && a.skippedTests > 0;
        });
        if (skipped.length) {
            recommendations.push({
                type: 'reliability',
                priority: 'low',
                title: 'Skipped Tests Present',
                description: `${skipped.length} file(s) contain skipped tests (.skip). Periodically review and re-enable.`,
                files: skipped.map(f => f.name),
                action: 'Track intentionally skipped tests and re-enable or remove if obsolete'
            });
        }

        return recommendations;
    }

    /**
     * Calculate overall health score
     */
    calculateHealthScore() {
        let score = 100;
        
        // Deduct points for large files
        const largeFiles = this.testFiles.filter(file => file.size > 10000);
        score -= largeFiles.length * 5;
        
        // Deduct points for low coverage
        const lowCoverageFiles = this.testFiles.filter(file => {
            const analysis = this.analyzeTestFile(file.path);
            return analysis && analysis.coverage < 50;
        });
        score -= lowCoverageFiles.length * 10;
        
        // Deduct points for missing accessibility tests
        const filesWithoutA11y = this.testFiles.filter(file => {
            const analysis = this.analyzeTestFile(file.path);
            return analysis && analysis.accessibilityTests === 0;
        });
        score -= filesWithoutA11y.length * 3;

        // Focused/Skipped tests penalties
        const focused = this.testFiles.filter(f => {
            const a = this.analyzeTestFile(f.path); return a && a.focusedTests > 0;
        }).length;
        const skipped = this.testFiles.filter(f => {
            const a = this.analyzeTestFile(f.path); return a && a.skippedTests > 0;
        }).length;
        score -= focused * 8;
        score -= skipped * 2;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate comprehensive analysis report
     */
    generateReport() {
        console.log('🔍 Analyzing Test Suite...\n');
        
        this.discoverTestFiles();
        
        const performance = this.analyzePerformance();
        const recommendations = this.generateRecommendations();
        const healthScore = this.calculateHealthScore();
        
        this.analysisResults = {
            coverage: this.analyzeCoverage(),
            performance,
            failures: this.analyzeFailures(),
            recommendations,
            healthScore,
            timestamp: new Date().toISOString(),
            testFiles: this.testFiles.map(file => ({
                ...file,
                analysis: this.analyzeTestFile(file.path)
            }))
        };
        
        return this.analysisResults;
    }

    /**
     * Analyze test coverage
     */
    analyzeCoverage() {
        const coverage = {
            total: 0,
            byCategory: {
                unit: 0,
                integration: 0,
                accessibility: 0,
                performance: 0
            },
            files: []
        };

        for (const file of this.testFiles) {
            const analysis = this.analyzeTestFile(file.path);
            if (analysis) {
                const fileCoverage = {
                    name: file.name,
                    coverage: analysis.coverage,
                    testCases: analysis.testCases,
                    assertions: analysis.assertions,
                    accessibility: analysis.accessibilityTests > 0,
                    performance: analysis.performanceTests > 0,
                    focused: analysis.focusedTests > 0,
                    skipped: analysis.skippedTests > 0
                };
                
                coverage.files.push(fileCoverage);
                coverage.total += analysis.coverage;
                
                if (analysis.accessibilityTests > 0) {
                    coverage.byCategory.accessibility++;
                }
                if (analysis.performanceTests > 0) {
                    coverage.byCategory.performance++;
                }
                coverage.byCategory.unit += analysis.testCases;
            }
        }

        coverage.total = coverage.files.length > 0 ? coverage.total / coverage.files.length : 0;
        
        return coverage;
    }

    /**
     * Analyze test failures and patterns
     */
    analyzeFailures() {
        const failures = [];
        
        // Analyze test files for potential failure patterns
        for (const file of this.testFiles) {
            const analysis = this.analyzeTestFile(file.path);
            if (analysis) {
                // Check for common failure indicators
                if (analysis.testCases === 0) {
                    failures.push({
                        type: 'no_tests',
                        file: file.name,
                        severity: 'high',
                        message: 'No test cases found in this file'
                    });
                }
                
                if (analysis.assertions === 0 && analysis.testCases > 0) {
                    failures.push({
                        type: 'no_assertions',
                        file: file.name,
                        severity: 'medium',
                        message: 'Test file has no assertions'
                    });
                }
                
                if (analysis.coverage < 30) {
                    failures.push({
                        type: 'low_coverage',
                        file: file.name,
                        severity: 'medium',
                        message: `Low estimated coverage: ${analysis.coverage.toFixed(1)}%`
                    });
                }

                if (analysis.focusedTests > 0) {
                    failures.push({
                        type: 'focused_tests',
                        file: file.name,
                        severity: 'high',
                        message: 'Focused tests found (.only) — can hide failures in CI'
                    });
                }
            }
        }
        
        return failures;
    }

    /**
     * Export analysis results to JSON
     */
    exportResults(outputPath) {
        const report = this.generateReport();
        
        try {
            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
            console.log(`✅ Analysis results exported to: ${outputPath}`);
        } catch (error) {
            console.error('❌ Failed to export results:', error.message);
        }
    }

    /**
     * Print analysis summary
     */
    printSummary() {
        console.log('Generating report...');
        const report = this.generateReport();
        console.log('Report generated successfully');
        
        console.log('\n📊 Test Suite Analysis Summary');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📁 Total Test Files: ${report.performance.totalFiles}`);
        console.log(`📏 Total Size: ${(report.performance.totalSize / 1024).toFixed(2)} KB`);
        console.log(`📊 Average Coverage: ${report.coverage.total.toFixed(1)}%`);
        console.log(`🎯 Health Score: ${report.healthScore}/100`);
        console.log(`💡 Recommendations: ${report.recommendations.length}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            report.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
                console.log(`     ${rec.description}`);
            });
        }
        
        console.log('\n🎉 Analysis completed!');
    }
}

// Simple arg parser
function parseArgs(argv) {
    const out = { flags: new Set(), kv: {} };
    for (const a of argv) {
        if (a.startsWith('--')) {
            const [k, v] = a.split('=');
            if (v === undefined) out.flags.add(k);
            else out.kv[k] = v;
        }
    }
    return out;
}

// Run the analyzer (CLI)
console.log('Starting test analyzer...');
try {
    const argv = process.argv.slice(2);
    const { flags, kv } = parseArgs(argv);
    const dir = kv['--dir'] ? path.resolve(kv['--dir']) : undefined;
    const recursive = flags.has('--no-recursive') ? false : true;
    const depth = kv['--depth'] ? Number(kv['--depth']) : undefined;
    const analyzer = new TestAnalyzer({ dir, recursive, depth });
    const exportPath = kv['--export'] || (flags.has('--export') ? path.join(__dirname, 'analysis-results.json') : null);

    if (exportPath) {
        console.log('Export mode');
        analyzer.exportResults(path.resolve(exportPath));
    } else {
        console.log('Summary mode');
        analyzer.printSummary();
    }
    console.log('Script completed successfully');
} catch (error) {
    console.error('Error running analyzer:', error);
    process.exit(1);
}

export default TestAnalyzer;