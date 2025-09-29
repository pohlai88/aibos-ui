const fs = require('fs');

// Read the file
let content = fs.readFileSync('packages/accounting/src/domain/chart-of-accounts.domain.ts', 'utf8');

// Fix createBusinessError calls
content = content.replace(
  /createBusinessError\(\s*'([^']+)',\s*([^,]+),\s*\{\s*([^}]+)\s*\}\s*\)/g,
  (match, rule, message, contextStr) => {
    // Extract the main entity from context
    const contextObj = contextStr.split(',').map(s => s.trim());
    let entity = '';
    
    // Look for common entity patterns
    if (contextStr.includes('accountCode')) {
      entity = contextStr.match(/accountCode:\s*([^,}]+)/)?.[1] || 'accountCode';
    } else if (contextStr.includes('movingCode')) {
      entity = contextStr.match(/movingCode:\s*([^,}]+)/)?.[1] || 'movingCode';
    } else if (contextStr.includes('childType')) {
      entity = contextStr.match(/childType:\s*([^,}]+)/)?.[1] || 'childType';
    } else if (contextStr.includes('parentAccountCode')) {
      entity = contextStr.match(/parentAccountCode:\s*([^,}]+)/)?.[1] || 'parentAccountCode';
    }
    
    // Clean up entity (remove quotes if present)
    entity = entity.replace(/['"]/g, '');
    
    return `createBusinessError(\n        '${rule}',\n        ${message},\n        ${entity},\n        { operation: '${rule.toLowerCase().replace(/_/g, '-')}' }\n      )`;
  }
);

// Write back
fs.writeFileSync('packages/accounting/src/domain/chart-of-accounts.domain.ts', content);
console.log('Fixed createBusinessError calls');
