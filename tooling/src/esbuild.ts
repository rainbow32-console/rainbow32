import * as esbuild from 'esbuild-wasm';
import {
    AnimationData,
    getAnimations,
    getAudios,
    getImages,
    getMasks,
    getTexts,
} from '.';
import { Audio, parseAudio } from '../../rainbow32/src/audioUtils';
import type { Animation } from '../../rainbow32/src/animation';
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
        else if (v instanceof Array) str += JSON.stringify(v);
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
    const images: Record<string, Image> = {};
    const masks: Record<string, ImageMask> = {};
    const audios: Record<string, Audio> = {};

    for (const k of Object.keys(stringImgs)) {
        if (k.startsWith('__screenshot')) continue;
        try {
            images[k] = parseImage(stringImgs[k]);
        } catch {}
    }
    for (const k of Object.keys(stringMasks)) {
        try {
            masks[k] = parseMask(stringMasks[k]);
        } catch {}
    }
    for (const k of Object.keys(stringAudios)) {
        try {
            audios[k] = parseAudio(stringAudios[k]);
        } catch {}
    }

    return await compileTypescript(
        `(function(){const a:any=${stringify(images)};const b:any=${stringify(
            masks
        )};const c:any=${stringify(
            audios
        )};const d=(globalThis as any);const e=${JSON.stringify(
            getTexts()
        )};const f=${formatAnimations(
            getAnimations()
        )};d.getimage=(path:any)=>a[path];d.getmask=(path:any)=>b[path];d.getaudio=(path:any)=>c[path];d.getstring=(path:any)=>e[path];d.getanimation=(path:any)=>f[path]})();\n${code}`
    ).catch((err) => {
        globalThis.err = err;
        let msg = '' + err;
        msg = msg.replaceAll(
            /<stdin>:([0-9]+):([0-9]+)/g,
            (_str: string, ln: string, char: string) => {
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

function formatAnimations(animations: Record<string, AnimationData>): string {
    let newanimations: Record<string, Animation<any>> = {};
    const images = getImages();
    const masks = getMasks();
    for (const k of Object.keys(animations)) {
        if (animations[k].type === 'text')
            newanimations[k] = animations[k].animation;
        else if (animations[k].type === 'image')
            newanimations[k] = animations[k].animation.map((el) => ({
                time: el.time,
                value: parseImage(images[el.value]),
            }));
        else if (animations[k].type === 'mask')
            newanimations[k] = animations[k].animation.map((el) => ({
                time: el.time,
                value: parseMask(masks[el.value]),
            }));
    }

    return stringify(newanimations);
}
