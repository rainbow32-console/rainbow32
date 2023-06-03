// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

export type Channels =
  | 'list-dir'
  | 'mount'
  | 'unmount'
  | 'get-devices'
  | 'get-file-contents';

function invoke(channel: Channels, ...data: any[]): Promise<any> {
  return ipcRenderer.invoke(channel, ...data);
}

const electronHandler = {
  ipcRenderer: {
    sendKey(key: string) {
      return ipcRenderer.send('press-key', key);
    },
    getCartridges(): Promise<string[]> {
      return ipcRenderer.invoke('get-cartridges');
    },
    toggleFullscreen() {
      ipcRenderer.send('toggle-fullscreen');
    },
    loadProgram(program: 'sdk' | 'rainbow32') {
      ipcRenderer.send('load-program', program);
    },
    saveScreenshot(data: Uint8Array, name: string) {
      ipcRenderer.invoke('save-screenshot', data, name);
    },
    getExplorerCode(): Promise<string> {
      return ipcRenderer.invoke('get-cartexplore-code');
    },
    prompt(message: string, value?: string): Promise<string|null> {
      return ipcRenderer.invoke('prompt', message, value);
    }
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('__console_config_canvasFullScreen', true);
export type ElectronHandler = typeof electronHandler;
