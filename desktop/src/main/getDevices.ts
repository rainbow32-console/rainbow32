import { spawnSync } from 'child_process';

export function getDevices() {
  const output = spawnSync('lsblk', [
    '-o',
    'KNAME,TYPE,LABEL',
  ]).stdout.toString();

  const devices: { id: string; name: string }[] = [];

  for (const o of output.matchAll(/([a-z0-9]+) +([a-z0-9]+) +([a-z0-9A-Z]*)/g)) {
    if (o[2] !== 'part' || o[3].length < 1) continue;
    devices.push({ id: o[1], name: o[3] });
  }

  return devices;
}
export const devices = getDevices();