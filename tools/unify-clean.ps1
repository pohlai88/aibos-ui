$ErrorActionPreference = 'Stop'

Write-Host "🧹 Removing stray ESLint configs…"
git ls-files | Select-String -Pattern '(^|/)\.eslintrc(\.|$)|(eslint\.config\.(js|cjs|mjs|ts))' |
  Where-Object { $_.Line -notmatch '^eslint.config.' } |
  ForEach-Object { git rm -f $_.Line.Trim() }

Write-Host "🧹 Removing extra tsconfigs…"
git ls-files | Select-String -Pattern 'tsconfig\.(base|build|types|dts|app|lib)\.json' |
  ForEach-Object { git rm -f $_.Line.Trim() }

Write-Host "✅ Clean done. Review diffs & commit."
