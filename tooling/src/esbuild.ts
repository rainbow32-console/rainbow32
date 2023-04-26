import * as esbuild from 'esbuild-wasm';
import {
    createNotification,
    getAudios,
    getImages,
    getMasks,
    getTexts,
} from '.';
import { Audio, parseAudio } from '../../rainbow32/src/audioUtils';
import {
    Image,
    ImageMask,
    parseImage,
    parseMask,
} from '../../rainbow32/src/imageUtils';
import globalcode from './globalcode';

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

type Requestify<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Uint8Array ? number[] : T[K];
};

const promise = esbuild.initialize({
    wasmURL: globalThis.__wasmpath,
});

export async function compile(code: string) {
    const stringImgs = getImages();
    const stringMasks = getMasks();
    const stringAudios = getAudios();
    const images: Record<string, Requestify<Image>> = {};
    const masks: Record<string, Requestify<ImageMask>> = {};
    const audios: Record<string, Requestify<Audio>> = {};

    for (const k of Object.keys(stringImgs)) {
        if (k.startsWith('__screenshot')) continue;
        try {
            const parsed = parseImage(stringImgs[k]);
            images[k] = {
                buf: [...parsed.buf.values()],
                height: parsed.height,
                width: parsed.width,
            };
        } catch {}
    }
    for (const k of Object.keys(stringMasks)) {
        try {
            const parsed = parseMask(stringMasks[k]);
            masks[k] = {
                buf: [...parsed.buf.values()],
                height: parsed.height,
                width: parsed.width,
            };
        } catch {}
    }
    for (const k of Object.keys(stringAudios)) {
        try {
            const parsed = parseAudio(stringAudios[k]);
            audios[k] = {
                channel1Instrument: parsed.channel1Instrument,
                channel2Instrument: parsed.channel2Instrument,
                channel3Instrument: parsed.channel3Instrument,
                channel4Instrument: parsed.channel4Instrument,
                length: parsed.length,
                channel1: [...parsed.channel1.values()],
                channel2: [...parsed.channel2.values()],
                channel3: [...parsed.channel3.values()],
                channel4: [...parsed.channel4.values()],
            };
        } catch {}
    }

    return await compileTypescript(
        `(function(){const a:any=${stringify(images)};const b:any=${stringify(
            masks
        )};const c:any=${stringify(
            audios
        )};const d=(globalThis as any);const e=${JSON.stringify(
            getTexts()
        )};d.getImage=(path:any)=>a[path];d.getMask=(path:any)=>b[path];d.getAudio=(path:any)=>c[path];d.getString=(path:any)=>e[path];})();\n\n${code}`
    ).catch((err) => {
        console.error(err);
        createNotification(
            'Error',
            'Failed to compile! Check the console (F12/Ctrl+Shift+I)',
            '#b91c1c'
        );
        return;
    });
}

export async function compileTypescript(code: string): Promise<string> {
    await promise;
    const res = await esbuild.transform(globalcode + '\n\n' + code, {
        minify: true,
        loader: 'ts',
    });
    return res.code;
}
