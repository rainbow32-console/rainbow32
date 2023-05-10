// NOTE: This is supposed to be called from the build script in the library folder located in `../library`.

console.log('syncing the lib... in ' + __dirname)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
// import {spawnSync} from 'child_process'
try {
    // spawnSync('pnpm', ['build'], {cwd: join(__dirname, '../library')})
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
    
    console.log('synced the lib!');
} catch (e) {
    console.error('Failed: ', e);
}