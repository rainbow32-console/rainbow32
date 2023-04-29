import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { watch } from 'fs';
import * as esbuild from 'esbuild';

async function makeDataURI(file: string, type: string) {
    return `data:${type};base64,${(await readFile(file)).toString('base64')}`;
}

let building = false;
async function build() {
    if (building) return;
    console.log('Started build...');
    building = true;
    let html = (
        await readFile(join(__dirname, 'public', 'index.html'))
    ).toString();

    const css = (await readFile(join(__dirname, 'public', 'styles.css')))
        .toString()
        .replaceAll(
            './pixeloid.ttf',
            await makeDataURI(
                join(__dirname, 'public', 'pixeloid.ttf'),
                'font/ttf'
            )
        )
        .replaceAll(
            './rainbow32-font.ttf',
            await makeDataURI(
                join(__dirname, 'public', 'rainbow32-font.ttf'),
                'font/ttf'
            )
        )
        .replaceAll(
            './rainbow32-no-special-characters.ttf',
            await makeDataURI(
                join(__dirname, 'public', 'rainbow32-no-special-characters.ttf'),
                'font/ttf'
            )
        );

    const head = `<meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rainbow32 Console Tooling</title>
    <style>${css}</style>`;

    await writeFile(
        join(__dirname, 'packaged.html'),
        '<!DOCTYPE html><html lang="en"><head>' +
            head +
            '</head>' +
            html +
            `<script>globalThis.__wasmpath = "https://unpkg.com/esbuild-wasm@0.17.18/esbuild.wasm";
    
    ${(await readFile(join(__dirname, 'public', 'dist', 'index.js')))
        .toString()
        .replaceAll('</script>', '</scr\\ipt>')}
    </script></body>` +
            '</html>'
    );
    building = false;
    console.log('Finished build!');
}

watch(join(__dirname, 'public', 'index.html'), null, build);
watch(join(__dirname, 'public', 'styles.css'), null, build);
const packagePlugin = {
    name: 'packager',
    setup(_build) {
        _build.onEnd((result) => {
            if (result.errors.length < 1) build();
        });
    },
};
esbuild
    .context({
        bundle: true,
        minify: true,
        outdir: join(__dirname, 'public', 'dist'),
        entryPoints: [join(__dirname, 'src', 'index.ts')],
        plugins: [packagePlugin],
    })
    .then((l) => l.watch());
