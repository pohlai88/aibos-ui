#!/usr/bin/env node

/**
 * Schema Comments Extractor
 *
 * Extracts and displays all $comment guidance from the usage map schema
 * for PR reviewers and CI systems.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [k: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

function* walk(object: JSONValue, p: string[] = []): Generator<{ path: string; comment: string }> {
  if (object && typeof object === 'object') {
    const o = object as JSONObject;
    if ('$comment' in o && typeof o.$comment === 'string') {
      yield { path: '#/' + p.join('/'), comment: o.$comment as string };
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === '$comment') continue;
      yield* walk(v as JSONValue, [...p, k]);
    }
  }
}

const schemaPath = process.argv[2] || path.join(__dirname, '../docs/usage-map.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const rows = [...walk(schema)];
if (!rows.length) {
  console.log('No $comment hints found.');
  process.exit(0);
}

console.log('🔎 Lintable guidance from schema ($comment):\n');
for (const { path: sp, comment } of rows) {
  console.log(`- ${sp}\n  → ${comment}\n`);
}

// Optional: emit GitHub Actions annotations
if (process.env.GITHUB_ACTIONS) {
  for (const { path: sp, comment } of rows) {
    const message = comment.replace(/\n/g, ' ');
    console.log(`::notice title=Schema hint,path=${schemaPath}::${sp} — ${message}`);
  }
}
