export interface fn {
    /**
     * calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
     * @param thisArg the object to be used as the this object.
     * @param argArray a set of arguments to be passed to the function.
     */
    apply(this: fn, thisarg: any, argarray?: any): any;

    /**
     * calls a method of an object, substituting another object for the current object.
     * @param thisarg the object to be used as the current object.
     * @param argarray a list of arguments to be passed to the method.
     */
    call(this: fn, thisarg: any, ...argarray: any[]): any;

    /**
     * for a given function, creates a bound function that has the same body as the original function.
     * the this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg an object to which the this keyword can refer inside the new function.
     * @param argArray a list of arguments to be passed to the new function.
     */
    bind(this: fn, thisarg: any, ...argarray: any[]): any;
    readonly name: string;
    readonly length: number;
}
export interface Function extends fn {}
export interface String {
    length: number;
    repeat(amount: number): string;
}
export interface array<t> {
    readonly length: number;
    [index: number]: t;
    push(...values: t[]): number;
    unshift(...values: t[]): number;
    pop(): void;
    shift(...values: t[]): void;
}
export interface Array<t> extends array<t> {}
export interface promiselike<t> {
    /**
     * attaches callbacks for the resolution and/or rejection of the promise.
     * @param onfulfilled the callback to execute when the promise is resolved.
     * @param onrejected the callback to execute when the promise is rejected.
     * @returns a promise for the completion of which ever callback is executed.
     */
    then<tres1 = t, tres2 = never>(
        onfulfilled?:
            | ((value: t) => tres1 | promiselike<tres1>)
            | undefined
            | null,
        onrejected?:
            | ((reason: any) => tres2 | promiselike<tres2>)
            | undefined
            | null
    ): promiselike<tres1 | tres2>;
}
export interface promise<t> {
    /**
     * attaches callbacks for the resolution and/or rejection of the promise.
     * @param onfulfilled the callback to execute when the promise is resolved.
     * @param onrejected the callback to execute when the promise is rejected.
     * @returns a promise for the completion of which ever callback is executed.
     */
    then<tres1 = t, tres2 = never>(
        onfulfilled?:
            | ((value: t) => tres1 | promiselike<tres1>)
            | undefined
            | null,
        onrejected?:
            | ((reason: any) => tres2 | promiselike<tres2>)
            | undefined
            | null
    ): promise<tres1 | tres2>;

    /**
     * attaches a callback for only the rejection of the promise.
     * @param onrejected the callback to execute when the promise is rejected.
     * @returns a promise for the completion of the callback.
     */
    catch<tres = never>(
        onrejected?:
            | ((reason: any) => tres | promiselike<tres>)
            | undefined
            | null
    ): promise<t | tres>;
}
type awaited<t> = t extends null | undefined
    ? t
    : t extends object & { then(onfulfilled: infer f): any }
    ? f extends (value: infer v, ...args: any) => any
        ? awaited<v>
        : never
    : t;

export interface Promise<t> extends promise<t> {}
export const promise: {
    /**
     * creates a promise that is resolved with an array of results when all of the provided promises
     * resolve, or rejected when any promise is rejected.
     * @param values an iterable of promises.
     * @returns a new promise.
     */
    all<t>(values: promiselike<t>[]): promise<awaited<t>[]>;

    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
     * or rejected.
     * @param values An iterable of Promises.
     * @returns A new Promise.
     */
    race<t>(values: promiselike<t>[]): promise<awaited<t>>;

    /**
     * creates a new promise.
     * @param executor a callback used to initialize the promise. this callback is passed two arguments:
     * a resolve callback used to resolve the promise with a value or the result of another promise,
     * and a reject callback used to reject the promise with a provided reason or error.
     */
    new <t>(
        executor: (
            resolve: (value: t | promiselike<t>) => void,
            reject: (reason?: any) => void
        ) => void
    ): promise<t>;

    /**
     * creates a new rejected promise for the provided reason.
     * @param reason the reason the promise was rejected.
     * @returns a new rejected Promise.
     */
    reject<t = never>(reason?: any): promise<t>;

    /**
     * Creates a new resolved promise.
     * @returns A resolved promise.
     */
    resolve(): promise<void>;

    /**
     * Creates a new resolved promise for the provided value.
     * @param value A promise.
     * @returns A promise whose internal state matches the provided promise.
     */
    resolve<t>(value: t | promiselike<t>): promise<t>;
} = globalThis.Promise as any;
export const Promise = promise;
export const globalthis = globalThis as any;
export interface arraylike<t> {
    readonly length: number;
    readonly [n: number]: t;
}
export interface arraylikereadable<t> {
    readonly length: number;
    [n: number]: t;
}
export interface typedarrayconstructor<t> {
    readonly prototype: t;
    new (length: number): t;
    new (array: arraylike<number>): t;
    new (buffer: arraybuffer, byteOffset?: number, length?: number): t;

