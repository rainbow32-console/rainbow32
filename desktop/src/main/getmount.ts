import { spawnSync } from 'child_process';

export function getMountpoint(device: string): string {
  return spawnSync('lsblk', ['-o', 'mountpoint', device])
    .stdout.toString()
    .substring(10)
    .trim();
}
