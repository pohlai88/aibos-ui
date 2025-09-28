#!/usr/bin/env node

/**
 * UI Ecosystem Documentation Generator
 *
 * Generates HTML documentation with embedded Mermaid graphs
 * Creates a comprehensive UI ecosystem overview in packages/ui/docs/ui-ecosystem/
 */

import fs from 'fs';
import { safeGet } from '@aibos/utils';
import { safeJoin } from '@aibos/utils';
const BASE_DIR = process.cwd();
import path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
}

function createHTMLTemplate(title, mermaidContent, description) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AIBOS UI Ecosystem</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .description {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        .graph-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            overflow-x: auto;
        }
        .mermaid {
            text-align: center;
        }
        .navigation {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            text-align: center;
        }
        .nav-link {
            display: inline-block;
            margin: 0 10px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .nav-link:hover {
            background: #5a6fd8;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            margin: 5px;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-warning {
            background: #fff3cd;
            color: #856404;
        }
        .status-error {
            background: #f8d7da;
            color: #721c24;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>AIBOS UI Ecosystem Documentation</p>
        </div>
        
        <div class="content">
            <div class="description">
                <h3>📋 Overview</h3>
                <p>${description}</p>
            </div>
            
            <div class="graph-container">
                <div class="mermaid">
${mermaidContent}
                </div>
            </div>
            
            <div class="navigation">
                <a href="index.html" class="nav-link">🏠 Home</a>
                <a href="dependency-graph.html" class="nav-link">📊 Dependency Graph</a>
                <a href="detailed-analysis.html" class="nav-link">🔍 Detailed Analysis</a>
                <a href="violation-analysis.html" class="nav-link">🚨 Violation Analysis</a>
                <a href="status-report.html" class="nav-link">📈 Status Report</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | AIBOS UI Ecosystem Documentation</p>
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    </script>
</body>
</html>`;
}

function generateDependencyGraphHTML() {
  log('📊 Generating Dependency Graph HTML...', 'cyan');

  const mermaidContent = `
graph TD
    %% UI Ecosystem Layers
    subgraph "Application Layer"
        WebApp["apps/web<br/>Next.js App"]
        BFFApp["apps/bff<br/>Backend API"]
    end
    
    subgraph "UI-Business Layer"
        UIBusiness["packages/ui-business<br/>Domain Components"]
        CFO["CFO Dashboard"]
        Accounting["Accounting Components"]
    end
    
    subgraph "UI Primitives Layer"
        UIPrimitives["packages/ui<br/>Design System"]
        Tokens["Design Tokens"]
        Components["UI Components"]
        Primitives["UI Primitives"]
        Utils["Utilities & Hooks"]
    end
    
    subgraph "Domain Contracts"
        Contracts["packages/accounting-contracts<br/>Type Definitions"]
        AccountingWeb["packages/accounting-web<br/>Accounting Logic"]
    end
    
    %% Dependencies (Allowed)
    WebApp --> UIBusiness
    BFFApp --> UIBusiness
    UIBusiness --> UIPrimitives
    UIBusiness --> Contracts
    UIPrimitives --> Tokens
    UIPrimitives --> Components
    UIPrimitives --> Primitives
    UIPrimitives --> Utils
    
    %% Sub-components
    UIBusiness --> CFO
    UIBusiness --> Accounting
    
    %% Styling
    classDef appLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef businessLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef uiLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef contractLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class WebApp,BFFApp appLayer
    class UIBusiness,CFO,Accounting businessLayer
    class UIPrimitives,Tokens,Components,Primitives,Utils uiLayer
    class Contracts,AccountingWeb contractLayer
  `;

  const html = createHTMLTemplate(
    'Dependency Graph',
    mermaidContent,
    'This graph shows the overall structure of the AIBOS UI ecosystem. The clean architecture follows a three-layer approach: Applications → UI-Business → UI Primitives. Each layer has specific responsibilities and dependencies.',
  );

  fs.writeFileSync('packages/ui/docs/ui-ecosystem/dependency-graph.html', html);
  log('✅ Generated: packages/ui/docs/ui-ecosystem/dependency-graph.html', 'green');
}

function generateDetailedAnalysisHTML() {
  log('🔍 Generating Detailed Analysis HTML...', 'cyan');

  const mermaidContent = `
graph LR
    %% Detailed UI Ecosystem with Violations
    subgraph "Current State Analysis"
        subgraph "✅ Clean Areas"
            CleanUI["UI Primitives<br/>✅ Pure components<br/>✅ No business logic"]
            CleanBusiness["UI-Business<br/>✅ Domain-specific<br/>✅ Uses UI primitives"]
        end
        
        subgraph "⚠️ Issues Found"
            PolyIssues["Polymorphic Issues<br/>⚠️ 8 components need fixes<br/>• Missing ref forwarding<br/>• Missing as prop"]
            TypeIssues["TypeScript Issues<br/>⚠️ Missing typecheck script"]
            DepIssues["Dependency Issues<br/>⚠️ 6 violations found<br/>• 5 orphaned files<br/>• 1 unresolvable import"]
        end
    end
    
    subgraph "Layer Boundaries"
        Apps["Apps Layer<br/>apps/web, apps/bff"]
        Business["UI-Business Layer<br/>packages/ui-business"]
        UI["UI Primitives Layer<br/>packages/ui"]
        Contracts["Domain Contracts<br/>packages/accounting-contracts"]
    end
    
    %% Flow
    Apps --> Business
    Business --> UI
    Business --> Contracts
    
    %% Issues
    PolyIssues -.-> UI
    TypeIssues -.-> Apps
    DepIssues -.-> Apps
    
    %% Styling
    classDef clean fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef issue fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef layer fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    
    class CleanUI,CleanBusiness clean
    class PolyIssues,TypeIssues,DepIssues issue
    class Apps,Business,UI,Contracts layer
  `;

  const html = createHTMLTemplate(
    'Detailed Analysis',
    mermaidContent,
    'This analysis shows the current state of the UI ecosystem. While the overall architecture is clean with proper layer boundaries, there are specific issues that need attention, particularly around polymorphic components and TypeScript configuration.',
  );

  fs.writeFileSync('packages/ui/docs/ui-ecosystem/detailed-analysis.html', html);
  log('✅ Generated: packages/ui/docs/ui-ecosystem/detailed-analysis.html', 'green');
}

function generateViolationAnalysisHTML() {
  log('🚨 Generating Violation Analysis HTML...', 'cyan');

  const mermaidContent = `
graph TD
    %% Violation Analysis
    subgraph "Current Violations (9 total)"
        V1["❌ Polymorphic Issues (8)<br/>• card.tsx - missing ref typing<br/>• error-boundary.tsx - missing ref typing<br/>• loading-states.tsx - missing ref typing<br/>• correlation-context.tsx - missing ref typing<br/>• badge.tsx - missing ref typing<br/>• button.tsx - missing ref typing<br/>• input.tsx - missing as prop + ref typing"]
        
        V2["❌ TypeScript Issues (1)<br/>• Missing typecheck script in package.json"]
        
        V3["❌ Dependency Issues (6)<br/>• 5 orphaned files (warnings)<br/>• 1 unresolvable import (error)"]
    end
    
    subgraph "Fix Priority"
        P1["🔴 High Priority<br/>Fix polymorphic components<br/>Add typecheck script"]
        P2["🟡 Medium Priority<br/>Clean up orphaned files<br/>Fix import paths"]
        P3["🟢 Low Priority<br/>Optimize dependencies<br/>Add documentation"]
    end
    
    subgraph "Next Steps"
        S1["1. Fix polymorphic ref typing<br/>2. Add as prop to input.tsx<br/>3. Add typecheck script"]
        S2["4. Clean orphaned files<br/>5. Fix unresolvable imports<br/>6. Run validation again"]
    end
    
    V1 --> P1
    V2 --> P1
    V3 --> P2
    
    P1 --> S1
    P2 --> S2
    
    %% Styling
    classDef violation fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef priority fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef solution fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    
    class V1,V2,V3 violation
    class P1,P2,P3 priority
    class S1,S2 solution
  `;

  const html = createHTMLTemplate(
    'Violation Analysis',
    mermaidContent,
    'This analysis breaks down all current violations in the UI ecosystem. The issues are categorized by priority, with specific steps provided for resolution. Most issues are related to polymorphic component implementation and can be fixed quickly.',
  );

  fs.writeFileSync('packages/ui/docs/ui-ecosystem/violation-analysis.html', html);
  log('✅ Generated: packages/ui/docs/ui-ecosystem/violation-analysis.html', 'green');
}

function generateStatusReportHTML() {
  log('📈 Generating Status Report HTML...', 'cyan');

  const mermaidContent = `
graph LR
    %% Status Report
    subgraph "✅ Achievements"
        A1["Enhanced Dependency Cruiser<br/>✅ UI ecosystem rules added<br/>✅ Layer boundary detection"]
        A2["Visual Documentation<br/>✅ Mermaid graphs generated<br/>✅ HTML documentation"]
        A3["Validation Scripts<br/>✅ Multiple validation tools<br/>✅ Clear error reporting"]
        A4["Clean Architecture<br/>✅ Zero layer violations<br/>✅ Proper dependency flow"]
    end
    
    subgraph "⚠️ Current Issues"
        I1["Polymorphic Components<br/>8 components need fixes"]
        I2["TypeScript Config<br/>Missing typecheck script"]
        I3["Dependency Issues<br/>6 violations found"]
    end
    
    subgraph "🎯 Next Steps"
        N1["Fix Polymorphic Issues<br/>Add ref forwarding"]
        N2["Add TypeScript Script<br/>Configure typecheck"]
        N3["Clean Dependencies<br/>Remove orphaned files"]
    end
    
    %% Connections
    A1 --> I1
    A2 --> I2
    A3 --> I3
    
    I1 --> N1
    I2 --> N2
    I3 --> N3
    
    %% Styling
    classDef achievement fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef issue fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    classDef next fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    
    class A1,A2,A3,A4 achievement
    class I1,I2,I3 issue
    class N1,N2,N3 next
  `;

  const html = createHTMLTemplate(
    'Status Report',
    mermaidContent,
    "This status report summarizes the current state of the UI ecosystem enhancement project. We've successfully implemented comprehensive validation tools and documentation, with only minor issues remaining to be resolved.",
  );

  fs.writeFileSync('packages/ui/docs/ui-ecosystem/status-report.html', html);
  log('✅ Generated: packages/ui/docs/ui-ecosystem/status-report.html', 'green');
}

function generateIndexHTML() {
  log('🏠 Generating Index HTML...', 'cyan');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIBOS UI Ecosystem Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 3em;
            font-weight: 300;
        }
        .header p {
            margin: 15px 0 0 0;
            opacity: 0.9;
            font-size: 1.2em;
        }
        .content {
            padding: 40px;
        }
        .overview {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 40px;
            border-left: 4px solid #667eea;
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #667eea;
        }
        .card p {
            margin: 0;
            color: #6c757d;
            line-height: 1.6;
        }
        .card a {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .card a:hover {
            background: #5a6fd8;
        }
        .status {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            margin: 5px;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-warning {
            background: #fff3cd;
            color: #856404;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 AIBOS UI Ecosystem</h1>
            <p>Comprehensive Documentation & Analysis</p>
        </div>
        
        <div class="content">
            <div class="overview">
                <h2>📋 Overview</h2>
                <p>The AIBOS UI Ecosystem follows a clean three-layer architecture: <strong>Applications → UI-Business → UI Primitives</strong>. This documentation provides comprehensive analysis of the current state, dependencies, and areas for improvement.</p>
            </div>
            
            <div class="cards">
                <div class="card">
                    <h3>📊 Dependency Graph</h3>
                    <p>Visual representation of the overall UI ecosystem structure, showing the clean architecture and proper layer separation.</p>
                    <a href="dependency-graph.html">View Graph</a>
                </div>
                
                <div class="card">
                    <h3>🔍 Detailed Analysis</h3>
                    <p>Current state analysis highlighting what's working well and what issues need attention in the ecosystem.</p>
                    <a href="detailed-analysis.html">View Analysis</a>
                </div>
                
                <div class="card">
                    <h3>🚨 Violation Analysis</h3>
                    <p>Breakdown of all current violations with priority levels and specific steps for resolution.</p>
                    <a href="violation-analysis.html">View Violations</a>
                </div>
                
                <div class="card">
                    <h3>📈 Status Report</h3>
                    <p>Summary of achievements, current issues, and next steps for the UI ecosystem enhancement project.</p>
                    <a href="status-report.html">View Status</a>
                </div>
            </div>
            
            <div class="status">
                <h3>🎯 Current Status</h3>
                <span class="status-badge status-success">✅ Clean Layer Boundaries</span>
                <span class="status-badge status-success">✅ Enhanced Dependency Cruiser</span>
                <span class="status-badge status-success">✅ Visual Documentation</span>
                <span class="status-badge status-warning">⚠️ 9 Issues to Fix</span>
                <span class="status-badge status-warning">⚠️ Polymorphic Components</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | AIBOS UI Ecosystem Documentation</p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync('packages/ui/docs/ui-ecosystem/index.html', html);
  log('✅ Generated: packages/ui/docs/ui-ecosystem/index.html', 'green');
}

function main() {
  log('🎨 AIBOS UI Ecosystem HTML Documentation Generator', 'blue');
  log('Creating comprehensive HTML documentation with embedded Mermaid graphs...', 'cyan');

  // Ensure directory exists
  if (!fs.existsSync(safeJoin(BASE_DIR, 'packages/ui/docs/ui-ecosystem'))) {
    fs.mkdirSync('packages/ui/docs/ui-ecosystem', { recursive: true });
  }

  // Generate all HTML files
  generateIndexHTML();
  generateDependencyGraphHTML();
  generateDetailedAnalysisHTML();
  generateViolationAnalysisHTML();
  generateStatusReportHTML();

  log('\n📊 Generated HTML Documentation:', 'magenta');
  log('• packages/ui/docs/ui-ecosystem/index.html - Main dashboard', 'white');
  log(
    '• packages/ui/docs/ui-ecosystem/dependency-graph.html - Overall ecosystem structure',
    'white',
  );
  log(
    '• packages/ui/docs/ui-ecosystem/detailed-analysis.html - Current state with issues',
    'white',
  );
  log(
    '• packages/ui/docs/ui-ecosystem/violation-analysis.html - Violation breakdown and fixes',
    'white',
  );
  log('• packages/ui/docs/ui-ecosystem/status-report.html - Project status summary', 'white');

  log('\n💡 How to View:', 'cyan');
  log('1. Open packages/ui/docs/ui-ecosystem/index.html in your browser', 'white');
  log('2. Navigate between pages using the navigation links', 'white');
  log('3. All graphs are interactive and responsive', 'white');

  log('\n🎉 HTML documentation generated successfully!', 'green');

  // Auto-open the documentation in browser
  openDocumentation();
}

function openDocumentation() {
  log('\n🌐 Opening documentation in browser...', 'cyan');

  try {
    const indexPath = path.resolve('packages/ui/docs/ui-ecosystem/index.html');

    // Try different methods to open the file
    if (process.platform === 'win32') {
      // Windows
      execSync(`start "" "${indexPath}"`, { stdio: 'pipe' });
    } else if (process.platform === 'darwin') {
      // macOS
      execSync(`open "${indexPath}"`, { stdio: 'pipe' });
    } else {
      // Linux and others
      execSync(`xdg-open "${indexPath}"`, { stdio: 'pipe' });
    }

    log('✅ Documentation opened in your default browser!', 'green');
    log(`📍 URL: file://${indexPath.replace(/\\/g, '/')}`, 'cyan');
  } catch (error) {
    log('⚠️  Could not auto-open browser, but documentation is ready!', 'yellow');
    log('📁 Manual access: packages/ui/docs/ui-ecosystem/index.html', 'cyan');
    log(`💡 Error: ${error.message}`, 'red');
  }
}

main();