    /**
     * returns a new array from a set of elements.
     * @param items a set of elements to include in the new array object.
     */
    of(...items: number[]): t;

    /**
     * creates an array from an array-like or iterable object.
     * @param arraylike an array-like or iterable object to convert to an array.
     */
    from(arraylike: arraylike<number>): t;

    /**
     * creates an array from an array-like or iterable object.
     * @param arraylike An array-like or iterable object to convert to an array.
     * @param mapfn A mapping function to call on every element of the array.
     * @param thisarg Value of 'this' used to invoke the mapfn.
     */
    from<t>(
        arraylike: arraylike<t>,
        mapfn: (v: t, k: number) => number,
        thisarg?: any
    ): t;
}
export interface arraybuffer {
    /**
     * returns a section of an ArrayBuffer.
     */
    slice(begin: number, end?: number): arraybuffer;
}
export interface uint8array {
    [index: number]: number;
    readonly buffer: arraybuffer;
    readonly length: number;
}
export interface uint8clampedarray {
    [index: number]: number;
    readonly buffer: arraybuffer;
    readonly length: number;
}
export interface json {
    /**
     * converts a javascript object notation (json) string into an object.
     * @param text a valid json string.
     * @param reviver a function that transforms the results. This function is called for each member of the object.
     * if a member contains nested objects, the nested objects are transformed before the parent object is.
     */
    parse(
        text: string,
        reviver?: (this: any, key: string, value: any) => any
    ): any;
    /**
     * converts a javascript value to a javascript object Notation (json) string.
     * @param value a javascript value, usually an object or array, to be converted.
     * @param replacer a function that transforms the results.
     * @param space adds indentation, white space, and line break characters to the return-value json text to make it easier to read.
     */
    stringify(
        value: any,
        replacer?: (this: any, key: string, value: any) => any,
        space?: string | number
    ): string;
    /**
     * converts a javascript value to a javascript object Notation (JSON) string.
     * @param value a javascript value, usually an object or array, to be converted.
     * @param replacer an array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
     * @param space adds indentation, white space, and line break characters to the return-value json text to make it easier to read.
     */
    stringify(
        value: any,
        replacer?: (number | string)[] | null,
        space?: string | number
    ): string;
}

export const uint8array: typedarrayconstructor<uint8array> = Uint8Array as any;
export const uint8clampedarray: typedarrayconstructor<uint8clampedarray> =
    Uint8ClampedArray as any;
export type partial<t> = { [p in keyof t]?: t[p] | undefined };
export type propertykey = string | number | symbol;
export type record<k extends propertykey, v> = { [p in k]: v };
export const number: (value: any) => number = Number;
export const json: json = JSON;
export function tostring(value: any) {
    if (value === null) return 'null';
    else if (value === undefined) return 'undefined';
    else if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '' + value;
        }
    }
    return '' + value;
}
export const tostr = tostring;
function importExposed(name: string): any {
    return (globalThis as any)[name];
}

export const sqrt = Math.sqrt as (x: number) => number;
export const flr = Math.floor as (x: number) => number;
export const ceil = Math.ceil as (x: number) => number;
export const abs = Math.abs as (x: number) => number;
export const sin = Math.sin as (x: number) => number;
export const cos = Math.cos as (x: number) => number;
export const tan = Math.tan as (x: number) => number;
export const atan2 = Math.atan2 as (x: number) => number;
export const max = Math.max as (...values: number[]) => number;
export const min = Math.min as (...values: number[]) => number;
export const mid = (x: number, y: number, z: number) =>
    Math.min(z, Math.max(x, y));
export const sgn = (x: number) => (x < 0 ? -1 : 1);

