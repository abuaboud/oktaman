import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let serverProcess: ChildProcess | null = null;

function getServerPath(): string {
  return path.join(__dirname, '..', '..', '..', 'packages', 'server', 'dist', 'main.js');
}

function getServerCwd(): string {
  return path.join(__dirname, '..', '..', '..', 'packages', 'server');
}

export function startDevServer(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    const cwd = getServerCwd();

    serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: String(port),
        LOG_LEVEL: 'info',
      },
      cwd,
      stdio: 'pipe',
    });

    serverProcess.on('error', (err) => {
      console.error('Dev server process error:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Dev server exited with code ${code}`);
      }
      serverProcess = null;
    });

    // Pipe server output to main process stdout/stderr
    serverProcess.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(data);
    });
    serverProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
    });

    // Resolve immediately — Vite dev server handles readiness
    resolve();
  });
}

export function stopDevServer(): Promise<void> {
  if (!serverProcess) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const proc = serverProcess;
    serverProcess = null;

    if (!proc || proc.killed) {
      resolve();
      return;
    }

    const forceKillTimer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve();
    }, 5000);

    proc.on('exit', () => {
      clearTimeout(forceKillTimer);
      resolve();
    });

    proc.kill('SIGTERM');
  });
}
