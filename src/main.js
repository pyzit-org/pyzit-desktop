const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const APP_NAME = 'Pyzit';
const START_URL = 'https://pyzit.com';

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function createWindow () {
  const win = new BrowserWindow({
    title: APP_NAME,
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0b0b',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icons', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: true
    }
  });

  // Security: lock navigation to allowed domains
  const allowedHosts = new Set([
    'pyzit.com',
    'www.pyzit.com'
  ]);

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (allowedHosts.has(parsed.hostname)) {
        return { action: 'allow' };
      }
    } catch {}
    // Open external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (e, url) => {
    try {
      const { hostname } = new URL(url);
      if (!allowedHosts.has(hostname)) {
        e.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      e.preventDefault();
    }
  });

  // Optional: custom UA so your backend can detect desktop app (if ever needed)
  const customUA = `${win.webContents.getUserAgent()} PyzitDesktop/${app.getVersion()}`;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = customUA;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  win.loadURL(START_URL);
  return win;
}

app.on('ready', async () => {
  createWindow();

  // Optional: Auto-updates from GitHub Releases
  autoUpdater.autoDownload = true;
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('second-instance', () => {
  const all = BrowserWindow.getAllWindows();
  if (all.length) {
    if (all[0].isMinimized()) all[0].restore();
    all[0].focus();
  }
});

app.on('window-all-closed', () => {
  // On macOS keep app alive until Cmd+Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