export const math = Math;
const object = Object;
export const keys = object.keys as (val: object) => string[];
export const pairs = (object as any).entries as <t>(
    o: { [s: string]: t } | arraylike<t>
) => [string, t][];
export const entries = (object as any).entries as <t>(
    o: { [s: string]: t } | arraylike<t>
) => [string, t][];
export const values = (object as any).values as <t>(
    o: { [s: string]: t } | arraylike<t>
) => t[];
export function rnd<t>(value: arraylike<t>): t;
export function rnd(value: string): string;
export function rnd(value: number): number;
export function rnd<t>(
    value: number | string | arraylike<t>
): number | string | t {
    if (typeof value === 'number') {
        value++;
        return Math.random() * value;
    } else if (
        isarr(value) ||
        typeof value === 'string' ||
        typeof value === 'object'
    ) {
        return value[flr(Math.random() * value.length)] as any;
    }
    throw new Error('unreachable');
}
export const playsound = importExposed('playSound') as (
    sound: sound,
    instrument: instrument,
    vol: number,
    time: number
) => promise<void>;
export const playaudio = importExposed('playAudio') as (
    audio: audio,
    timePerNote: number,
    vol: number
) => promise<void>;
/**
 * Returns the volume [0..100]
 */
export const getvolume = importExposed('getVolume') as () => number;
export const storetofile = importExposed('storetofile') as (
    obj: any,
    prefix?: string
) => void;
export const readfromfile = importExposed('readfromfile') as <t>(
    prefix?: string
) => t | undefined;
export const addparticle = importExposed('addparticle') as (
    life: number,
    pos: vec2,
    size: number,
    color: number,
    gravity: number,
    force: vec2,
    oob?: boolean,
    mask?: imagemask
) => particle;
export const removeparticle = importExposed('removeparticle') as (
    p: particle
) => void;
export const removeparticles = importExposed('removeparticles') as () => void;
export const renderparticles = importExposed('renderparticles') as () => void;
export const __menu = {
    resetentries: importExposed('resetentries') as () => void,
    setentry: importExposed('setentry') as (
        index: number,
        entry?: menuentry
    ) => void,
    removentry: importExposed('removentry') as (index: number) => void,
};
export const parseimage = importExposed('parseImage') as (img: string) => image;
export const parsemask = importExposed('parseMask') as (
    mask: string
) => imagemask;
export const defaultpalette = importExposed('defaultPalette') as colorpalette;
export const imageutils = {
    cls: importExposed('cls') as () => void,
    parseimage: importExposed('parseImage') as (img: string) => image,
    applyimagemask: importExposed('applyImageMask') as (
        image: image,
        mask: imagemask
    ) => image,
    applyimagemaskmodifyimage: importExposed('applyImageMaskModifyImage') as (
        image: image,
        mask: imagemask
    ) => image,
    circle: importExposed('circle') as (
        radius: number,
        color: number | string
    ) => image,
    square: importExposed('square') as (
        width: number,
        height: number,
        color: number | string
    ) => image,
    defaultpalette: importExposed('defaultPalette') as colorpalette,
    getcolor: importExposed('getColor') as (
        color: number
    ) => record<'a' | 'b' | 'g' | 'r', number>,
    getcurrentpalette: importExposed('getCurrentPalette') as () => colorpalette,
    isvalidcolor: importExposed('isValidColor') as (color: number) => boolean,
    parsemask: importExposed('parseMask') as (mask: string) => imagemask,
    putimage: importExposed('putImage') as (
        x: number,
        y: number,
        image: image
    ) => void,
    putimageraw: importExposed('putImageRaw') as (
        x: number,
        y: number,
        image: image
    ) => void,
    setcurrentpalette: importExposed('setCurrentPalette') as (
        palette: colorpalette
    ) => void,
    stringifyimage: importExposed('stringifyImage') as (img: image) => string,
    stringifymask: importExposed('stringifyMask') as (
        mask: imagemask
    ) => string,
    serializeimage: importExposed('serializeImage') as (
        img: image
    ) => Uint8Array,
    unserializeimage: importExposed('unserializeImage') as (
        img: Uint8Array
    ) => image,
    imgtopng: importExposed('imgToPng') as (
        image: image,
        type?: 'image/png' | 'image/jpeg' | 'image/webp' | undefined
    ) => string,
    setoffset: importExposed('setOffset') as (x: number, y: number) => void,
    setpixel: importExposed('setPixel') as (
        x: number,
        y: number,
        color: number | string
    ) => void,
    line: importExposed('line') as (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        col: number
    ) => void,
};
export const dist = importExposed('distance') as (
    x1: number,
    y1: number,
    x2: number,
    y2: number
) => number;
export const lerp = importExposed('lerp') as (
    p0: number,
    p1: number,
    t: number
) => number;
export const mem = importExposed('memory') as Uint8Array;
export const buttons = importExposed('buttons') as record<
    button,
    { down: boolean; press: boolean }
