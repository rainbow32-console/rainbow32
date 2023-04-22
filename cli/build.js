const { spawnSync } = require('child_process');
const {
    existsSync,
    mkdirSync,
    readdirSync,
    writeFileSync,
    readFileSync,
} = require('fs');
const { join } = require('path');

spawnSync('tsc').stdout.forEach((el) => process.stdout.write(el));
process.stdout.write('\n');
if (!existsSync(join(__dirname, 'dist', 'refs')))
    mkdirSync(join(__dirname, 'dist', 'refs'));
readdirSync(join(__dirname, 'src', 'refs')).forEach((el) =>
    writeFileSync(
        join(__dirname, 'dist', 'refs', el),
        readFileSync(join(__dirname, 'src', 'refs', el))
    )
);
writeFileSync(
    join(__dirname, 'dist', 'package.json'),
    readFileSync(join(__dirname, 'package.json'))
);
writeFileSync(
    join(__dirname, 'dist', 'README.md'),
    readFileSync(join(__dirname, 'README.md'))
);
writeFileSync(
    join(__dirname, 'dist', 'LICENSE'),
    readFileSync(join(__dirname, 'LICENSE'))
);
