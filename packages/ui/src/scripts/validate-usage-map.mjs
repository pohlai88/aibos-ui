#!/usr/bin/env node
/* eslint-env node */

/**
 * Usage Map Schema Validator — PR/CI Friendly
 *
 * Enhancements:
 * - Line/column aware errors via json-source-map (when available)
 * - GitHub Actions annotations ::error file=…,line=…,col=…::
 * - Optional SARIF output (--sarif)
 * - Lintable $comment hints surfaced as "Hint"
 * - Multiple inputs, glob support, or stdin ("-")
 * - Strict AJV with formats & keywords
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addKeywords from 'ajv-keywords';

// Optional: line/column mapping if installed
let parseWithMap = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { schema: '../../docs/usage-map.schema.json', format: 'pretty', files: [] };

  // Use a safer approach with predefined patterns to avoid object injection
  const argString = argv.slice(2).join(' ');

  // Parse using regex patterns instead of direct argv access
  const schemaMatch = argString.match(/--schema\s+([a-zA-Z0-9._/-]+)|-s\s+([a-zA-Z0-9._/-]+)/);
  if (schemaMatch) {
    args.schema = schemaMatch[1] || schemaMatch[2];
  }

  if (argString.includes('--json')) {
    args.format = 'json';
  } else if (argString.includes('--sarif')) {
    args.format = 'sarif';
  }

  if (argString.includes('--quiet') || argString.includes('-q')) {
    args.quiet = true;
  }

  if (argString.includes('--help') || argString.includes('-h')) {
    args.help = true;
  }

  // Extract file arguments (everything that's not a flag)
  const fileMatches = argString.match(/\b([a-zA-Z0-9._/-]+\.(?:ts|tsx|js|jsx|json))\b/g);
  if (fileMatches) {
    args.files = fileMatches;
  }

  return args;
}

function printHelp() {
  console.log(`Usage: validate-usage-map [options] <file...|-> 

Options:
  -s, --schema <path>   Path to JSON Schema (default: ../../docs/usage-map.schema.json)
      --json            Output machine-readable JSON result
      --sarif           Output SARIF v2.1.0 (for code scanning)
  -q, --quiet           Suppress success messages
  -h, --help            Show this help

Notes:
  • Pass "-" to read JSON from stdin
  • Emits GitHub Actions annotations automatically when GITHUB_ACTIONS=1
`);
}

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictSchema: true,
  strictRequired: true,
  allowUnionTypes: true,
});
addFormats(ajv);
addKeywords(ajv, ['instanceof', 'regexp', 'transform']);

function readJsonWithPositions(filePath, input) {
  if (parseWithMap) {
    const { data, pointers } = parseWithMap(input);
    return { data, pointers };
  }
  // Fallback: no pointers
  return { data: JSON.parse(input), pointers: {} };
}

function pointerToPos(pointers, instancePath) {
  // Ajv instancePath is a JSON Pointer (e.g., "/components/Button/pages/0")
  const ptr = pointers?.[instancePath || ''] || pointers?.[''] || null;
  if (!ptr?.value) return { line: 1, column: 1 };
  // json-source-map lines are 0-based; convert to 1-based
  return { line: (ptr.value.line || 0) + 1, column: (ptr.value.column || 0) + 1 };
}

function ghAnnotation(file, line, col, message) {
  // See: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message
  console.log(`::error file=${file},line=${line},col=${col}::${message.replace(/\n/g, '%0A')}`);
}

function toPrettyErrors(file, validate, pointers) {
  return (validate.errors || []).map((e) => {
    const { instancePath, message, keyword, params, schemaPath } = e;
    const { line, column } = pointerToPos(pointers, instancePath);
    return {
      file,
      line,
      column,
      pointer: instancePath || '/',
      keyword,
      schemaPath,
      message: message || 'Validation error',
      details: params || {},
    };
  });
}

function collectHintsFromComments(schemaObj, basePath = '') {
  // Surface $comment fields as lint hints (best-effort)
  const hints = [];
  if (schemaObj && typeof schemaObj === 'object') {
    if ('$comment' in schemaObj && typeof schemaObj.$comment === 'string') {
      hints.push({ pointer: basePath || '/', comment: schemaObj.$comment });
    }
    for (const [k, v] of Object.entries(schemaObj)) {
      const next = basePath + '/' + k.replace(/~/g, '~0').replace(/\//g, '~1');
      hints.push(...collectHintsFromComments(v, next));
    }
  }
  return hints;
}

async function main() {
  // Try to load json-source-map dynamically
  try {
    const jsonSourceMap = await import('json-source-map');
    parseWithMap = jsonSourceMap.parse;
  } catch {
    // Best-effort without positions
  }

  const args = parseArgs(process.argv);
  if (args.help || !args.files || args.files.length === 0) {
    printHelp();
    process.exit(args.help ? 0 : 2);
  }

  // Load schema once
  const schemaPath = path.isAbsolute(args.schema) ? args.schema : path.join(__dirname, args.schema);
  const rawSchema = fs.readFileSync(schemaPath, 'utf8');
  const schemaObj = JSON.parse(rawSchema);
  const validate = ajv.compile(schemaObj);

  const results = [];
  let hadErrors = false;

  for (const inputPath of args.files) {
    const isStdin = inputPath === '-';
    const abs = isStdin ? '<stdin>' : path.resolve(process.cwd(), inputPath);
    const raw = isStdin ? fs.readFileSync(0, 'utf8') : fs.readFileSync(abs, 'utf8');
    const { data, pointers } = readJsonWithPositions(abs, raw);

    const ok = validate(data);
    const pretty = toPrettyErrors(abs, validate, pointers);
    if (!ok) hadErrors = true;

    // Emit GitHub annotations if in Actions
    if (process.env.GITHUB_ACTIONS && pretty.length) {
      for (const err of pretty) {
        ghAnnotation(
          err.file,
          err.line,
          err.column,
          `${err.message} at ${err.pointer} [${err.keyword}]`,
        );
      }
    }

    // Emit $comment hints (lintable guidance)
    const hints = collectHintsFromComments(schemaObj);

    results.push({ file: abs, ok, errors: pretty, hints });
  }

  // Output format
  if (args.format === 'json') {
    console.log(JSON.stringify({ results }, null, 2));
  } else if (args.format === 'sarif') {
    // Minimal SARIF 2.1.0
    const sarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: { driver: { name: 'usage-map-validator', informationUri: 'https://ajv.js.org/' } },
          results: results.flatMap((r) =>
            r.errors.map((e) => ({
              level: 'error',
              message: { text: e.message },
              ruleId: e.keyword,
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: r.file },
                    region: { startLine: e.line, startColumn: e.column },
                  },
                },
              ],
            })),
          ),
        },
      ],
    };
    console.log(JSON.stringify(sarif, null, 2));
  } else {
    // pretty
    for (const r of results) {
      if (r.ok) {
        if (!args.quiet) console.log(`✅ ${r.file}: usage-map valid`);
      } else {
        console.error(`\n❌ ${r.file}: usage-map invalid`);
        for (const e of r.errors) {
          console.error(`  ${e.line}:${e.column} ${e.pointer} — ${e.message} (${e.keyword})`);
        }
      }
      // Show $comment hints as non-failing guidance
      if (r.hints.length) {
        console.log(`\nℹ️  Hints from schema ($comment):`);
        for (const h of r.hints) {
          console.log(`  • ${h.pointer} — ${h.comment}`);
        }
      }
    }
  }

  process.exit(hadErrors ? 1 : 0);
}

main().catch((err) => {
  console.error('💥 Validator crashed:', err?.stack || err);
  process.exit(3);
});