>;
export const stopgame = importExposed('stopgame') as () => promise<void>;
export const screen = {
    height: importExposed('height') as number,
    width: importExposed('width') as number,
};
export const scene = importExposed('scene') as {
    new <t>(scene: userscene<t>): scene;
};
export const scenemanager = importExposed('scenemanager') as scenemanager;
export const gameobject = importExposed('gameobject') as {
    new (opts: gameobjopts): gameobject;
};
export const createcomponent = importExposed('createcomponent') as <t>(
    component: component<t>,
    data?: partial<t>
) => componententry<t>;
export const component = importExposed('createcomponent') as <t>(
    component: component<t>,
    data?: partial<t>
) => componententry<t>;
export const comp = importExposed('createcomponent') as <t>(
    component: component<t>,
    data?: partial<t>
) => componententry<t>;
export const imagerenderer = importExposed('imagerenderer') as component<void>;
export const boxcollider = importExposed('boxcollider') as component<{
    width: number;
    height: number;
    oldCollisions: gameobject[];
}>;
export const download = importExposed('download') as (
    url: string,
    name: string
) => void;
export const isontimeout = importExposed('isontimeout') as (
    name: string
) => boolean;
export const timeout = importExposed('timeout') as (
    name: scene,
    ms: number
) => void;
export const nextframe = importExposed('nextframe') as () => promise<void>;
export const fonts = importExposed('fonts') as { [name: string]: font };
export const currenttextmasks = importExposed('currenttextmasks') as font;
export const textutils = {
    addcharmap: importExposed('addcharmap') as (
        char: string,
        mask: imagemask
    ) => void,
    applycharmap: importExposed('applycharmap') as (font: font) => void,
    clearcharmap: importExposed('clearcharmap') as () => void,
    calculatebounds: importExposed('calculatebounds') as (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        opts?: {
            spaceWidth?: number;
            centered?: boolean;
        }
    ) => line[],
    calculatewidth: importExposed('calculatewidth') as (
        text: string,
        spaceWidth?: number
    ) => number,
    writetext: importExposed('writetext') as (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        opts?: {
            color?: number;
            background?: number;
            spaceWidth?: number;
            centered?: boolean;
        }
    ) => line[],
};

export type instrument =
    | 'square-wave'
    | 'sine-wave'
    | 'triangle-wave'
    | 'sawtooth-wave'
    | 'noise';

export interface audio {
    channel1: Uint8Array;
    channel2: Uint8Array;
    channel3: Uint8Array;
    channel4: Uint8Array;
    channel1instrument: instrument;
    channel2instrument: instrument;
    channel3instrument: instrument;
    channel4instrument: instrument;
    length: number;
}

export interface sound {
    octave: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    sound: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
    sharp: boolean;
}

export interface particle {
    end: number;
    pos: vec2;
    image: image;
    gravity: number;
    force: vec2;
    fallsOOB: boolean;
}

export interface vec2 {
    x: number;
    y: number;
}

export interface vec3 {
    x: number;
    y: number;
    z: number;
}

export interface vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface imagemask {
    width: number;
    height: number;
    buf: uint8array;
}

export interface image {
    width: number;
    height: number;
    buf: uint8array;
}

interface menuentry {
    name: string;
    callback: () => any;
}

export type colorpalette = [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
];
export type button = 'up' | 'down' | 'left' | 'right' | 'u' | 'i' | 'o' | 'p';
export const buttonids: Readonly<button[]> = [
    'up',
    'down',
    'left',
    'right',
    'u',
    'i',
    'o',
    'p',
];
export interface userscene<t> {
    beforeinit(scene: scene): t;
    afterinit?(config: t, scene: scene): void;
    beforeupdate?(config: t, scene: scene, dt: number): void;
    afterupdate?(config: t, scene: scene, dt: number): void;
    beforeremove?(config: t, scene: scene): void;
    afterremove?(config: t, scene: scene): void;
    objects: gameobject[];
    name: string;
}
export interface scene {
    objects: gameobject[];
    addobjects(...obj: gameobject[]): void;
    getobjectbyname(name: string): gameobject | undefined;
    getobjectsbyname(name: string): gameobject[];
    removeobject(object: gameobject): void;
    removeobjects(...objects: gameobject[]): void;
    removeobjectsbyname(name: string): void;
    removeobjectsbynames(...name: string[]): void;
}
export interface scenemanager {
    setscenes(scenes: scene[], defaultselected?: number): void;
    addscene(scene: scene): void;
    changescene(scene: string | number): void;
    getscene(): scene | undefined;
}
export interface transform {
    position: vec2;
}

