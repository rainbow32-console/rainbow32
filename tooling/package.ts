import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function makeDataURI(file: string, type: string) {
    return `data:${type};base64,${(await readFile(file)).toString('base64')}`;
}

(async function () {
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
            `<script>globalThis.__wasmpath = "https://unpkg.com/esbuild-wasm/esbuild.wasm";
    
    ${(await readFile(join(__dirname, 'public', 'dist', 'index.js')))
        .toString()
        .replaceAll('</script>', '</scr\\ipt>')}
    </script></body>` +
            '</html>'
    );
})();
