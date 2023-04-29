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
        if (Array.isArray(v) || v instanceof Array)
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
                channel1instrument: parsed.channel1instrument,
                channel2instrument: parsed.channel2instrument,
                channel3instrument: parsed.channel3instrument,
                channel4instrument: parsed.channel4instrument,
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
        )};d.getimage=(path:any)=>a[path];d.getmask=(path:any)=>b[path];d.getaudio=(path:any)=>c[path];d.getstring=(path:any)=>e[path];})();\n${code}`
    ).catch((err) => {
        globalThis.err = err;
        let msg = '' + err;
        msg = msg.replaceAll(
            /<stdin>:([0-9]+):([0-9]+)/g,
            (
                _str: string,
                ln: string,
                char: string,
            ) => {
                return 'game.ts:' + (Number(ln) - 1) + ':' + char;
            }
        );

        console.error(msg);
        return compileTypescript(`(function() {
        const colors = [3, 4, 5, 27, 28, 12, 13, 11, 10, 9, 15, 19, 20];
        function writeRainbowText(x: number, text: string, y: number) {
            let col = 0;
            for (let i = 0; i < text.length; ++i) {
                x =
                    TextUtils.writeText(text[i], x, y, WIDTH, {
                        color: colors[col % colors.length],
                        background: 0,
                    })[0].end + 1;
                if (text[i] === '\\n') y += 6;
                if (text[i] !== '\\n' && text[i] !== ' ') col++;
            }
        
            return { x, y };
        };
    __registeredGame={name: 'failed to compile', bg: '#000', 
        async init() {
            imageUtils.cls();
            imageUtils.putImage(0, 0, imageUtils.square(WIDTH, HEIGHT, 0));
            const y = writeRainbowText(3, 'Rainbow32 V1.0', 3).y + 8;
            TextUtils.writeText("Cartridge Crashed! :(\\n\\n" + ${JSON.stringify(
                msg
            )}, 3, y, WIDTH - 3, {
                color: 3,
                background: 0,
            });
        
            await audioUtils.playSound(
                { octave: 4, halfToneStepUp: false, sound: 'c' },
                'square-wave',
                0.2,
                0.1
            );
            await audioUtils.playSound(
                { octave: 3, halfToneStepUp: false, sound: 'c' },
                'square-wave',
                0.2,
                0.2
            );
        }}})();`);
    });
}

export async function compileTypescript(code: string): Promise<string> {
    await promise;
    const res = await esbuild.transform(globalcode + ';' + code, {
        minify: true,
        loader: 'ts',
    });
    return res.code;
}
