import { app, BrowserWindow, shell, nativeImage } from 'electron';
import path from 'path';
import { findFreePort } from './port-finder';

let mainWindow: BrowserWindow | null = null;
let serverPort: number | null = null;
let serverStopped = false;

// In production, we embed Fastify in-process via require()
let embeddedServer: EmbeddedServer | null = null;

function isDevMode(): boolean {
  return !app.isPackaged;
}

async function createWindow(): Promise<void> {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', 'build', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: iconPath,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercept navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDevMode()) {
    // Dev: load from Vite dev server (HMR)
    await mainWindow.loadURL('http://localhost:4200');
  } else {
    // Production: load from embedded Fastify server
    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
  }

  // macOS: add top padding for traffic light buttons and a draggable title bar region
  if (process.platform === 'darwin') {
    await mainWindow.webContents.insertCSS(`
      body {
        padding-top: 25px !important;
        background: hsl(var(--sidebar-background)) !important;
      }
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 25px;
        background: hsl(var(--sidebar-background));
        -webkit-app-region: drag;
        z-index: 10000;
      }
      #root, #root > div {
        height: calc(100vh - 25px) !important;
        min-height: calc(100svh - 25px) !important;
      }
      [data-sidebar="sidebar"] {
        padding-top: 36px !important;
      }
    `);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  // Set macOS dock icon in dev mode
  if (process.platform === 'darwin' && !app.isPackaged) {
    const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon);
    }
  }

  if (isDevMode()) {
    // Dev mode: server + Vite are already running externally (via desktop:dev script)
    // Just open the window pointing at Vite dev server (HMR on localhost:4200)
    serverPort = 4321;
    await createWindow();
  } else {
    // Production: embed Fastify in Electron's main process
    serverPort = await findFreePort(4321);
    const serverModule = require(
      path.join(process.resourcesPath, 'packages', 'server', 'dist', 'main.js')
    );
    embeddedServer = await serverModule.startServer(serverPort, '127.0.0.1');
    await createWindow();
  }
});

// macOS: keep app alive when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS: re-create window when dock icon is clicked
app.on('activate', async () => {
  if (mainWindow === null && serverPort !== null) {
    await createWindow();
  }
});

// Graceful shutdown: stop server before quitting
app.on('will-quit', (e) => {
  if (!serverStopped) {
    e.preventDefault();
    const shutdownPromise = isDevMode()
      ? Promise.resolve()
      : shutdownEmbeddedServer();

    shutdownPromise.then(() => {
      serverStopped = true;
      app.quit();
    });
  }
});

async function shutdownEmbeddedServer(): Promise<void> {
  if (!embeddedServer) return;
  const serverModule = require(
    path.join(process.resourcesPath, 'packages', 'server', 'dist', 'main.js')
  );
  await serverModule.stopServer(embeddedServer);
  embeddedServer = null;
}

// Type for the Fastify instance returned by startServer
type EmbeddedServer = {
  close: () => Promise<void>;
};
