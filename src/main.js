const { app, BrowserWindow, shell, session, Menu, ipcMain } = require('electron');
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
    autoHideMenuBar: true, // keep menu hidden
    icon: path.join(__dirname, '..', 'build', 'icons', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: true
    }
  });

  // Allowed hosts
  const allowedHosts = new Set([
    'pyzit.com',
    'www.pyzit.com',
    'invoice.pyzit.com',
    'convertio.pyzit.com',
    'og.pyzit.com',
    'meta.pyzit.com',
    'code.pyzit.com',
    'devkit.pyzit.com',
    'crypto.pzit.com',
    'pycrypt.pyzit.com'
  ]);

  // Open allowed hosts in same window
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (allowedHosts.has(parsed.hostname)) {
        win.loadURL(url);
        return { action: 'deny' };
      }
    } catch {}
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Block external navigation
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

  // Set custom User Agent
  const customUA = `${win.webContents.getUserAgent()} PyzitDesktop/${app.getVersion()}`;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = customUA;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  win.loadURL(START_URL);
  return win;
}

app.on('ready', () => {
  const win = createWindow();

  // Handle reload from preload
  ipcMain.on('reload-page', () => {
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) focused.webContents.reload();
  });

  // Handle custom context menu
  ipcMain.on('show-context-menu', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    const template = [
      {
        label: 'Reload',
        click: () => win.webContents.reload()
      },
      {
        label: 'Back',
        enabled: win.webContents.canGoBack(),
        click: () => win.webContents.goBack()
      },
      {
        label: 'Forward',
        enabled: win.webContents.canGoForward(),
        click: () => win.webContents.goForward()
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => win.webContents.openDevTools({ mode: 'detach' })
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: win });
  });

  // Auto-update
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
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
