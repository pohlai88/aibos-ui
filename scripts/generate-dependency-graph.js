#!/usr/bin/env node

/**
 * Dependency Graph Generator
 *
 * Generates visual dependency graphs using Mermaid
 * Shows UI ecosystem layer relationships and dependencies
 */

import { execSync } from 'child_process';
import { safeGet } from '@aibos/utils';
import fs from 'fs';
import path from 'path';

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

function generateMermaidGraph() {
  log('🎨 Generating UI Ecosystem Dependency Graph...', 'blue');

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

  // Write Mermaid file
  fs.writeFileSync('dependency-graph.mmd', mermaidContent);

  try {
    // Generate SVG using Mermaid CLI
    execSync('mmdc -i dependency-graph.mmd -o dependency-graph.svg', { stdio: 'pipe' });
    log('✅ Dependency graph generated: dependency-graph.svg', 'green');

    // Generate PNG as well
    execSync('mmdc -i dependency-graph.mmd -o dependency-graph.png', { stdio: 'pipe' });
    log('✅ Dependency graph generated: dependency-graph.png', 'green');

    // Clean up Mermaid file
    fs.unlinkSync('dependency-graph.mmd');
  } catch (error) {
    log('⚠️  Could not generate SVG/PNG, but Mermaid file created: dependency-graph.mmd', 'yellow');
    log('You can view it at: https://mermaid.live/', 'cyan');
  }
}

function generateDetailedGraph() {
  log('🔍 Generating Detailed Dependency Analysis...', 'cyan');

  const detailedContent = `
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

  fs.writeFileSync('detailed-analysis.mmd', detailedContent);

  try {
    execSync('mmdc -i detailed-analysis.mmd -o detailed-analysis.svg', { stdio: 'pipe' });
    execSync('mmdc -i detailed-analysis.mmd -o detailed-analysis.png', { stdio: 'pipe' });
    log('✅ Detailed analysis generated: detailed-analysis.svg', 'green');
    fs.unlinkSync('detailed-analysis.mmd');
  } catch (error) {
    log('⚠️  Detailed analysis Mermaid file created: detailed-analysis.mmd', 'yellow');
  }
}

function generateViolationGraph() {
  log('🚨 Generating Violation Analysis Graph...', 'red');

  const violationContent = `
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

  fs.writeFileSync('violation-analysis.mmd', violationContent);

  try {
    execSync('mmdc -i violation-analysis.mmd -o violation-analysis.svg', { stdio: 'pipe' });
    execSync('mmdc -i violation-analysis.mmd -o violation-analysis.png', { stdio: 'pipe' });
    log('✅ Violation analysis generated: violation-analysis.svg', 'green');
    fs.unlinkSync('violation-analysis.mmd');
  } catch (error) {
    log('⚠️  Violation analysis Mermaid file created: violation-analysis.mmd', 'yellow');
  }
}

function main() {
  log('🎨 AIBOS UI Ecosystem Dependency Graph Generator', 'blue');
  log('Using Mermaid (better than Graphviz for this use case)', 'cyan');

  // Generate different types of graphs
  generateMermaidGraph();
  generateDetailedGraph();
  generateViolationGraph();

  log('\n📊 Generated Files:', 'magenta');
  log('• dependency-graph.svg - Overall ecosystem structure', 'white');
  log('• detailed-analysis.svg - Current state with issues', 'white');
  log('• violation-analysis.svg - Violation breakdown and fixes', 'white');

  log('\n💡 View Options:', 'cyan');
  log('1. Open SVG files in browser or VS Code', 'white');
  log('2. Use Mermaid Live Editor: https://mermaid.live/', 'white');
  log('3. GitHub will render .mmd files automatically', 'white');

  log('\n🎉 Dependency graphs generated successfully!', 'green');
}

main();
