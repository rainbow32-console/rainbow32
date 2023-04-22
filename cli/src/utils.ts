import { spawn as _spawn, SpawnOptions } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

export function spawn(
    command: string,
    args: string[],
    options?: SpawnOptions
): Promise<void> {
    return new Promise((res) => {
        const proc = _spawn(command, args, options || {});
        proc.on('close', res);
        proc.on('exit', res);
        proc.on('error', res);
        proc.stdout?.pipe(process.stdout);
        proc.stderr?.pipe(process.stderr);
    });
}

export function tree(folder: string) {
    const dirs: string[] = [folder];
    const files: string[] = [];

    while (dirs.length > 0) {
        const dir = dirs.pop();
        if (!dir) break;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (let i = 0; i < entries.length; ++i) {
            if (entries[i].isFile()) files.push(join(dir, entries[i].name));
            else if (entries[i].isDirectory())
                dirs.push(join(dir, entries[i].name));
        }
    }

    return files;
}