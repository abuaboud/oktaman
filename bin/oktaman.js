#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Determine app data directory
const appDataDir = path.join(os.homedir(), '.oktaman');
const dbPath = path.join(appDataDir, 'data.db');

// Ensure app data directory exists
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
  console.log(`Created app data directory: ${appDataDir}`);
}

console.log('\n╔════════════════════════════════════════╗');
console.log('║                                        ║');
console.log('║          🌙 OktaMan v0.1.0             ║');
console.log('║     Your Local AI Assistant            ║');
console.log('║                                        ║');
console.log('╚════════════════════════════════════════╝\n');
console.log('📁 Data directory:', appDataDir);
console.log('💾 Database:', dbPath);
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
    DB_PATH: dbPath,
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

// Wait a moment for server to start, then open browser
setTimeout(async () => {
  const url = 'http://localhost:4321';
  console.log('┌──────────────────────────────────────┐');
  console.log('│  ✨ OktaMan is ready!                 │');
  console.log('│                                      │');
  console.log(`│  🌐 ${url}              │`);
  console.log('│                                      │');
  console.log('│  Press Ctrl+C to stop                │');
  console.log('└──────────────────────────────────────┘\n');

  try {
    const open = (await import('open')).default;
    await open(url);
    console.log('🚀 Opening browser...\n');
  } catch (err) {
    console.log('⚠️  Could not open browser automatically');
    console.log(`   Please open: ${url}\n`);
  }
}, 3000);

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
