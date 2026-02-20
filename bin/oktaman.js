#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Determine app data directory
const appDataDir = path.join(os.homedir(), '.oktaman');
// Ensure app data directory exists
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
  console.log(`Created app data directory: ${appDataDir}`);
}

const url = 'http://localhost:4321';

console.log('');
console.log('\x1b[38;2;75;0;130m   ___  _    _        __  __             \x1b[0m');
console.log('\x1b[38;2;75;0;130m  / _ \\| | _| |_ __ _|  \\/  | __ _ _ __  \x1b[0m');
console.log('\x1b[38;2;75;0;130m | | | | |/ / __/ _` | |\\/| |/ _` | \'_ \\ \x1b[0m');
console.log('\x1b[38;2;75;0;130m | |_| |   <| || (_| | |  | | (_| | | | |\x1b[0m');
console.log('\x1b[38;2;75;0;130m  \\___/|_|\\_\\\\__\\__,_|_|  |_|\\__,_|_| |_|\x1b[0m');
console.log('');
console.log(`  v0.1.0 (beta)          ${url}`);
console.log('');
console.log('  \x1b[33mWarning: OktaMan has full access to your computer.');
console.log('  The CLI is still in beta — use at your own risk.\x1b[0m');
console.log('');

// Path to the server
const serverPath = path.join(__dirname, '..', 'packages', 'server', 'dist', 'main.js');

// Check if server is built
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server not built. Please run: npm run build');
  process.exit(1);
}

// Start the server
const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: '4321',
    LOG_LEVEL: 'info'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Wait a moment for server to start, then show ready message
setTimeout(() => {
  console.log('  Ready! Press \x1b[1mo\x1b[0m to open in browser, \x1b[1mCtrl+C\x1b[0m to stop.\n');
}, 3000);

// Listen for 'o' keypress to open browser
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (key) => {
    if (key === 'o' || key === 'O') {
      try {
        const open = (await import('open')).default;
        await open(url);
      } catch (_) {
        console.log(`  Could not open browser. Visit: ${url}\n`);
      }
    }
    // Ctrl+C
    if (key === '\u0003') {
      process.emit('SIGINT');
    }
  });
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  👋 Shutting down OktaMan...           ║');
  console.log('║  See you next time!                    ║');
  console.log('╚════════════════════════════════════════╝\n');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit(0);
});
