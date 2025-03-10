/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import steamworks from 'steamworks.js';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { closeServer, openServer } from './server';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const mainWindowOptions = {
  show: false,
  width: 1024,
  height: 728,
  icon: getAssetPath('icon.png'),
  webPreferences: {
    preload: app.isPackaged
      ? path.join(__dirname, 'preload.js')
      : path.join(__dirname, '../../.erb/dll/preload.js'),
    contextIsolation: true,
    nodeIntegration: true,
  },
};

let mainWindow: BrowserWindow | null = null;
let window2: BrowserWindow | null = null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ipcMain.on('openServer', async (_event, arg) => {
  openServer({ port: arg });
});
ipcMain.on('closeServer', async () => {
  closeServer();
});
const store = new Store();
// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow(mainWindowOptions);

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.webContents.openDevTools();
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
app.on('before-quit', () => {
  closeServer();
});
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  closeServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

app
  .whenReady()
  .then(() => {
    window2 = new BrowserWindow(mainWindowOptions);
    window2.loadURL(resolveHtmlPath('index.html'));
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (window2 === null) {
        window2 = new BrowserWindow(mainWindowOptions);
        window2.loadURL(resolveHtmlPath('index.html'));
      }
    });
  })
  .catch(console.warn);

try {
  const steamClient = steamworks.init(2930990);
  // Print Steam username
  console.log(steamClient.localplayer.getName());
  steamworks.electronEnableSteamOverlay();
  store.set('nick', steamClient.localplayer.getName());
} catch (error) {
  console.error('Steamworks initialization failed:', error);
}
