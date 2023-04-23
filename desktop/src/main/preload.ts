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
    getDevices(): Promise<string[]> {
      return invoke('get-devices');
    },
    mountDevice(device: string): Promise<void> {
      return invoke('mount', device);
    },
    unmountDevice(device: string): Promise<void> {
      return invoke('unmount', device);
    },
    listDirectory(
      device: string,
      path: string
    ): Promise<undefined | { name: string; file: boolean }[]> {
      return invoke('list-dir', device, path);
    },
    getFileContents(device: string, path: string): Promise<string | undefined> {
      return invoke('get-file-contents', device, path);
    },
    sendKey(key: string) {
      return ipcRenderer.send('press-key', key);
    },
    getCartridges(): Promise<string[]> {
      return ipcRenderer.invoke('get-cartridges');
    }
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('__console_config_canvasFullScreen', true);
export type ElectronHandler = typeof electronHandler;