import chalk from 'chalk';
import { build as esbuild } from 'esbuild';
import { existsSync, readFileSync } from 'fs';
import { rm, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import { tree } from '../utils';

export async function build() {
    console.log(chalk.greenBright('Building...\nGenerating Asset files...'));
    await generateAssetFiles();
    console.log(chalk.greenBright('Transpiling Typescript...'));
    try {
        const out = await esbuild({
            bundle: true,
            minify: true,
            outdir: join(process.cwd(), 'dist'),
            entryPoints: [join(process.cwd(), 'src', 'game.ts')],
        });
        if (out.errors.length < 1)
            return console.log(chalk.greenBright('Finished build!'));
        console.log(chalk.redBright('Build failed!'));
        for (let i = 0; i < out.errors.length; ++i)
            console.log(out.errors[i].text);
    } catch (e) {
        console.log(chalk.redBright('Build failed!'));
        console.log(e);
    }
}

async function generateAssetFiles() {
    try {
        await rm(join(process.cwd(), 'src', 'assets', 'index.js'));
    } catch {}

    const assetDir = join(process.cwd(), 'assets');
    if (!existsSync(assetDir))
        return await writeFile(
            join(process.cwd(), 'src', 'assets', 'index.js'),
            "const assets = {};\nfunction getAsset(path){return assets[path]||''};\nmodule.exports = { assets, getAsset };"
        );

    const mime_types: Record<string, string | undefined> = {
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg',
        mp4: 'video/mp4',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        bmp: 'image/bmp',
        avif: 'image/avif',
        css: 'text/css',
        csv: 'text/csv',
        gif: 'image/gif',
        htm: 'text/html',
        html: 'text/html',
        ico: 'image/vnd.microsoft.icon',
        js: 'text/javascript',
        mid: 'audio/midi',
        midi: 'audio/midi',
        mpeg: 'video/mpeg',
        oga: 'audio/ogg',
        ogv: 'video/ogg',
        opus: 'audio/opus',
        svg: 'image/svg+xml',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        wav: 'audio/wav',
        weba: 'audio/webm',
        webm: 'video/webm',
        webp: 'image/webm',
    };

    const files = tree(assetDir).map((el) => ({
        name: relative(assetDir, el),
        contents:
            'data:' +
            (mime_types[el.split('.').pop() || ''] ||
                'application/octet-stream') +
            ';base64,' +
            readFileSync(el).toString('base64'),
    }));

    const assets: Record<string, string> = {};

    const srcFiles = tree(join(process.cwd(), 'src'));
    for (let i = 0; i < srcFiles.length; ++i) {
        if (srcFiles[i].endsWith('.ts') && !srcFiles[i].endsWith('.d.ts')) {
            const contents = readFileSync(srcFiles[i]).toString();
            for (const f of files)
                if (!assets[f.name] && contents.includes(f.name)) {
                    assets[f.name] = f.contents;
                    console.log('Found %s in %s', f.name, srcFiles[i]);
                }
        }
    }

    await writeFile(
        join(process.cwd(), 'src', 'assets', 'index.js'),
        `const assets = ${JSON.stringify(
            assets
        )};\nfunction getAsset(path){return assets[path]||''};\nmodule.exports = { assets, getAsset }`
    );
}
