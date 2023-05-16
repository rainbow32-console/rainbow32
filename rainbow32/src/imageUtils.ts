import { HEIGHT, memory, WIDTH } from './index';
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

export const jokobah32: ColorPalette = [
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

export const defaultPalette: ColorPalette = [
    '#000000',
    '#be4a2f',
    '#d77643',
    '#ead4aa',
    '#e4a672',
    '#b86f50',
    '#733e39',
    '#3e2731',
    '#a22633',
    '#e43b44',
    '#f77622',
    '#feae34',
    '#fee761',
    '#63c74d',
    '#3e8948',
    '#265c42',
    '#193c3e',
    '#124e89',
    '#0099db',
    '#2ce8f5',
    '#ffffff',
    '#c0cbdc',
    '#8b9bb4',
    '#5a6988',
    '#3a4466',
    '#262b44',
    '#ff0044',
    '#68386c',
    '#b55088',
    '#f6757a',
    '#e8b796',
    '#c28569',
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
    if (color === 0xff)
        return {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
        };
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

export function imgToImageData(img: Image): ImageData | null {
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
                const color = getColor(img.buf[h * img.width + w]);
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

let offsetX: number = 0;
let offsetY: number = 0;

export function setOffset(x: number, y: number) {
    offsetX = x;
    offsetY = y;
}

export function putImage(x: number, y: number, image: Image) {
    isDirty = true;
    x = Math.floor(x + offsetX);
    y = Math.floor(y + offsetY);
    for (let h = 0; h < image.height; ++h) {
        if (y + h >= HEIGHT || y + h < 0) continue;
        for (let w = 0; w < image.width; ++w) {
            if (x + w >= WIDTH || x + w < 0) continue;
            const off = (h + y) * WIDTH + x + w;
            const col = getTranslatedColor(image.buf[h * image.width + w]);
            if (col !== 0xff) memory[off + 1] = col;
        }
    }
}

export function setPixel(x: number, y: number, color: number | string) {
    if (typeof color === 'string') color = parseInt(color, 15);
    if (!isValidColor(color)) throw new Error('Color is invalid!');
    x = Math.floor(x + offsetX);
    y = Math.floor(y + offsetY);
    if (x >= WIDTH) return;
    if (y >= HEIGHT) return;
    if (x < 0) return;
    if (y < 0) return;
    isDirty = true;
    memory[y * WIDTH + x + 1] = getTranslatedColor(color);
}

export function putImageRaw(x: number, y: number, image: Image) {
    isDirty = true;
    x = Math.floor(x + offsetX);
    y = Math.floor(y + offsetY);
    for (let h = 0; h < image.height; ++h) {
        if (y + h >= HEIGHT || y + h < 0) continue;
        for (let w = 0; w < image.width; ++w) {
            if (x + w >= WIDTH || x + w < 0) continue;
            const off = (h + y) * WIDTH + x + w;
            memory[off + 1] = getTranslatedColor(
                image.buf[h * image.width + w]
            );
        }
    }
}

export function isValidColor(color: number): boolean {
    return (color > -1 && color < 32) || color === 255;
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
    const halfRadius = Math.floor(radius * 0.5);
    console.log(halfRadius);

    for (let h = 0; h < radius; ++h)
        for (let w = 0; w < radius; ++w) {
            buf[h * radius + w] =
                distance(w, h, halfRadius, halfRadius) <= halfRadius
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

export function cls() {
    for (let i = 0; i < WIDTH * HEIGHT; ++i) memory[i + 1] = 0xff;
}

export function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    col: number
): void {
    isDirty = true;
    x1 += offsetX;
    x2 += offsetX;
    y1 += offsetY;
    y2 += offsetY;
    let sx: number | undefined = undefined,
        sy: number | undefined = undefined,
        dx: number | undefined = undefined,
        dy: number | undefined = undefined;
    if (x1 < x2) {
        sx = 1;
        dx = x2 - x1;
    } else {
        sx = -1;
        dx = x1 - x2;
    }
    if (y1 < y2) {
        sy = 1;
        dy = y2 - y1;
    } else {
        sy = -1;
        dy = y1 - y2;
    }
    let err = dx - dy;
    let e2: number | undefined = undefined;

    while (x1 !== x2 && y1 !== y2) {
        e2 = err * 2;
        if (e2 > -dy) {
            err = err - dy;
            x1 = x1 + sx;
        }
        if (e2 < dx) {
            err = err + dx;
            y1 = y1 + sy;
        }
        if (x1 < 0 || x1 >= WIDTH || y1 < 0 || y1 >= HEIGHT) continue;
        memory[y1 * WIDTH + x1 + 1] = getTranslatedColor(col);
    }
}

const colorTranslations: Record<number, number> = {};

export function setPaletteTranslation(color1?: number, color2?: number) {
    if (!isValidColor(color1 || 0))
        throw new Error('color1 is not a valid color');
    if (!isValidColor(color2 || 0))
        throw new Error('color2 is not a valid color');

    if (color1 === undefined)
        for (const k in colorTranslations) delete colorTranslations[k];
    else colorTranslations[color1] = color2 === undefined ? color1 : color2;
}

function getTranslatedColor(color: number): number {
    if (color in colorTranslations) return colorTranslations[color];
    return color;
}

export function getColorTranslations(): Record<number, number> {
    return colorTranslations;
}
