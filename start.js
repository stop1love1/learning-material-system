// Single-container launcher: seed admin (idempotent), then run the NestJS
// backend (internal :3001, reached by the Next proxy at 127.0.0.1:3001) and the
// Next.js standalone frontend (public port, default :3000) side by side. If
// either process exits, the whole container exits so the orchestrator restarts.
const { spawn } = require('node:child_process');

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    try { c.kill('SIGTERM'); } catch {}
  }
  process.exit(code);
}

function start(name, cwd, args, env) {
  const child = spawn('node', args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('exit', (code) => {
    console.error(`[${name}] exited with code ${code}`);
    shutdown(code == null ? 1 : code);
  });
  return child;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// 1) Seed default admin (idempotent). Ignore failures so a seed hiccup (e.g. DB
//    momentarily unreachable) doesn't block the API from booting.
const seed = spawn('node', ['dist/seed'], { cwd: 'backend', stdio: 'inherit', env: process.env });
seed.on('exit', () => {
  // 2) Backend — internal only (proxied via /api). Fixed to 3001.
  start('backend', 'backend', ['dist/main'], { PORT: '3001' });
  // 3) Frontend — public. Uses the container's PORT (default 3000).
  start('frontend', 'frontend', ['server.js'], {
    PORT: process.env.PORT || '3000',
    HOSTNAME: '0.0.0.0',
  });
});
