import { spawnSync } from 'child_process';
import { readFile, writeFile, readdir, rm } from 'fs/promises';
import { join, relative } from 'path';

async function tree(dir: string) {
    const dirs: string[] = [dir];
    const files: string[] = [];

    while (dirs.length > 0) {
        const dir = dirs.pop();
        if (!dir) break;
        for (const entry of await readdir(dir, { withFileTypes: true })) {
            if (entry.isFile()) files.push(join(dir, entry.name));
            else if (entry.isDirectory()) dirs.push(join(dir, entry.name));
        }
    }

    return files.map((el) => relative(dir, el));
}

const consts: string[] = [];

function registerConst(value: string) {
    let name = `value_${consts.length}`;
    consts.push(value);
    return name;
}

async function generateRouter() {
    const entries = (await tree(join(__dirname, 'client', 'public')))
        .filter((el) => !el.endsWith('.map'))
        .map((el) => (el[0] === '/' ? el : '/' + el));
    let str = '';

    for (const el of entries)
        if (el !== '/index.html')
            str += `server.get(${JSON.stringify(
                el
            )}, (req:any, res:any) => res.type(${JSON.stringify(
                el.substring(el.lastIndexOf('.'))
            )}).end(${registerConst(
                `new Uint8Array(${JSON.stringify([
                    ...(
                        await readFile(join(__dirname, 'client', 'public', el))
                    ).values(),
                ])})`
            )}));\n`;

    for (let i = 0; i < consts.length; ++i) {
        str += `const value_${i} = ${consts[i]}\n`;
    }
    return str;
}

(async function () {
    await writeFile(
        'packaged.ts',
        (
            await readFile(join(__dirname, 'server.ts'))
        )
            .toString()
            .replaceAll(
                "server.use(express.static(join(__dirname, 'client', 'public')));",
                await generateRouter()
            )
            .replaceAll(
                "server.get('*', (req: any, res: any) =>\n    res.sendFile(join(__dirname, 'client', 'public', 'index.html'))\n);",
                "server.get('*', (req: any, res: any) => res.type('.html').end(" +
                    JSON.stringify(
                        (
                            await readFile(
                                join(
                                    __dirname,
                                    'client',
                                    'public',
                                    'index.html'
                                )
                            )
                        ).toString()
                    ) +
                    '))'
            )
    );
    spawnSync(
        'esbuild',
        [
            '--bundle',
            '--minify',
            './packaged.ts',
            '--outfile=./toolings.js',
            '--platform=node',
        ],
        { cwd: __dirname }
    ).output.forEach((el) => (!el ? null : process.stdout.write(el)));
    console.log('\n');
    // await rm(join(__dirname, 'packaged.ts'));
})();
