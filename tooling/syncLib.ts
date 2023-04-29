import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {spawnSync} from 'child_process'

spawnSync('pnpm', ['build'], {cwd: join(__dirname, '../library')})
const lib = JSON.stringify(
    readFileSync(join(__dirname, '../library/dist/index.d.ts'))
        .toString()
        .replaceAll('export ', '')
);
writeFileSync(join(__dirname, 'src', 'globals.ts'), 'export default ' + lib);
writeFileSync(
    join(__dirname, 'src', 'globalcode.ts'),
    'export default ' +
        JSON.stringify(
            readFileSync(join(__dirname, '../library/index.ts'))
                .toString()
                .replaceAll('export ', '')
                .replaceAll(/\/\/[^\n]+/g, '')
                .replaceAll('\n', '')
        )
);