export interface component<config = void> {
    init(config: partial<config> | undefined, gameobject: gameobject): config;
    update?(config: config, dt: number, gameobject: gameobject): void;
    remove?(config: config, gameobject: gameobject): void;
    readonly name: string;
}

export interface gameobjopts {
    name: string;
    image: image | animation<image> | string;
    mask?: imagemask | animation<imagemask> | string;
    components?: componententry<any>[];
    opacity?: number;
    transform?: partial<transform>;
    customrenderer?: boolean;
    events?: record<string, (obj: gameobject, ...args: any[]) => void>;
    eventsonce?: record<string, (obj: gameobject, ...args: any[]) => void>;
}

type componententry<t> = { component: component<t>; config?: partial<t> };
export interface gameobject {
    readonly name: string;
    readonly lifetime: number;
    transform: transform;
    image: image | animation<image>;
    mask?: imagemask | animation<imagemask>;
    active: boolean;
    addcomponents<t>(components: componententry<t>[]): void;
    removecomponent(component: string): void;
    getcomponent<t extends component<any>>(component: string): t | undefined;
    getcomponentdata<t extends component<any>>(
        component: string
    ): Required<Parameters<t['init']>[0]> | undefined;
    off(name: string, cb: (obj: gameobject, ...args: any[]) => void): void;
    once(name: string, cb: (obj: gameobject, ...args: any[]) => void): void;
    on(name: string, cb: (obj: gameobject, ...args: any[]) => void): void;
    emitevent(name: string, args: any[]): void;
}

export type font = record<string, imagemask>;
export interface line {
    y: number;
    start: number;
    end: number;
}

