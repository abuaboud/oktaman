#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const STAGED = path.resolve(__dirname, '..', 'staged');

console.log('Staging OktaMan for Electron packaging...\n');

// Clean staged directory
if (fs.existsSync(STAGED)) {
  console.log('Cleaning previous staged files...');
  fs.rmSync(STAGED, { recursive: true });
}

// Create directory structure
fs.mkdirSync(path.join(STAGED, 'packages', 'server'), { recursive: true });
fs.mkdirSync(path.join(STAGED, 'packages', 'ui'), { recursive: true });
fs.mkdirSync(path.join(STAGED, 'packages', 'shared'), { recursive: true });

// Copy server dist
console.log('Copying server dist...');
copyDirSync(
  path.join(ROOT, 'packages', 'server', 'dist'),
  path.join(STAGED, 'packages', 'server', 'dist')
);

// Copy UI dist
console.log('Copying UI dist...');
copyDirSync(
  path.join(ROOT, 'packages', 'ui', 'dist'),
  path.join(STAGED, 'packages', 'ui', 'dist')
);

// Copy shared dist and package.json
console.log('Copying shared package...');
copyDirSync(
  path.join(ROOT, 'packages', 'shared', 'dist'),
  path.join(STAGED, 'packages', 'shared', 'dist')
);
fs.copyFileSync(
  path.join(ROOT, 'packages', 'shared', 'package.json'),
  path.join(STAGED, 'packages', 'shared', 'package.json')
);

// Copy server package.json and update @oktaman/shared to use file reference
console.log('Setting up server dependencies...');
const serverPkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages', 'server', 'package.json'), 'utf8')
);
serverPkg.dependencies['@oktaman/shared'] = 'file:../shared';
delete serverPkg.devDependencies;
fs.writeFileSync(
  path.join(STAGED, 'packages', 'server', 'package.json'),
  JSON.stringify(serverPkg, null, 2)
);

// Install production dependencies
console.log('Installing production dependencies...');
execSync('npm install --omit=dev', {
  cwd: path.join(STAGED, 'packages', 'server'),
  stdio: 'inherit',
});

// Rebuild native modules for Electron
console.log('Rebuilding native modules for Electron...');
execSync(
  `npx @electron/rebuild -m "${path.join(STAGED, 'packages', 'server')}"`,
  {
    cwd: path.join(ROOT, 'apps', 'desktop'),
    stdio: 'inherit',
  }
);

console.log('\nStaging complete!');

// Recursively copy a directory
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
