import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const api = spawn(process.execPath, ['api/server.js'], { cwd: root, stdio: 'inherit' });
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { cwd: root, stdio: 'inherit' });
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (api.exitCode === null) api.kill();
  if (vite.exitCode === null) vite.kill();
  process.exitCode = code;
}

api.on('error', (error) => { console.error('Could not start SQLite API:', error.message); stop(1); });
vite.on('error', (error) => { console.error('Could not start Vite:', error.message); stop(1); });
api.on('exit', (code) => { if (!stopping && code !== 0) stop(code ?? 1); });
vite.on('exit', (code) => { if (!stopping && code !== 0) stop(code ?? 1); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
