import { spawnSync } from 'child_process';
import { join } from 'path';

export function mount(device: string): string {
  console.log('Mounting %s', device);
  return spawnSync('udisksctl', ['mount', '-b', '/' + join('dev', device)])
    .stdout.toString()
    .substring(17 + device.length).trim();
}

export function unmount(device: string): void {
  console.log('Unmounting %s', device)
  spawnSync('udisksctl', ['unmount', '-b', '/' + join('dev', device)]);
}
