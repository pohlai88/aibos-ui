// Blocks npm/yarn; allows pnpm. Runs on every install (dev & CI).
const ua = process.env.npm_config_user_agent || '';
const isNpm = /npm\//.test(ua);
const isYarn = /yarn\//.test(ua);
if (isNpm || isYarn) {
  const tool = isNpm ? 'npm' : 'yarn';
  console.error(
    `\n❌ This repo uses pnpm.\nDetected ${tool} via user agent: ${ua}\n` +
    '➡ Enable corepack and use pnpm:\n' +
    '   corepack enable\n' +
    '   corepack prepare pnpm@9 --activate\n' +
    '   pnpm install\n'
  );
  process.exit(1);
}
