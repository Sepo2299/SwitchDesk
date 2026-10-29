import { spawn } from 'node:child_process';
import { existsSync, createWriteStream } from 'node:fs';
import { mkdir, open, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
let origin = 'http://127.0.0.1:5174';
let startedServer;
async function healthy(url) {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok && (await response.json()).status === 'ok';
  } catch { return false; }
}
// A server launched from a restricted workspace may be reachable from another
// PC but not from local programs. Start a normal local copy when needed.
if (!await healthy(origin)) {
  origin = 'http://127.0.0.1:5175';
  if (!await healthy(origin)) {
    const backend = resolve(root, 'backend');
    const python = resolve(backend, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    if (!existsSync(python) || !existsSync(resolve(root, 'frontend/dist/index.html'))) {
      throw new Error('Complete the backend setup and npm.cmd run build first.');
    }
    console.log('Starting the website and API for internet sharing…');
    startedServer = spawn(python, ['serve.py', '--host', '127.0.0.1', '--port', '5175'], {
      cwd: backend, stdio: 'inherit', windowsHide: true,
    });
    let stopped = false;
    startedServer.on('exit', () => { stopped = true; });
    startedServer.on('error', error => { stopped = true; console.error(error.message); });
    process.on('exit', () => startedServer?.kill());
    let ready = false;
    for (let attempt = 0; attempt < 30 && !stopped; attempt++) {
      if (await healthy(origin)) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error('The sharing server could not start. See SHARING.md.');
  }
}
if (process.platform !== 'win32') {
  console.error(`Install cloudflared, then run: cloudflared tunnel --url ${origin} --protocol http2`);
  process.exit(1);
}

const tools = resolve(root, '.tools');
const executable = resolve(tools, 'cloudflared.exe');
if (!existsSync(executable)) {
  await mkdir(tools, { recursive: true });
  console.log('Downloading the official Cloudflare connector (first run only)…');
  const response = await fetch('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe');
  if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
  const temporary = resolve(tools, 'cloudflared.download');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  const file = await open(temporary, 'r');
  const signature = Buffer.alloc(2);
  await file.read(signature, 0, 2, 0);
  await file.close();
  if (signature.toString() !== 'MZ') throw new Error('The downloaded file is not a Windows executable');
  await rename(temporary, executable);
}

console.log('The connector will print an HTTPS address. Keep both sharing terminals open.');
const tunnel = spawn(executable, ['tunnel', '--url', origin, '--protocol', 'http2'], {
  stdio: 'inherit',
  windowsHide: true,
});
tunnel.on('error', error => {
  console.error(`Cannot start the internet connector: ${error.message}`);
  process.exitCode = 1;
});
tunnel.on('exit', code => {
  startedServer?.kill();
  process.exitCode = code ?? 1;
});
process.on('SIGINT', () => tunnel.kill('SIGINT'));
process.on('SIGTERM', () => tunnel.kill('SIGTERM'));
