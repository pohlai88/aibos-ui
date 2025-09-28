#!/usr/bin/env node

/**
 * Test Runner with Dashboard Integration
 * 
 * This script runs the test suite and automatically opens the HTML dashboard
 * with real-time test results and analysis.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────────────────────────────────────────────────────────────────────────
// Minimal CLI flags
//   --no-open        do not open browser (CI-safe)
//   --cwd <path>     working directory to run tests from
//   --cmd "<cmd>"    test command to run (default vitest/json)
//   --dashboard <file> path to dashboard.html
// ──────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (f) => argv.includes(f);
const getArg = (key, def) => {
  const i = argv.indexOf(key);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

class TestRunner {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0,
            failures: [],
            timestamp: new Date().toISOString()
        };
        this.dashboardPath = path.resolve(getArg('--dashboard', path.join(__dirname, 'dashboard.html')));
        this.dataPath = path.resolve(path.dirname(this.dashboardPath), 'dashboard-data.json');
        this.uiPackageDir = path.resolve(getArg('--cwd', path.join(__dirname, '../../..')));
        this.testCommand = getArg('--cmd', 'pnpm vitest --reporter=json');
        this.shouldOpen = !hasFlag('--no-open') && process.env.CI !== 'true';
    }

    // Persist data for dashboard (safer than regex DOM surgery)
    writeDataFile() { 
        try { 
            const data = {
                ...this.testResults,
                successRate: this.testResults.total > 0 ? Math.round((this.testResults.passed / this.testResults.total) * 100 * 10) / 10 : 0,
                testFiles: {
                    passed: this.testResults.testFiles?.passed || 0,
                    failed: this.testResults.testFiles?.failed || 0,
                    total: this.testResults.testFiles?.total || 0
                },
                categories: this.testResults.categories || {}
            };
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2)); 
        } catch {} 
    }

    /**
     * Run tests and capture results
     */
    async runTests() {
        console.log('🧪 Running AI-BOS ERP UI Test Suite...\n');
        
        try {
            process.chdir(this.uiPackageDir);
            console.log(`Working dir: ${process.cwd()}`);
            console.log(`Executing: ${this.testCommand}`);

            const startTime = Date.now();
            // Use spawn to stream NDJSON reporter lines for near real-time updates
            const [bin, ...args] = this.testCommand.split(' ');
            const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });

            const onLine = (buf) => {
                const chunk = buf.toString();
                this.consumeOutput(chunk);
            };
            child.stdout.on('data', onLine);
            child.stderr.on('data', onLine); // reporters sometimes write to stderr

            await new Promise((resolve, reject) => {
                child.on('error', reject);
                child.on('close', (code) => {
                    this.testResults.duration = Date.now() - startTime;
                    resolve();
                });
            });
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            if (error && typeof error.stdout === 'string') this.consumeOutput(error.stdout);
            if (error && typeof error.stderr === 'string') this.consumeOutput(error.stderr);
        }
    }

    /**
     * Consume raw output (handles NDJSON events or falls back to text parsing)
     */
    consumeOutput(output) {
        // Try line-by-line JSON parse (Vitest JSON reporter emits NDJSON)
        const lines = output.split(/\r?\n/).filter(Boolean);
        let sawJson = false;
        for (const line of lines) {
            if (line.trim().startsWith('{')) {
                try {
                    const evt = JSON.parse(line);
                    sawJson = true;
                    this.applyJsonEvent(evt);
                } catch {/* ignore non-JSON lines */}
            }
        }
        if (!sawJson) this.parseTextOutput(output);
        this.writeDataFile();
    }

    /**
     * Merge incremental JSON reporter events into aggregate stats
     */
    applyJsonEvent(evt) {
        // Vitest emits events with "type". We focus on summary-like data.
        if (evt?.type === 'test' && evt?.state) {
            this.testResults.total = Math.max(this.testResults.total, evt?.tasksCount?.tests ?? this.testResults.total);
        }
        if (evt?.type === 'summary' || evt?.type === 'report') {
            // Common fields across reporters
            this.testResults.total  = evt?.numTotalTests  ?? this.testResults.total;
            this.testResults.passed = evt?.numPassedTests ?? this.testResults.passed;
            this.testResults.failed = evt?.numFailedTests ?? this.testResults.failed;
            this.testResults.skipped= evt?.numPendingTests?? this.testResults.skipped;
        }
        if (evt?.type === 'test_failed' || evt?.type === 'test' && evt?.state === 'fail') {
            const name = evt?.name || evt?.test?.name || 'Unnamed test';
            const message = evt?.error?.message || evt?.details || 'Unknown failure';
            const loc = this.extractLocation(evt?.error?.stack || message);
            this.testResults.failures.push({ name, message, location: loc });
        }
    }

    /**
     * Parse test output to extract results
     */
    parseTestOutput(output) {
        try {
            // Try to parse JSON output first
            const lines = output.split('\n');
            let jsonOutput = '';
            
            for (const line of lines) {
                if (line.trim().startsWith('{') && line.includes('"type"')) {
                    jsonOutput = line;
                    break;
                }
            }
            
            if (jsonOutput) {
                const result = JSON.parse(jsonOutput);
                this.testResults.total = result.numTotalTests || 0;
                this.testResults.passed = result.numPassedTests || 0;
                this.testResults.failed = result.numFailedTests || 0;
                this.testResults.skipped = result.numPendingTests || 0;
                
                if (result.testResults) {
                    this.testResults.failures = result.testResults
                        .filter(test => test.status === 'failed')
                        .map(test => ({
                            name: test.name,
                            message: test.failureMessages?.[0] || 'Unknown failure',
                            location: this.extractLocation(test.failureMessages?.[0] || '')
                        }));
                }
            } else {
                // Fallback: parse text output
                this.parseTextOutput(output);
            }
        } catch (error) {
            console.warn('⚠️  Could not parse JSON output, using fallback parsing');
            this.parseTextOutput(output);
        }
    }

    /**
     * Parse text-based test output
     */
    parseTextOutput(output) {
        const lines = output.split('\n');
        
        for (const line of lines) {
            if (/(Test Files|Tests|Test Suites)/.test(line)) {
                const match = line.match(/(\d+)\s+failed.*?(\d+)\s+passed.*?(\d+)?\s*total?/i)
                  || line.match(/passed:\s*(\d+).*failed:\s*(\d+).*skipped:\s*(\d+)/i);
                if (match) {
                    if (match.length >= 4) {
                        this.testResults.failed = parseInt(match[1]);
                        this.testResults.passed = parseInt(match[2]);
                        this.testResults.total  = parseInt(match[3] || String(this.testResults.passed + this.testResults.failed));
                    } else {
                        // alt order
                        this.testResults.passed = parseInt(match[1]);
                        this.testResults.failed = parseInt(match[2]);
                        this.testResults.skipped= parseInt(match[3] ?? `${this.testResults.skipped}`);
                        this.testResults.total  = Math.max(this.testResults.total, this.testResults.passed + this.testResults.failed + this.testResults.skipped);
                    }
                }
            }
            
            if (line.includes('Duration')) {
                const durationMatch = line.match(/(\d+\.\d+)s/);
                if (durationMatch) {
                    this.testResults.duration = parseFloat(durationMatch[1]) * 1000;
                }
            }
        }
        
        // Extract failure details
        this.extractFailuresFromText(output);
        this.writeDataFile();
    }

    /**
     * Extract failure information from text output
     */
    extractFailuresFromText(output) {
        const failureRegex = /FAIL\s+([^\n]+)\n([\s\S]*?)(?=\n\s*(?:⎯|──|Test Files|Tests|$))/g;
        let match;
        
        while ((match = failureRegex.exec(output)) !== null) {
            const testName = match[1].trim();
            const failureDetails = match[2].trim();
            
            this.testResults.failures.push({
                name: testName,
                message: failureDetails,
                location: this.extractLocation(failureDetails)
            });
        }
    }

    /**
     * Extract file location from error message
     */
    extractLocation(message) {
        const locationMatch =
            message.match(/❯\s+([^\s]+):(\d+):(\d+)/) ||          // Vitest pretty stack
            message.match(/\(([^)]+):(\d+):(\d+)\)/)    ||          // (file:line:col)
            message.match(/at\s+[^(\n]+\s+\(([^:]+):(\d+):(\d+)\)/) // at fn (file:line:col)
        ;
        if (locationMatch) {
            return {
                file: locationMatch[1],
                line: parseInt(locationMatch[2]),
                column: parseInt(locationMatch[3])
            };
        }
        return null;
    }

    /**
     * Update dashboard with test results
     */
    updateDashboard() {
        try {
            // Always emit data JSON (preferred consumption path)
            this.writeDataFile();

            let dashboardContent = fs.readFileSync(this.dashboardPath, 'utf8');
            
            // Update test counts
            dashboardContent = dashboardContent.replace(
                /id="total-passed">\d+/g,
                `id="total-passed">${this.testResults.passed}`
            );
            dashboardContent = dashboardContent.replace(
                /id="total-failed">\d+/g,
                `id="total-failed">${this.testResults.failed}`
            );
            dashboardContent = dashboardContent.replace(
                /id="total-skipped">\d+/g,
                `id="total-skipped">${this.testResults.skipped}`
            );
            
            // Update success rate
            const successRate = this.testResults.total > 0 
                ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
                : '0';
            dashboardContent = dashboardContent.replace(
                /<div class="metric-value">\d+\.\d+%<\/div>/g,
                `<div class="metric-value">${successRate}%</div>`
            );
            
            // Update duration
            const durationSeconds = (this.testResults.duration / 1000).toFixed(2);
            dashboardContent = dashboardContent.replace(
                /<div class="metric-value">\d+\.\d+s<\/div>/g,
                `<div class="metric-value">${durationSeconds}s</div>`
            );
            
            // Update total tests
            dashboardContent = dashboardContent.replace(
                /<div class="metric-value">\d+<\/div>\s*<div class="metric-label">Total Tests<\/div>/g,
                `<div class="metric-value">${this.testResults.total}</div>\n                        <div class="metric-label">Total Tests</div>`
            );
            
            // Update chart data
            dashboardContent = dashboardContent.replace(
                /data: \[\d+, \d+, \d+\]/g,
                `data: [${this.testResults.passed}, ${this.testResults.failed}, ${this.testResults.skipped}]`
            );
            
            // Update timestamp
            const timestamp = new Date().toLocaleString();
            dashboardContent = dashboardContent.replace(
                /id="timestamp"><\/div>/g,
                `id="timestamp">${timestamp}</div>`
            );
            
            // Write updated dashboard
            fs.writeFileSync(this.dashboardPath, dashboardContent);
            
        } catch (error) {
            console.error('❌ Failed to update dashboard:', error.message);
        }
    }

    /**
     * Open dashboard in browser
     */
    openDashboard() {
        const dashboardUrl = `file://${this.dashboardPath.replace(/\\/g, '/')}`;
        
        console.log('\n📊 Opening Test Dashboard...');
        console.log(`Dashboard URL: ${dashboardUrl}\n`);
        
        try {
            if (!this.shouldOpen) { console.log('CI/no-open: skipping browser open'); return; }
            const platform = os.platform();
            let command;
            
            switch (platform) {
                case 'win32':
                    command = `start "" "${dashboardUrl}"`;
                    break;
                case 'darwin':
                    command = `open "${dashboardUrl}"`;
                    break;
                default:
                    command = `xdg-open "${dashboardUrl}"`;
            }
            
            execSync(command, { stdio: 'ignore' });
            console.log('✅ Dashboard opened successfully!');
            
        } catch (error) {
            console.error('❌ Failed to open dashboard:', error.message);
            console.log(`Please manually open: ${dashboardUrl}`);
        }
    }

    /**
     * Generate test summary
     */
    generateSummary() {
        const successRate = this.testResults.total > 0 
            ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
            : '0';
        
        console.log('\n📋 Test Summary');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
        console.log(`📊 Total: ${this.testResults.total}`);
        console.log(`🎯 Success Rate: ${successRate}%`);
        console.log(`⏱️  Duration: ${(this.testResults.duration / 1000).toFixed(2)}s`);
        
        if (this.testResults.failures.length > 0) {
            console.log('\n❌ Failures:');
            this.testResults.failures.forEach((failure, index) => {
                console.log(`  ${index + 1}. ${failure.name}`);
                if (failure.location) {
                    console.log(`     Location: ${failure.location.file}:${failure.location.line}`);
                }
            });
        }
        
        console.log('\n🎉 Test execution completed!');
    }

    /**
     * Main execution method
     */
    async run() {
        try {
            await this.runTests();
            this.updateDashboard(); // also writes dashboard-data.json
            this.generateSummary();
            this.openDashboard();
            
        } catch (error) {
            console.error('❌ Test runner failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the test runner
const runner = new TestRunner();
runner.run();

export default TestRunner;