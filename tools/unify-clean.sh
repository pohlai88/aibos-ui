#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Removing stray ESLint configs…"
git ls-files | grep -E '(^|/)\.eslintrc(\.|$)|(eslint\.config\.(js|cjs|mjs|ts))' \
  | grep -v '^eslint.config.' \
  | xargs -r git rm -f

echo "🧹 Removing extra tsconfigs (keep root + per-package tsconfig.json)…"
git ls-files | grep -E 'tsconfig\.(base|build|types|dts|app|lib)\.json' \
  | xargs -r git rm -f

echo "🧹 Removing custom tsup configs (keep per-package one if needed)…"
# If you want exactly one template copied, uncomment:
# git ls-files | grep -E 'tsup\.config\.(js|ts)' | xargs -r git rm -f

echo "✅ Clean done. Review diffs & commit."
