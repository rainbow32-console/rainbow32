import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';
import { getAssetPath, mainWindow } from './main';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'About ElectronReact',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide ElectronReact',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Wiki',
          click() {
            shell.openExternal(
              'https://github.com/rainbow32-console/rainbow32/wiki'
            );
          },
        },
        {
          label: 'API (constants & functions)',
          click() {
            shell.openExternal(
              'https://github.com/rainbow32-console/rainbow32/wiki/API-(constants-&-functions)'
            );
          },
        },
        {
          label: 'API (Types)',
          click() {
            shell.openExternal(
              'https://github.com/rainbow32-console/rainbow32/wiki/API-(Types)'
            );
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal(
              'https://github.com/rainbow32-console/rainbow32/issues'
            );
          },
        },
      ],
    };

    const subMenuView = subMenuViewDev;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate(): MenuItemConstructorOptions[] {
    return [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
            },
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: (_m, wind) => {
              wind?.webContents.toggleDevTools();
            },
          },
          {
            label: 'Switch to SDK',
            click() {
              mainWindow?.loadFile(getAssetPath('sdk.html'));
            },
          },
          {
            label: 'Switch to Console',
            click() {
              mainWindow?.loadFile(getAssetPath('rainbow32.html'));
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Wiki',
            click() {
              shell.openExternal(
                'https://github.com/rainbow32-console/rainbow32/wiki'
              );
            },
          },
          {
            label: 'API (constants & functions)',
            click() {
              shell.openExternal(
                'https://github.com/rainbow32-console/rainbow32/wiki/API-(constants-&-functions)'
              );
            },
          },
          {
            label: 'API (Types)',
            click() {
              shell.openExternal(
                'https://github.com/rainbow32-console/rainbow32/wiki/API-(Types)'
              );
            },
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal(
                'https://github.com/rainbow32-console/rainbow32/issues'
              );
            },
          },
        ],
      },
    ];
  }
}

export function getMiscMenu(): Menu {
  function buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Command+W',
          click: (_m, wind) => {
            wind?.close();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click: (_m, wind) => {
            wind?.webContents.reload();
          },
        },
        {
          label: 'Toggle &Full Screen',
          accelerator: 'Alt+Command+F',
          click: (_, wind) => {
            wind?.setFullScreen(!wind.isFullScreen());
          },
        },
        {
          label: 'Toggle &Developer Tools',
          accelerator: 'Alt+Command+I',
          click: (_m, wind) => {
            wind?.webContents.toggleDevTools();
          },
        },
      ],
    };

    return [subMenuAbout, subMenuEdit];
  }

  function buildDefaultTemplate(): MenuItemConstructorOptions[] {
    return [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: (_m, wind) => {
              wind?.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: (_m, wind) => {
              wind?.webContents.reload();
            },
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: (_m, wind) => {
              wind?.setFullScreen(!wind?.isFullScreen());
            },
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: (_m, wind) => {
              wind?.webContents.toggleDevTools();
            },
          },
        ],
      },
    ];
  }

  const template =
    process.platform === 'darwin'
      ? buildDarwinTemplate()
      : buildDefaultTemplate();

  return Menu.buildFromTemplate(template);
}
