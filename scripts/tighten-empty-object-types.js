import { safeJoin } from '@aibos/utils';
import { safeGet } from '@aibos/utils';
const BASE_DIR = process.cwd();
const fs = require('fs');
const path = require('path');

// Codemod to replace {} with more precise types
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace {} with more precise types based on context
    const replacements = [
      // Generic object types
      { from: /:\s*\{\}\s*[,;=]/g, to: ': Record<string, never>$1' },
      { from: /:\s*\{\}\s*$/gm, to: ': Record<string, never>' },
      { from: /:\s*\{\}\s*[|&]/g, to: ': Record<string, never>$1' },

      // Function parameters
      { from: /\(\s*\{\}\s*\)/g, to: '(Record<string, never>)' },
      { from: /,\s*\{\}\s*\)/g, to: ', Record<string, never>)' },
      { from: /\(\s*\{\}\s*,/g, to: '(Record<string, never>,' },

      // Generic constraints
      { from: /extends\s*\{\}/g, to: 'extends Record<string, never>' },

      // Array types
      { from: /\[\s*\{\}\s*\]/g, to: '[Record<string, never>]' },

      // Union types
      { from: /\|\s*\{\}/g, to: '| Record<string, never>' },
      { from: /\{\}\s*\|/g, to: 'Record<string, never> |' },

      // Intersection types
      { from: /&\s*\{\}/g, to: '& Record<string, never>' },
      { from: /\{\}\s*&/g, to: 'Record<string, never> &' },

      // Optional properties
      { from: /\?\s*:\s*\{\}/g, to: '?: Record<string, never>' },

      // Index signatures
      { from: /\[\s*[^:]*\s*:\s*[^]]*\s*\]\s*:\s*\{\}/g, to: '[$1]: Record<string, never>' },
    ];

    for (const { from, to } of replacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }

    // Special cases: preserve certain {} patterns that should stay
    const preservePatterns = [
      // CSS-in-JS style objects
      /style\s*:\s*\{\}/g,
      /styles\s*:\s*\{\}/g,
      /className\s*:\s*\{\}/g,

      // React component props that might be empty
      /props\s*:\s*\{\}/g,
      /children\s*:\s*\{\}/g,

      // Configuration objects that might be empty
      /config\s*:\s*\{\}/g,
      /options\s*:\s*\{\}/g,
      /settings\s*:\s*\{\}/g,
    ];

    // Restore {} for preserved patterns
    for (const pattern of preservePatterns) {
      content = content.replace(pattern, (match) => {
        return match.replace(/Record<string, never>/g, '{}');
      });
    }

    // Handle cases where we want Record<string, unknown> instead
    // For objects that might have properties but we don't know the shape
    const unknownObjectPatterns = [
      /data\s*:\s*Record<string, never>/g,
      /metadata\s*:\s*Record<string, never>/g,
      /attributes\s*:\s*Record<string, never>/g,
      /params\s*:\s*Record<string, never>/g,
      /query\s*:\s*Record<string, never>/g,
      /state\s*:\s*Record<string, never>/g,
    ];

    for (const pattern of unknownObjectPatterns) {
      content = content.replace(pattern, (match) => {
        return match.replace(/Record<string, never>/g, 'Record<string, unknown>');
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
console.log(`🔄 Tightening empty object types in: ${targetDir}`);
processDirectory(targetDir);
console.log('✅ Empty object type tightening complete!');
