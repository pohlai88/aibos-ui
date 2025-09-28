import { spawnSync } from 'node:child_process';

const res = spawnSync('pnpm', ['--silent', 'build'], { stdio: 'inherit', cwd: process.cwd() });
if (res.status !== 0) {
  console.error('❌ Next.js build failed — check TypeScript, ESLint, or config.');
  process.exit(res.status ?? 1);
}
console.log('✅ Next.js build ok');
