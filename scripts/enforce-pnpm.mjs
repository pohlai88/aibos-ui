#!/usr/bin/env node
// Blocks installs with npm/yarn; allows pnpm only.
const ua = process.env.npm_config_user_agent || '';
const isPNPM = ua.includes('pnpm/');
if (!isPNPM) {
  console.error(
    '\n❌ This repo uses PNPM workspaces.\n' +
      '   Please install via:  pnpm install\n' +
      `   Detected user agent: ${ua || 'unknown'}\n`,
  );
  process.exit(1);
}
