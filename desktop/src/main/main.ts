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
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  nativeTheme,
  Menu,
} from 'electron';
import MenuBuilder, { getMiscMenu } from './menu';
import { homedir } from 'os';
import {
  access,
  constants,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'fs/promises';
import { existsSync } from 'fs';
//@ts-ignore
import prompt from 'custom-electron-prompt';

export let mainWindow: BrowserWindow | null = null;

nativeTheme.themeSource = 'dark';

ipcMain.handle('get-cartexplore-code', () =>
  readFile(getAssetPath('cartexplorer.js')).then((f) => f.toString())
);
ipcMain.handle(
  'save-screenshot',
  async (ev, data: Uint8Array, name: string) => {
    try {
      await access(join(homedir(), 'rainbow32-screenshots'), constants.W_OK);
    } catch {
      await mkdir(join(homedir(), 'rainbow32-screenshots'));
    }
    const file = join(
      homedir(),
      'rainbow32-screenshots',
      name.replaceAll('/', '').replaceAll('\\', '')
    );
    writeFile(file, data);
  }
);
ipcMain.handle('prompt', async (_ev, message: string, value?: string) => {
  return prompt(
    {
      title: 'Alert',
      label: message,
      value: value || '',
    },
    mainWindow
  ).then(
    (r: string | null) => r,
    () => null
  );
});

async function getCarts() {
  const cartridges: string[] = [];
  if (!existsSync(join(homedir(), '.cartridges'))) return [];
  const dirs: string[] = [join(homedir(), '.cartridges')];
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (!dir) break;
    try {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        if (e.isDirectory()) dirs.push(join(dir, e.name));
        else if (e.isFile() && e.name.endsWith('.png')) {
          readFile(join(dir, e.name))
            .then((c) => c.toString('base64'))
            .then((val) => cartridges.push('data:image/png;base64,' + val));
        }
      }
    } catch {}
  }
  return cartridges;
}
ipcMain.handle('get-cartridges', getCarts);
ipcMain.on('press-key', (ev, key: string) => pressKey(key));
function pressKey(key: string) {
  if (!mainWindow) return;
  mainWindow.webContents.sendInputEvent({
    type: 'keyDown',
    keyCode: key.toUpperCase(),
  });
  mainWindow.webContents.sendInputEvent({
    type: 'keyUp',
    keyCode: key.toUpperCase(), // that works surprisingly even with modifier keys like Shift, which gets turned into SHIFT
  });
}

ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

ipcMain.on('load-program', (ev, program: 'sdk' | 'rainbow32') => {
  if (!mainWindow) return;
  if (program === 'rainbow32')
    mainWindow.loadFile(getAssetPath('rainbow32.html'));
  else if (program === 'sdk') mainWindow.loadFile(getAssetPath('sdk.html'));
});

const args = process.argv.slice(1);

const mismen = getMiscMenu();

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
    autoHideMenuBar: true,
    darkTheme: true,
  });

  mainWindow.loadFile(
    args.includes('sdk')
      ? getAssetPath('sdk.html')
      : getAssetPath('rainbow32.html')
  );

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
    try {
      const url = new URL(edata.url);
      if (
        url.origin.endsWith('github.com') &&
        url.pathname.startsWith('/rainbow32-console/rainbow32/wiki')
      ) {
        const wind = new BrowserWindow({
          icon: getAssetPath('icon.png'),
          darkTheme: true,
        });
        wind.setMenu(mismen);
        wind.loadURL(edata.url);
      } else shell.openExternal(edata.url);
    } catch {
      shell.openExternal(edata.url);
    }
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

    // globalShortcut.register('F12', () => spawnSync('shutdown', ['0']));
  })
  .catch(console.log);