export function square(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number | string,
    mask?: imagemask,
    filled?: boolean
) {
    width = flr(width);
    height = flr(height);
    x = flr(x);
    y = flr(y);
    if (height < 1 || width < 1) return;
    if (typeof color === 'string') color = parseInt(color, 32);
    if (!filled) {
        if (mask && (mask.width !== width || mask.height !== height))
            throw new Error(
                'the mask width and height have to be equal to the of the square'
            );
        const image: image = {
            height,
            width,
            buf: new uint8array(width * height),
        };
        const buf = image.buf;
        for (let i = 0; i < buf.length; ++i) buf[i] = 255;
        for (let i = 0; i < width; ++i) buf[i] = color;
        for (let i = 0; i < height - 2; ++i) {
            buf[width * i + width] = color;
            buf[width * i + width * 2 - 1] = color;
        }
        if (height > 1)
            for (let i = 0; i < width; ++i)
                buf[(height - 2) * width + i] = color;

        if (mask) imageutils.applyimagemaskmodifyimage(image, mask);
        imageutils.putimage(x, y, image);
    } else {
        if (mask && (mask.width !== width || mask.height !== height))
            throw new Error(
                'the mask width and height have to be equal to the of the square'
            );
        const image = imageutils.square(width, height, color);
        if (mask) imageutils.applyimagemaskmodifyimage(image, mask);
        imageutils.putimage(x, y, image);
    }
}
export function circle(
    x: number,
    y: number,
    radius: number,
    color: number | string,
    mask?: imagemask
) {
    if (mask && (mask.width !== radius || mask.height !== radius))
        throw new Error(
            'the mask width and height have to be equal to the radius'
        );
    const image = imageutils.circle(radius, color);
    if (mask) imageutils.applyimagemaskmodifyimage(image, mask);
    imageutils.putimage(x, y, image);
}
export function scaleimg(scale: number, image: image): image {
    scale = flr(scale);
    if (scale < 1) return { buf: new uint8array(0), height: 0, width: 0 };
    else if (scale === 1) return image;
    const newimg: image = {
        height: image.height * scale,
        width: image.width * scale,
        buf: new uint8array(image.buf.length * scale ** 2),
    };
    const buf = newimg.buf;

    for (let h = 0; h < image.height; ++h) {
        for (let w = 0; w < image.width; ++w) {
            for (let _w = 0; _w < scale; ++_w) {
                for (let _h = 0; _h < scale; ++_h) {
                    buf[(h * scale + _h) * newimg.width + (w * scale + _w)] =
                        image.buf[h * image.width + w];
                }
            }
        }
    }
    return newimg;
}
export function spr(
    x: number,
    y: number,
    image: image,
    scale?: number,
    dontblend?: boolean
) {
    scale ||= 1;
    if (scale < 1) return;
    scale = flr(scale);

    imageutils[dontblend ? 'putimageraw' : 'putimage'](
        x,
        y,
        scaleimg(scale, image)
    );
}
// TODO: implement
export function del<t>(arr: t[], value: t) {
    if (arr === null || !arr.length) return;
    let firstIndex = arr.indexOf(value);
    if (firstIndex < 0) return;
    firstIndex++;

    const newarr: t[] = [];
    while (arr.length >= firstIndex) {
        const v = arr.pop();
        if (v !== value) newarr.unshift(v as t);
    }
    arr.push(...newarr);
}
export interface error {
    name: string;
    message: string;
    stack?: string;
}
interface errorconstructor {
    new (message?: string): error;
    (message?: string): error;
    readonly prototype: error;
}
export const error: errorconstructor = Error as any;
export function isarr(value: any) {
    return Array.isArray(value);
}
export function font(font?: font | string) {
    if (typeof font !== 'object' && font && !fonts[font])
        throw new error('no font with the name ' + font);

    textutils.clearcharmap();
    textutils.applycharmap(
        !font ? fonts.default : typeof font !== 'object' ? fonts[font] : font
    );
}
export const pal = importExposed('setpalettetranslation') as (
    color1?: number,
    color2?: number
) => void;
export function palt(color: number, transparent: boolean) {
    pal(color, transparent ? 0xff : color);
}
export function camera(x?: number, y?: number) {
    imageutils.setoffset(x || 0, y || 0);
}
export function noop() {}
export function menu(index: number, name?: string, callback?: () => void) {
    if (!name) __menu.removentry(index);
    else
        __menu.setentry(index, {
            name,
            callback: callback || noop,
        });
}
export const cls = imageutils.cls;
export const setp = imageutils.setpixel;
export interface gamefile {
    name: string;

