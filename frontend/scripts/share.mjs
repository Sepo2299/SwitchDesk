import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(frontend, '..', 'backend');
const windows = process.platform === 'win32';
const python = resolve(backend, '.venv', windows ? 'Scripts/python.exe' : 'bin/python');

if (!existsSync(resolve(frontend, 'dist/index.html'))) {
  console.error('Build the website first: npm.cmd run build');
  process.exit(1);
}
if (!existsSync(python)) {
  console.error('Set up the backend virtual environment using the README first.');
  process.exit(1);
}

const server = spawn(python, ['serve.py', ...process.argv.slice(2)], {
  cwd: backend,
  stdio: 'inherit',
  windowsHide: true,
});
server.on('error', error => {
  console.error(`Cannot start SwitchDesk: ${error.message}`);
  process.exitCode = 1;
});
server.on('exit', code => { process.exitCode = code ?? 1; });
process.on('SIGINT', () => server.kill('SIGINT'));
process.on('SIGTERM', () => server.kill('SIGTERM'));
