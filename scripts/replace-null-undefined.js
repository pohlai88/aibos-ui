import { safeJoin } from '@aibos/utils';
import { safeGet } from '@aibos/utils';
const BASE_DIR = process.cwd();
const fs = require('fs');
const path = require('path');

// Codemod to replace null with undefined in React/TypeScript code
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace null with undefined in various contexts
    const replacements = [
      // Function return null -> undefined
      { from: /return null;/g, to: 'return undefined;' },
      { from: /return null\s*$/gm, to: 'return undefined;' },

      // Variable assignment null -> undefined
      { from: /=\s*null\s*;/g, to: '= undefined;' },
      { from: /=\s*null\s*$/gm, to: '= undefined;' },

      // Function parameter default null -> undefined
      { from: /=\s*null\s*\)/g, to: '= undefined)' },
      { from: /=\s*null\s*,/g, to: '= undefined,' },

      // Object property null -> undefined
      { from: /:\s*null\s*[,}]/g, to: ': undefined$1' },

      // Array element null -> undefined
      { from: /,\s*null\s*,/g, to: ', undefined,' },
      { from: /,\s*null\s*]/g, to: ', undefined]' },
      { from: /\[\s*null\s*,/g, to: '[undefined,' },
      { from: /\[\s*null\s*]/g, to: '[undefined]' },

      // Conditional expressions null -> undefined
      { from: /\?\s*null\s*:/g, to: '? undefined:' },
      { from: /:\s*null\s*\?/g, to: ': undefined?' },

      // Logical operators null -> undefined
      { from: /\|\|\s*null/g, to: '|| undefined' },
      { from: /&&\s*null/g, to: '&& undefined' },

      // Comparison null -> undefined
      { from: /===\s*null/g, to: '=== undefined' },
      { from: /!==\s*null/g, to: '!== undefined' },
      { from: /==\s*null/g, to: '== undefined' },
      { from: /!=\s*null/g, to: '!= undefined' },
    ];

    for (const { from, to } of replacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }

    // Special cases: preserve DOM API null returns
    // These should stay as null since DOM APIs return null
    const domApiPatterns = [
      /document\.getElementById\([^)]+\)/g,
      /document\.querySelector\([^)]+\)/g,
      /document\.querySelectorAll\([^)]+\)/g,
      /element\.getAttribute\([^)]+\)/g,
      /element\.closest\([^)]+\)/g,
      /element\.parentElement/g,
      /element\.nextElementSibling/g,
      /element\.previousElementSibling/g,
      /element\.firstElementChild/g,
      /element\.lastElementChild/g,
    ];

    // Restore null for DOM API calls if we accidentally changed them
    for (const pattern of domApiPatterns) {
      content = content.replace(pattern, (match) => {
        return match.replace(/undefined/g, 'null');
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(safeJoin(BASE_DIR, dirPath));

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(safeJoin(BASE_DIR, fullPath));

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

// Main execution
const targetDir = process.argv[2] || 'packages/ui/src';
console.log(`🔄 Replacing null with undefined in: ${targetDir}`);
processDirectory(targetDir);
console.log('✅ Null to undefined replacement complete!');
