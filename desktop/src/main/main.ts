/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path, { join } from 'path';
import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';
import MenuBuilder from './menu';
import { homedir, userInfo } from 'os';
import { devices } from './getDevices';
import { mount, unmount } from './mount';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getMountpoint } from './getmount';
import { spawnSync } from 'child_process';

let mounted: string | null = null;

let mainWindow: BrowserWindow | null = null;

function resolvePath(device: string, path: string) {
  const newPath =
    device === '/'
      ? path
      : device === 'home'
      ? join(homedir(), path)
      : join(
          getMountpoint(devices.find((el) => el.name === device)?.id || ''),
          path
        );
  return newPath.startsWith('/') ? newPath : '/' + newPath;
}

ipcMain.handle('list-dir', async (ev, device: string, path: string) => {
  try {
    const res = await readdir(resolvePath(device, path), {
      withFileTypes: true,
    });
    return res
      .map((el) =>
        el.isFile()
          ? { file: true, name: el.name }
          : el.isDirectory()
          ? { file: false, name: el.name }
          : null
      )
      .filter((el_1) => !!el_1 && el_1.name[0] !== '.');
  } catch {
    return undefined;
  }
});

ipcMain.handle('mount', (ev, device: string) => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  const id = devices.find((el) => el.name === device)?.id;
  if (id) mounted = id;
  if (existsSync('/media/' + userInfo().username + '/' + device)) return;
  if (id) mount(id);
});

ipcMain.handle('unmount', (ev, device: string) => {
  const id = devices.find((el) => el.name === device)?.id;
  if (id) unmount(id);
  if (mounted === id) mounted === null;
});

ipcMain.handle('get-devices', () => devices.map((el) => el.name));

ipcMain.handle('get-file-contents', (ev, device: string, path: string) =>
  readFile(resolvePath(device, path))
    .then((p) => p.toString())
    .catch(() => {})
);

function pressKey(key: string) {
  if (!mainWindow) return;
  mainWindow.webContents.sendInputEvent({
    type: 'keyDown',
    keyCode: key.toUpperCase(),
  });
  mainWindow.webContents.sendInputEvent({
    type: 'char',
    keyCode: key.toUpperCase(), // that works surprisingly even with modifier keys like Shift, which gets turned into SHIFT
  });
}

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    fullscreen: true,
  });

  mainWindow.setFullScreen(true);
  mainWindow.setFullScreen(true);

  mainWindow.loadFile(getAssetPath('packaged.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.setFullScreen(true);
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

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });

    globalShortcut.register('F12', () => spawnSync('shutdown', ['0']));
  })
  .catch(console.log);

process.on('exit', () => {
  if (mounted) unmount(mounted);
});
