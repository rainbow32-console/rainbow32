import { HEIGHT, memory, WIDTH } from '.';
import { distance } from './math';

export type ColorPalette = [
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

export const defaultPalette: ColorPalette = [
    '#000000',
    '#00021c',
    '#1c284d',
    '#343473',
    '#2d5280',
    '#4d7a99',
    '#7497a6',
    '#a3ccd9',
    '#f0edd8',
    '#732866',
    '#a6216e',
    '#d94c87',
    '#d9214f',
    '#f25565',
    '#f27961',
    '#993649',
    '#b36159',
    '#f09c60',
    '#b38f24',
    '#b3b324',
    '#f7c93e',
    '#17735f',
    '#119955',
    '#67b31b',
    '#1ba683',
    '#47cca9',
    '#96e3c9',
    '#2469b3',
    '#0b8be6',
    '#0bafe6',
    '#f28d85',
    '#f0bb90',
];

export interface Image {
    width: number;
    height: number;
    buf: Uint8Array;
}

let currentPalette = defaultPalette;
export let parsedPalette: Record<'r' | 'g' | 'b' | 'a', number>[] = [];

for (let i = 0; i < currentPalette.length; ++i)
    parsedPalette[i] = getColor$(i, currentPalette);

export function getCurrentPalette(): ColorPalette {
    return currentPalette;
}

export function setCurrentPalette(palette: ColorPalette) {
    currentPalette = palette;
    parsedPalette = [];
    for (let i = 0; i < currentPalette.length; ++i)
        parsedPalette[i] = getColor$(i, currentPalette);
}

export function getColor(color: number): Record<'r' | 'g' | 'b' | 'a', number> {
    return parsedPalette[color];
}

export function parseImage(image: string): Image {
    let wStr: string = '';
    let hStr: string = '';
    let hasWidth = false;
    let offset = 0;

    while (true) {
        const char = image[offset++];
        if (!char) throw new Error('Could not get width or height!');
        else if (char === ':')
            if (hasWidth) break;
            else hasWidth = true;
        else if (hasWidth) hStr += char;
        else wStr += char;
    }

    const width = Math.floor(Number(wStr));
    const height = Math.floor(Number(hStr));

    if (isNaN(width) || isNaN(height) || !isFinite(width) || !isFinite(height))
        throw new Error('width or height is not a number or infinite');

    const arrBuf = new Uint8Array(width * height);

    for (let h = 0; h < height; h++)
        for (let w = 0; w < width; w++) {
            if (image[offset] === ' ') arrBuf[h * width + w] = 0xff;
            else arrBuf[h * width + w] = parseInt(image[offset], 32);
            offset++;
        }

    return {
        buf: arrBuf,
        height,
        width,
    };
}

function getColor$(
    color: number,
    palette?: ColorPalette
): Record<'r' | 'g' | 'b' | 'a', number> {
    palette ||= currentPalette;
    let col = palette[color];
    if (!col)
        throw new Error(
            'The color has to be in the range of 0-31. Supplied ' + color
        );

    if (col.startsWith('#')) col = col.substring(1);
    let r_str = col[0] + col[1];
    let g_str = col[2] + col[3];
    let b_str = col[4] + col[5];
    let a_str = col[6] + col[7];
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0xff;
    try {
        const col = parseInt(r_str, 16);
        if (!isNaN(col) && col > -1 && col < 256) r = col;
    } catch {}
    try {
        const col = parseInt(g_str, 16);
        if (!isNaN(col) && col > -1 && col < 256) g = col;
    } catch {}
    try {
        const col = parseInt(b_str, 16);
        if (!isNaN(col) && col > -1 && col < 256) b = col;
    } catch {}
    try {
        const col = parseInt(a_str, 16);
        if (!isNaN(col) && col > -1 && col < 256) a ||= col;
    } catch {}
    return { r, g, b, a };
}

function imgToImageData(img: Image, palette?: ColorPalette): ImageData | null {
    if (img.width < 1 || img.height < 1) return null;
    const buf = new Uint8ClampedArray(img.width * img.height * 4);

    for (let h = 0; h < img.height; ++h)
        for (let w = 0; w < img.width; ++w) {
            if (img.buf[h * img.width + w] === 0xff) {
                const offset = (h * img.width + w) * 4;
                buf[offset] = 0;
                buf[offset + 1] = 0;
                buf[offset + 2] = 0;
                buf[offset + 3] = 0;
            } else {
                const color = getColor$(img.buf[h * img.width + w], palette);
                const offset = (h * img.width + w) * 4;
                buf[offset] = color.r;
                buf[offset + 1] = color.g;
                buf[offset + 2] = color.b;
                buf[offset + 3] = color.a;
            }
        }

    return new ImageData(buf, img.width, img.height);
}

export interface ImageMask {
    width: number;
    height: number;
    buf: Uint8Array;
}

export function parseMask(content: string): ImageMask {
    let width_str = '';
    let height_str = '';
    let hasWidth = false;
    let offset = 0;
    while (true) {
        if (!content[offset]) throw new Error('Could not get width or height!');
        else if (content[offset] === ':' && hasWidth) break;
        else if (content[offset] === ':') hasWidth = true;
        else if (hasWidth) height_str += content[offset];
        else width_str += content[offset];
        offset++;
    }
    offset++;

    const width = Math.floor(Number(width_str));
    const height = Math.floor(Number(height_str));

    if (isNaN(width) || isNaN(height) || !isFinite(width) || !isFinite(height))
        throw new Error('Height or width is not a number or not finite');

    const buf: Uint8Array = new Uint8Array(Math.ceil((width * height) / 8));

    for (let h = 0; h < height; ++h)
        for (let w = 0; w < width; ++w) {
            buf[Math.floor((h * width + w) / 8)] |=
                (content[offset++] === ' ' || content[offset - 1] === '0'
                    ? 0
                    : 1) <<
                (h * width + w) % 8;
        }

    return {
        buf,
        height,
        width,
    };
}

export function applyImageMask(image: Image, mask: ImageMask): Image {
    if (image.width !== mask.width || image.height !== mask.height)
        throw new Error('Width and height dont match!');

    const img: Image = {
        buf: new Uint8Array(image.buf.length),
        height: image.height,
        width: image.width,
    };

    for (let h = 0; h < image.height; ++h)
        for (let w = 0; w < image.width; ++w) {
            const offset = h * image.width + w;
            if ((mask.buf[Math.floor(offset / 8)] >> offset % 8) & 1)
                img.buf[offset] = image.buf[offset];
            else img.buf[offset] = 0xff;
        }

    return img;
}

export function applyImageMaskModifyImage(image: Image, mask: ImageMask) {
    if (image.width !== mask.width || image.height !== mask.height)
        throw new Error('Width and height dont match!');

    for (let h = 0; h < image.height; ++h)
        for (let w = 0; w < image.width; ++w) {
            const offset = h * image.width + w;
            if (!((mask.buf[Math.floor(offset / 8)] >> offset % 8) & 1))
                image.buf[offset] = 0xff;
        }
}

export function stringifyImage(img: Image) {
    let str = `${img.width}:${img.height}:`;

    for (let i = 0; i < img.buf.length; ++i)
        str += img.buf[i] === 0xff ? ' ' : img.buf[i].toString(32);

    return str;
}

export function stringifyMask(mask: ImageMask) {
    let str = `${mask.width}:${mask.height}:`;

    for (let h = 0; h < mask.height; ++h)
        for (let w = 0; w < mask.width; ++w) {
            const offset = h * mask.width + w;
            str += (mask.buf[Math.floor(offset / 8)] >> offset % 8) & 1;
        }

    return str;
}

export function imgToPng(
    image: Image,
    type?: 'image/png' | 'image/jpeg' | 'image/webp'
) {
    if (image.width < 1 || image.height < 1) throw new Error('Image is 0x0');

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas
        .getContext('2d', { willReadFrequently: true })
        ?.putImageData(imgToImageData(image) as ImageData, 0, 0);
    return canvas.toDataURL(type || 'image/png');
}

export function putImage(x: number, y: number, image: Image) {
    isDirty = true;
    x = Math.floor(x);
    y = Math.floor(y);
    for (let h = 0; h < image.height; ++h) {
        for (let w = 0; w < image.width; ++w) {
            const off = (h + y) * WIDTH + x + w;
            if (off >= WIDTH * HEIGHT) continue;
            if (image.buf[h * image.width + w] === 0xff) continue;
            memory[off + 1] = image.buf[h * image.width + w];
        }
    }
}

export function putImageRaw(x: number, y: number, image: Image) {
    isDirty = true;
    x = Math.floor(x);
    y = Math.floor(y);
    for (let h = 0; h < image.height; ++h) {
        for (let w = 0; w < image.width; ++w) {
            const off = (h + y) * WIDTH + x + w;
            if (off >= WIDTH * HEIGHT) continue;
            memory[off + 1] = image.buf[h * image.width + w];
        }
    }
}

export function isValidColor(color: number): boolean {
    return color > -1 && color < 32;
}

export function square(
    width: number,
    height: number,
    color: number | string
): Image {
    if (typeof color === 'string') color = parseInt(color, 32);
    if (!isValidColor(color)) throw new Error('That color is invalid!');
    const arr = new Uint8Array(width * height);
    for (let i = 0; i < arr.length; ++i) arr[i] = color;
    return {
        width,
        height,
        buf: arr,
    };
}

export function circle(radius: number, color: number | string): Image {
    if (radius < 1) throw new Error('Radius is less than 1');
    if (typeof color === 'string') color = parseInt(color, 32);
    if (!isValidColor(color)) throw new Error('That color is invalid!');

    const buf = new Uint8Array(radius * radius);
    const halfRadius = radius * 0.5;

    for (let h = 0; h < radius; ++h)
        for (let w = 0; w < radius; ++w) {
            buf[h * radius + w] =
                distance(h - (halfRadius - 0.5), w - (halfRadius - 0.5)) <=
                halfRadius + 1
                    ? color
                    : 0xff;
        }

    return {
        buf,
        height: radius,
        width: radius,
    };
}

export function serializeImage(img: Image): Uint8Array {
    const arr = new Uint8Array(8 + img.width * img.height);
    const u32 = new Uint32Array(arr.buffer);
    u32[0] = img.width;
    u32[1] = img.height;
    for (let h = 0; h < img.height; ++h)
        for (let w = 0; w < img.width; ++w)
            arr[h * img.width + w + 8] = img.buf[h * img.width + w];
    return arr;
}
export function unserializeImage(arr: Uint8Array): Image {
    const buf = new Uint8Array(arr.length - 8);
    const img: Image = {
        height: 0,
        width: 0,
        buf,
    };
    const u32 = new Uint32Array(arr.buffer);
    img.width = u32[0];
    img.width = u32[1];

    for (let h = 0; h < img.height; ++h)
        for (let w = 0; w < img.width; ++w)
            buf[h * img.width + w] = img.buf[h * img.width + w + 8];
    return img;
}

export let isDirty = false;
export function removeDirtyMark() {
    isDirty = false;
}
export function markAsDirty() {
    isDirty = true;
}
