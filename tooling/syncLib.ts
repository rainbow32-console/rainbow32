import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const lib = JSON.stringify(
    readFileSync(join(__dirname, '../library/dist/index.d.ts'))
        .toString()
        .replaceAll('export ', '')
);
writeFileSync(
    join(__dirname, 'client', 'src', 'globals.ts'),
    'export default ' + lib
);
writeFileSync(
    join(__dirname, 'client', 'src', 'globalcode.ts'),
    'export default ' +
        JSON.stringify(
            readFileSync(join(__dirname, '../library/index.ts'))
                .toString()
                .replaceAll('export ', '')
        )
);
