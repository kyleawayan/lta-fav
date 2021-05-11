/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as keytar from 'keytar';
// import MenuBuilder from './menu';

import authorizeWithSpotifyAndStoreRefreshToken from './spotify/auth';
import ipcStuff from './lta/ipcStuff';

const port = 4444;
const clientId = '5fb6c029e18742a3bdb3576de6eb2181';
const redirectUri = `http://localhost:${port}/callback`;

/**
 * delete old stuff from lta
 * the previous version of lta updated your custom status
 * and needed your discord authorization token since changing your
 * custom status wasn't available through an official api.
 * this got me banned from discord and also it isn't good
 * to store/use discord authorization tokens with a third-party app.
 *
 * you should never give authorization tokens to any program.
 * */
keytar.deletePassword('lta', 'refresh_token');
keytar.deletePassword('lta', 'discord_token');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  let trayIcon = null;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'show lta-fav',
      click() {
        mainWindow?.show();
      },
    },
    {
      label: 'quit',
      click() {
        app.quit();
        app.exit(0);
      },
    },
  ]);
  trayIcon = new Tray(getAssetPath('icons/16x16.png'));
  trayIcon.setTitle('lta-fav');
  trayIcon.setContextMenu(contextMenu);

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
    title: 'lta',
    // transparent: true,
    // vibrancy: 'dark',
    // backgroundColor: '#00ffffff',
    // titleBarStyle: 'hiddenInset',
  });

  // Start IPC Listeners
  ipcStuff(clientId);

  (async () => {
    const refreshToken = await keytar.getPassword('lta-fav', 'refresh_token');
    if (refreshToken) {
      mainWindow.loadURL(`file://${__dirname}/index.html`);
    } else {
      authorizeWithSpotifyAndStoreRefreshToken(
        mainWindow as BrowserWindow,
        clientId,
        redirectUri,
        port
      )
        .then(() => mainWindow?.loadURL(`file://${__dirname}/index.html`))
        .catch((error) => console.error('[🔴 lta-fav]', error));
    }
  })();

  ipcMain.handle('sign-out', async () => {
    await keytar.deletePassword('lta-fav', 'refresh_token');
    authorizeWithSpotifyAndStoreRefreshToken(
      mainWindow as BrowserWindow,
      clientId,
      redirectUri,
      port
    )
      .then(() => mainWindow?.loadURL(`file://${__dirname}/index.html`))
      .catch((error) => console.error('[🔴 lta-fav]', error));
  });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.setMenu(null);
  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);