    init?(): void;
    update?(dt: number): void;
    remove?(): void;
    scenes?: scene[];
    defaultScene?: number;
}
export function registergame(game: gamefile) {
    (globalThis as any).__registeredGame = {
        ...game,
        update(dt: number) {
            cursor();
            game.update?.(dt);
        },
    };
}
export function btn(button: button) {
    return buttons[button].down;
}
export function btnp(button: button) {
    return buttons[button].press;
}
export const U: button = 'up';
export const D: button = 'down';
export const L: button = 'left';
export const R: button = 'right';
export function substr(str: string, start: number, end?: number) {
    return str.substring(start, end);
}
export function sub(str: string, start: number, end?: number) {
    return str.substring(start, end);
}
export function tonum(str: string) {
    return number(str);
}
export function split(str: string, seperator?: string) {
    return str.split(seperator === undefined ? ',' : seperator);
}
let cursor_pos: vec2 = { x: 0, y: 0 };
export function cursor(x?: number, y?: number) {
    if (x !== undefined) cursor_pos.x = x;
    if (y !== undefined) cursor_pos.y = y;
    if (x === undefined && y === undefined) {
        cursor_pos.x = 0;
        cursor_pos.y = 0;
    }
}
export const infinity = Infinity;
export function print(
    text: string,
    color?: number,
    background?: number,
    x?: number,
    y?: number,
    spacewidth?: number,
    centered?: boolean
) {
    if (x !== undefined || y !== undefined) cursor(x, y);
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; ++i) {
        const _lines = textutils.writetext(
            lines[i],
            cursor_pos.x,
            cursor_pos.y,
            infinity,
            { color, background, spaceWidth: spacewidth, centered }
        );
        if (lines.length === 1) cursor(_lines[0].end + 1, _lines[0].y);
        else cursor(x !== undefined ? x : 0, cursor_pos.y + 6);
    }
}
export function find<t>(
    arr: arraylike<t>,
    predicate: (el: t, i: number) => boolean
): t | undefined {
    for (let i = 0; i < arr.length; ++i)
        if (predicate(arr[i], i)) return arr[i];
}
export function findindex<t>(
    arr: arraylike<t>,
    predicate: (el: t, i: number) => boolean
): number | undefined {
    for (let i = 0; i < arr.length; ++i) if (predicate(arr[i], i)) return i;
}
export function indexof<t>(arr: arraylike<t>, value: t): number | undefined {
    for (let i = 0; i < arr.length; ++i) if (arr[i] === value) return i;
}
export function includes<t>(arr: arraylike<t>, value: t): boolean {
    for (let i = 0; i < arr.length; ++i) if (arr[i] === value) return true;
    return false;
}
export function reduce<t, k>(
    arr: arraylike<t>,
    cb: (a: k, b: t) => k,
    defaultvalue: k
): k {
    for (let i = 0; i < arr.length; ++i)
        defaultvalue = cb(defaultvalue, arr[i]);
    return defaultvalue;
}
export function filter<t>(
    arr: arraylike<t>,
    predicate: (el: t, index: number, arr: arraylike<t>) => boolean
): t[] {
    const newarr = [];
    for (let i = 0; i < arr.length; ++i)
        if (predicate(arr[i], i, arr)) newarr.push(arr[i]);
    return newarr;
}
export function map<t, k>(
    arr: arraylike<t>,
    predicate: (el: t, index: number, arr: arraylike<t>) => k
): k[] {
    const newarr = [];
    for (let i = 0; i < arr.length; ++i) newarr.push(predicate(arr[i], i, arr));
    return newarr;
}
export function mmap<t, k>(
    arr: arraylikereadable<t>,
    predicate: (el: t, index: number, arr: arraylikereadable<t>) => t
): void {
    for (let i = 0; i < arr.length; ++i) arr[i] = predicate(arr[i], i, arr);
}
export class arraypipe<t> {
    private array: arraylike<t>;
    private steps: {
        type: 'filter' | 'map';
        predicate: (el: t, index: number) => boolean | t;
    }[];

    constructor(
        arr: arraylike<t>,
        steps?: {
            type: 'filter' | 'map';
            predicate: (el: t, index: number) => boolean | t;
        }[]
    ) {
        this.array = arr;
        if (steps) this.steps = steps;
        else this.steps = [];
    }

    map<k>(predicate: (el: t, index: number) => k) {
        this.steps.push({ type: 'map', predicate: predicate as any });
        return this as any as arraypipe<k>;
    }

    filter(predicate: (el: t, index: number) => boolean) {
        this.steps.push({ predicate, type: 'filter' });
        return this;
    }

    execute(): t[] {
        const newarr: t[] = [];

        for (let j = 0; j < this.array.length; ++j) {
            let value: t = this.array[j];
            let pushtoarr = true;
            for (let i = 0; i < this.steps.length; ++i) {
                if (this.steps[i].type === 'map')
                    value = this.steps[i].predicate(value, j) as t;
                else if (this.steps[i].type === 'filter')
                    if (!this.steps[i].predicate(value, j)) {
                        pushtoarr = false;
                        break;
                    }
            }
            if (pushtoarr) newarr.push(value);
        }

        return newarr;
    }
}
export const log = console.log as (...args: any[]) => void;
export const logerr = console.error as (...args: any[]) => void;
export const logwarn = console.warn as (...args: any[]) => void;
export const loginfo = console.info as (...args: any[]) => void;
export function count(value: arraylike<any> | string): number {
    return value.length;
}
export function cursorpos(): vec2 {
    return cursor_pos;
}
export const settimeout: (cb: () => any, ms: number) => number = setTimeout;
export const setinterval: (cb: () => any, ms: number) => number = setInterval;
export const clearinterval: (id: number) => void = clearInterval;
export const cleartimeout: (id: number) => void = clearTimeout;
export function add<t>(arr: t[], ...values: t[]) {
    arr.push(...values);
}
export const now = (Date as any).now as () => number;
export function join(arr: arraylike<any>, seperator?: string) {
    if (typeof seperator !== 'string') seperator = ',';
    let str = '';
    for (let i = 0; i < arr.length; ++i) {
        if (i !== 0) str += seperator;
        str += arr[i];
    }

    return str;
}
export const u = 'u';
export const i = 'i';
export const o = 'o';
export const p = 'p';
export function sleep(ms: number): promise<void> {
    return new promise((r) => settimeout(r, ms));
}
export function type(value: any) {
    if (typeof value === 'object' && value === null) return 'null';
    if (typeof value === 'object' && isarr(value)) return 'array';
    return typeof value;
}
export const line = imageutils.line;
export const getcolorhex = imageutils.getcolor;

