import bodyParser from 'body-parser';
import { spawnSync } from 'child_process';
import express from 'express';
import { writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';

interface Image {
    width: number;
    height: number;
    buf: Uint8Array;
}
interface ImageMask {
    width: number;
    height: number;
    buf: Uint8Array;
}
interface Audio {
    channel1: Uint8Array;
    channel2: Uint8Array;
    channel3: Uint8Array;
    channel4: Uint8Array;
    channel1Instrument: string;
    channel2Instrument: string;
    channel3Instrument: string;
    channel4Instrument: string;
    length: number;
}

const server = express();

server.use(express.static(join(__dirname, 'client', 'public')));

function stringify(obj1deep: Record<string, any>) {
    let str = '{';

    for (const [k, v] of Object.entries(obj1deep)) {
        str += `${JSON.stringify(k)}: `;
        if (v instanceof Uint8Array)
            str += 'new Uint8Array(' + JSON.stringify([...v.values()]) + ')';
        else if (typeof v === 'object' && v) str += stringify(v);
        else str += JSON.stringify(v);
        str += ',';
    }

    return str + '}';
}

const typeImports = [
    'Font',
    'Button',
    'Vec2',
    'Vec3',
    'Vec4',
    'Transform',
    'Component',
    'GameObjectOptions',
    'ComponentEntry',
    'UserScene',
    'Line',
    'ColorPalette',
    'Image',
    'ImageMask',
    'GameFile',
    '_GameObject',
    '_Scene',
    '_SceneManager',
    '_TextUtils',
    'ImageUtils',
    'Utils',
    'SaveFileUtils',
    '_Math',
    'GameObject',
    'gfxInstrument',
    'Instrument',
    'Audio',
    'Sound',
    'SoundFunction',
    'AudioUtils',
];
const imports = [
    'registerGame',
    'fonts',
    'imageUtils',
    'audioUtils',
    'utils',
    'ImageRenderer',
    'createComponent',
    'comp',
    'component',
    'memory',
    'isPressed',
    'buttons',
    'WIDTH',
    'HEIGHT',
    'stopGame',
    'reset',
    'math',
    'saveFile',
    'Scene',
    'SceneManager',
    'TextUtils',
];

type Requestify<T extends Record<string, any>> = {
    [P in keyof T]: T[P] extends Uint8Array ? number[] : T[P];
};

server.use(bodyParser.json());

server.post('/api/build', async (req: any, res: any) => {
    try {
        if (
            !req.body ||
            !req.body.code ||
            !req.body.images ||
            !req.body.masks ||
            !req.body.audios ||
            typeof req.body.code !== 'string' ||
            typeof req.body.masks !== 'object' ||
            typeof req.body.images !== 'object' ||
            typeof req.body.audios !== 'object'
        )
            return res.status(400).send('Error: No code');

        const images: Record<string, Image> = {};
        const masks: Record<string, ImageMask> = {};
        const audios: Record<string, Audio> = {};
        for (const [k, v] of Object.entries(
            req.body.images as Requestify<Record<string, Image>>
        ))
            images[k] = {
                width: v.width,
                height: v.height,
                buf: new Uint8Array(v.buf),
            };

        for (const [k, v] of Object.entries(
            req.body.masks as Requestify<Record<string, ImageMask>>
        ))
            masks[k] = {
                width: v.width,
                height: v.height,
                buf: new Uint8Array(v.buf),
            };

        for (const [k, v] of Object.entries(
            req.body.audios as Requestify<Record<string, Audio>>
        ))
            audios[k] = {
                length: v.length,
                channel1Instrument: v.channel1Instrument,
                channel2Instrument: v.channel2Instrument,
                channel3Instrument: v.channel3Instrument,
                channel4Instrument: v.channel4Instrument,
                channel1: new Uint8Array(v.channel1),
                channel2: new Uint8Array(v.channel2),
                channel3: new Uint8Array(v.channel3),
                channel4: new Uint8Array(v.channel4),
            };

        const code = `import { ${imports.join(
            ', '
        )} } from 'library';\nimport type { ${typeImports.join(
            ', '
        )} } from 'library';\n\n(function(){const a:any=${stringify(
            images
        )};const b:any=${stringify(req.body.masks)};const c:any=${stringify(
            audios
        )};const d=(globalThis as any);d.getImage=(path:any)=>a[path];d.getMask=(path:any)=>b[path];d.getAudio=(path:any)=>c[path];})();\n\n${
            req.body.code
        }`;

        await writeFile(join(__dirname, 'game.ts'), code);
        console.log('Compiling...');
        const spawned = spawnSync(
            'esbuild',
            ['--bundle', '--minify', '--outfile=./game.js', './game.ts'],
            {
                cwd: __dirname,
            }
        );
        if (spawned.status !== 0)
            throw new Error(
                'Failed to compile:\n' +
                    spawned.output.map((el) => (el ? '' + el : '')).join('')
            );
        res.send((await readFile(join(__dirname, 'game.js'))).toString());
    } catch (e: any) {
        res.status(500).send(
            e?.message || e?.name || e?.toString() || 'Unknown error'
        );
    }
    rm(join(__dirname, 'game.ts'));
    rm(join(__dirname, 'game.js')).catch(() => {});
});

server.get('*', (req: any, res: any) =>
    res.sendFile(join(__dirname, 'client', 'public', 'index.html'))
);

server.listen(8080, () => console.log('Listening on port 8080'));
