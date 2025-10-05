/* eslint-env browser */
class DevelopmentDashboard {
    constructor() {
        this.currentPhase = 1;
        this.currentMilestone = 4;
        this.milestones = this.initializeMilestones();
        this.updateInterval = null;
        this.isOnline = navigator.onLine;
        this.lastUpdate = new Date();
        this.init();
    }

    initializeMilestones() {
        return {
            1: { name: "Accessibility Testing Foundation", status: "completed", risk: "critical", timeline: "2-3 days" },
            2: { name: "Keyboard Navigation Validation", status: "completed", risk: "critical", timeline: "2-3 days" },
            3: { name: "RSC/SSR Compatibility", status: "completed", risk: "high", timeline: "3-4 days" },
            4: { name: "Hydration Testing", status: "in-progress", risk: "high", timeline: "2-3 days" },
            5: { name: "Release Management", status: "pending", risk: "medium", timeline: "2-3 days" },
            6: { name: "CSS Distribution Optimization", status: "pending", risk: "medium", timeline: "1-2 days" },
            7: { name: "Tailwind Preset & Anti-Drift", status: "pending", risk: "medium", timeline: "2-3 days" },
            8: { name: "Monorepo Integration Preparation", status: "pending", risk: "low", timeline: "2-3 days" },
            9: { name: "Bundle Verification", status: "pending", risk: "low", timeline: "1-2 days" },
            10: { name: "Production Release", status: "pending", risk: "final", timeline: "2-3 days" }
        };
    }

    init() {
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.updateLastUpdateTime();
        this.updatePhaseStatus();
    }

    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshDashboard();
                        break;
                    case 't':
                        e.preventDefault();
                        this.executeCommand('test:a11y');
                        break;
                    case 'e':
                        e.preventDefault();
                        this.executeCommand('test:e2e');
                        break;
                }
            }
        });
    }

    startRealTimeUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            this.updateLastUpdateTime();
        }, 30000);
    }

    updateMetrics() {
        // Simulate real-time metric updates based on current milestone
        const bundleSize = document.querySelector('.metric-item .metric-value');
        if (bundleSize) {
            const currentSize = parseFloat(bundleSize.textContent);
            const newSize = currentSize + (Math.random() - 0.5) * 0.05;
            bundleSize.textContent = newSize.toFixed(2) + ' KB';
        }
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            this.lastUpdate = new Date();
            lastUpdateElement.textContent = this.lastUpdate.toLocaleTimeString();
        }
    }

    updateConnectionStatus() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (this.isOnline) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Phase 1 Active';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'System Offline';
            }
        }
    }

    updatePhaseStatus() {
        // Update phase progress based on milestone completion
        const phaseCards = document.querySelectorAll('.phase-card');
        phaseCards.forEach((card, index) => {
            const progressFill = card.querySelector('.progress-fill');
            const progressText = card.querySelector('.progress-text');
            
            if (index === 0) { // Phase 1
                progressFill.style.width = '75%';
                progressText.textContent = '3 of 4 milestones complete';
            } else if (index === 1) { // Phase 2
                progressFill.style.width = '0%';
                progressText.textContent = '0 of 3 milestones complete';
            } else if (index === 2) { // Phase 3
                progressFill.style.width = '0%';
                progressText.textContent = '0 of 3 milestones complete';
            }
        });
    }

    executeCommand(command) {
        this.addActivityItem(`Executing ${command} command...`, 'info');
        
        // Simulate command execution with realistic timing
        const commandTimes = {
            'test:a11y': 15000,
            'test:e2e': 30000,
            'build': 10000,
            'coverage': 8000
        };
        
        const duration = commandTimes[command] || 5000;
        
        setTimeout(() => {
            this.addActivityItem(`${command} command completed successfully`, 'success');
            this.updateMilestoneProgress(command);
        }, duration);
    }

    updateMilestoneProgress(command) {
        // Update milestone progress based on command execution
        if (command === 'test:a11y' && this.currentMilestone === 4) {
            this.updateTaskStatus('CI Integration', 'completed');
        }
    }

    updateTaskStatus(taskName, status) {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const taskNameElement = item.querySelector('.task-name');
            if (taskNameElement && taskNameElement.textContent.includes(taskName)) {
                const taskIcon = item.querySelector('.task-icon');
                if (status === 'completed') {
                    taskIcon.textContent = '✅';
                    item.classList.add('completed');
                } else if (status === 'in-progress') {
                    taskIcon.textContent = '🔄';
                    item.classList.add('in-progress');
                }
            }
        });
    }

    addActivityItem(text, type = 'info') {
        // Create activity item (this would be added to an activity feed if we had one)
        console.log(`[${type.toUpperCase()}] ${text} - ${new Date().toLocaleTimeString()}`);
    }

    refreshDashboard() {
        this.addActivityItem('Refreshing dashboard...', 'info');
        
        // Refresh all data
            this.updateMetrics();
        this.updateLastUpdateTime();
        this.updatePhaseStatus();
        
        setTimeout(() => {
            this.addActivityItem('Dashboard refreshed successfully', 'success');
        }, 1000);
    }

    // Milestone management methods
    getCurrentMilestone() {
        return this.milestones[this.currentMilestone];
    }

    getPhaseMilestones(phase) {
        const phaseRanges = {
            1: [1, 2, 3, 4],
            2: [5, 6, 7],
            3: [8, 9, 10]
        };
        
        return phaseRanges[phase].map(id => ({
            id,
            ...this.milestones[id]
        }));
    }

    getMilestoneDependencies(milestoneId) {
        const dependencies = {
            1: [],
            2: [1],
            3: [2],
            4: [3],
            5: [4],
            6: [5],
            7: [6],
            8: [7, 4],
            9: [8, 7],
            10: [9]
        };
        
        return dependencies[milestoneId] || [];
    }

    getRiskAssessment() {
        return {
            high: [
                {
                    name: "Test Coverage Gap",
                    desc: "Current: 87% | Target: 95%",
                    mitigation: "Focus on M1 accessibility tests"
                }
            ],
            medium: [
                {
                    name: "Hydration Complexity",
                    desc: "M4 hydration testing challenges",
                    mitigation: "Comprehensive Playwright tests"
                }
            ],
            low: [
                {
                    name: "Bundle Size Growth",
                    desc: "Monitoring for size creep",
                    mitigation: "Continuous monitoring"
                }
            ]
        };
    }
}

// Global functions for HTML onclick handlers
// eslint-disable-next-line no-unused-vars
function refreshDashboard() {
    if (window.dashboard) {
        window.dashboard.refreshDashboard();
    }
}

// eslint-disable-next-line no-unused-vars
function executeCommand(command) {
    if (window.dashboard) {
        window.dashboard.executeCommand(command);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DevelopmentDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard && window.dashboard.updateInterval) {
        clearInterval(window.dashboard.updateInterval);
    }
});