interface effect<t> {
    update(dt: number, val: t, effect: effect<t> & { value: t }): void;
    init(val: t, effect: effect<t> & { value: t }): void;
    remove(val: t, effect: effect<t> & { value: t }): void;
    name: string;
}
type effectfunction<t> = effect<t>['update'];

type color = record<'r' | 'g' | 'b' | 'a', number>;
interface renderer<t> {
    update(
        realcolor: color,
        color: number,
        val: t,
        renderer: renderer<t> & { value: t }
    ): color;
    init(val: t, renderer: renderer<t> & { value: t }): void;
    remove(val: t, renderer: renderer<t> & { value: t }): void;
    name: string;
}
type rendererfunction<t> = renderer<t>['update'];

export const createeffect = importExposed('createeffect') as <t>(
    name: string,
    update: effectfunction<t>,
    init?:
        | ((
              val: t,
              effect: effect<t> & {
                  value: t;
              }
          ) => void)
        | undefined,
    remove?:
        | ((
              val: t,
              effect: effect<t> & {
                  value: t;
              }
          ) => void)
        | undefined
) => effect<t>;
export const applyeffect = importExposed('applyeffect') as <t>(
    effect: effect<t>,
    value: t
) => void;
export const removeeffect = importExposed('removeeffect') as (
    effect: effect<any> | string
) => void;
export const createrenderer = importExposed('createrenderer') as <t>(
    name: string,
    update: rendererfunction<t>,
    init?:
        | ((
              val: t,
              effect: renderer<t> & {
                  value: t;
              }
          ) => void)
        | undefined,
    remove?:
        | ((
              val: t,
              effect: renderer<t> & {
                  value: t;
              }
          ) => void)
        | undefined
) => renderer<t>;
export const applyrenderer = importExposed('applyrenderer') as <t>(
    renderer: renderer<t>,
    value: t
) => void;
export const removerenderer = importExposed('removerenderer') as (
    renderer: renderer<any> | string
) => void;

export const effects = importExposed('effects') as {
    screenshake: effect<number>;
    oldcolors: effect<undefined>;
};

export const renderers = importExposed('renderers') as {
    bwcolors: renderer<number>;
};

export interface animationframe<t> {
    time: number;
    value: t;
}
export type animation<t> = animationframe<t>[];
interface animationplayer<t> {
    start(): void;
    play(): void;
    stop(): void;
    recomputemaxlength(): void;
    getframe(): t | undefined;
    setanimations(animation: animation<t>): void;
    callback(cb?: ((frame: t) => void) | undefined): void;
    toggleplay(): void;
    readonly isplaying: boolean;
}
interface animationbuilder<t> {
    addframe(value: t, time: number): animationbuilder<t>;
    build(): animation<t>;
}
export const getanimationframe = importExposed('getanimationframe') as <t>(
    animation: animation<t>,
    timefromstart: number
) => t | undefined;
export const animationplayer = importExposed('animationplayer') as {
    new <t>(animation: animation<t>): animationplayer<t>;
    prototype: animationplayer<any>;
} & fn;
export const animationbuilder = importExposed('animationbuilder') as {
    new <t>(): animationbuilder<t>;
} & fn;
export function vec2(x: number, y: number): vec2 {
    return { x, y };
}
export function vec2i(x: number, y: number): vec2 {
    return { x: flr(x), y: flr(y) };
}
export function vec3(x: number, y: number, z: number): vec3 {
    return { x, y, z };
}
export function vec3i(x: number, y: number, z: number): vec3 {
    return { x: flr(x), y: flr(y), z: flr(z) };
}
export function vec4(x: number, y: number, z: number, w: number): vec4 {
    return { x, y, z, w };
}
export function vec4i(x: number, y: number, z: number, w: number): vec4 {
    return { x: flr(x), y: flr(y), z: flr(z), w: flr(w) };
}
export const getcurrentimage = importExposed('getcurrentimage') as (
    obj: gameobject
) => image;
export const getcurrentimagemask = importExposed('getcurrentimagemask') as (
    obj: gameobject
) => imagemask | undefined;
