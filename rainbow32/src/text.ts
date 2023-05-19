import { colors } from './namespacedcolors';
import charmap from './charmap';
import {
    applyImageMask,
    ImageMask,
    isValidColor,
    parseMask,
    putImage,
    putImageRaw,
    square,
} from './imageUtils';

const unknownCharacter = parseMask('4:5:10010110110111111101');

export const currentTextMasks = { ...charmap };

interface Line {
    y: number;
    start: number;
    end: number;
}

export function calculateBounds(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    {
        spaceWidth,
        centered = false,
    }: { spaceWidth?: number; centered?: boolean } = {}
): Line[] {
    text = '' + text;
    const lines: Line[] = [];
    let origX = x;
    spaceWidth ||= 5;

    const maxLength = Math.min(maxWidth - x, calculateWidth(text, spaceWidth));
    const linePadLeft = centered
        ? text
              .split('\n')
              .map((el) =>
                  Math.floor((calculateWidth(el, spaceWidth!) - maxLength) / 2)
              )
        : [];

    spaceWidth++;

    if (linePadLeft[0] && centered) x += linePadLeft[0];
    let line = 0;

    let lineLength = 0;
    let i = 0;
    while (i < text.length) {
        if (text[i] === '\0') break;
        if (text[i] === '\f') {
            ++i;
            const type = text[i];
            ++i;
            if (!type) break;
            let value = '';
            while (i < text.length) {
                if (text[i] === ';') break;
                else value += text[i];
                ++i;
            }
            let number = Number(value);
            if (!isNaN(number) && isFinite(number)) {
                if (type === 'v') y += number;
                else if (type === 'h') x += number;
                else if (type === 'y') y = number;
                else if (type === 'x') x = number;
                else if (type === 's' && number > 0) i += number;
            }
            ++i;
            continue;
        }

        if (x > maxWidth || text[i] === '\n') {
            lines.push({
                y,
                start: origX + (linePadLeft[line] || 0),
                end: origX + (linePadLeft[line] || 0) + lineLength - 1,
            });
            x = origX;
            if (centered && linePadLeft[++line]) x += linePadLeft[line];
            y += 6;
            if (text[i] === '\n') {
                ++i;
                continue;
            }
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            x += spaceWidth;
            ++i;
            continue;
        }
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        lineLength += mask.width + 1;
        x += mask.width + 1;
        ++i;
    }

    lines.push({ y, start: origX, end: origX + lineLength - 1 });
    return lines;
}
export function calculateWidth(text: string, spaceWidth?: number): number {
    text = '' + text;
    let maxLineWidth = 0;
    spaceWidth ||= 5;
    spaceWidth++;
    let x = 0;

    let lineLength = 0;
    let i = 0;
    while (i < text.length) {
        if (text[i] === '\0') break;
        if (text[i] === '\f') {
            ++i;
            const type = text[i];
            ++i;
            if (!type) break;
            let value = '';
            while (i < text.length) {
                if (text[i] === ';') break;
                else value += text[i];
                ++i;
            }
            let number = Number(value);
            if (!isNaN(number) && isFinite(number)) {
                if (type === 'h') lineLength += number;
                else if (type === 'y') {
                    if (lineLength > maxLineWidth) maxLineWidth = lineLength;
                    lineLength = x;
                }
                else if (type === 's' && number > 0) i += number;
            }
            ++i;
            continue;
        }
        if (text[i] === '\n') {
            if (lineLength > maxLineWidth) maxLineWidth = lineLength;
            lineLength = 0;
            ++i;
            continue;
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            ++i;
            continue;
        }
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        lineLength += mask.width + 1;
        ++i;
    }

    if (lineLength > maxLineWidth) return lineLength - 1;
    else return maxLineWidth - 1;
}
export function writeText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    {
        background,
        color,
        spaceWidth,
        centered = false,
    }: {
        color?: number;
        background?: number;
        spaceWidth?: number;
        centered?: boolean;
    } = {}
): Line[] {
    text = '' + text;
    spaceWidth ||= 5;
    const lines: { y: number; start: number; end: number }[] = [];

    const maxLength = Math.min(maxWidth, calculateWidth(text, spaceWidth));
    const linePadLeft = centered
        ? text.split('\n').map((el) => {
              return Math.max(
                  Math.floor((maxLength - calculateWidth(el, spaceWidth!)) / 2),
                  0
              );
          })
        : [];
    if (centered) x = Math.max(0, x - Math.floor(maxLength / 2));
    spaceWidth++;

    let line = 0;
    if (color === undefined) color = colors.white;
    let origX = x;
    if (centered && linePadLeft[0]) x += linePadLeft[0];

    let lineLength = 0;

    let i = 0;
    while (i < text.length) {
        if (text[i] === '\0') break;
        if (text[i] === '\f') {
            ++i;
            const type = text[i];
            ++i;
            if (!type) break;
            let value = '';
            while (i < text.length) {
                if (text[i] === ';') break;
                else value += text[i];
                ++i;
            }
            let number = Number(value);
            if (!isNaN(number) && isFinite(number)) {
                if (type === 'c' && isValidColor(number) && number !== 0xff)
                    color = number;
                else if (type === 'b' && isValidColor(number))
                    background = number === 0xff ? undefined : number;
                else if (type === 'v') y += number;
                else if (type === 'h') x += number;
                else if (type === 'y') y = number;
                else if (type === 'x') x = number;
                else if (type === 's' && number > 0) i += number;
            }
            ++i;
            continue;
        }
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        if (x + mask.width > maxWidth || text[i] === '\n') {
            lines.push({ y, start: origX, end: origX + lineLength - 1 });
            x = origX;
            if (text[i] === '\n' && linePadLeft[++line]) x += linePadLeft[line];
            y += 6;
            if (background && lineLength > 0)
                putImageRaw(x, y - 1, square(lineLength, 1, background));
            lineLength = 0;
            if (text[i] === '\n') {
                ++i;
                continue;
            }
        }
        if (text[i] === ' ' && background !== undefined) {
            putImageRaw(x - 1, y, square(7, 5, background || 0));
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            x += spaceWidth;
            ++i;
            continue;
        }
        const image = applyImageMask(square(mask.width, 5, color), mask);
        if (image && background !== undefined) {
            putImageRaw(x, y, square(mask.width, 5, background));
            putImage(x, y, image);
        } else if (image) putImageRaw(x, y, image);
        if (background !== undefined && lineLength > 0)
            putImageRaw(x - 1, y, square(1, 5, background));
        lineLength += mask.width + 1;
        x += mask.width + 1;
        ++i;
    }

    lines.push({ y, start: origX, end: origX + lineLength - 1 });
    return lines;
}

export function addCharacterMask(character: string, mask: ImageMask) {
    if (mask.width < 1 || mask.width > 5 || mask.height !== 5)
        throw new Error('The mask has to be 5 high and between 1 and 5 long');
    if (character.length !== 1)
        throw new Error('The character has to be 1 long');
    currentTextMasks[character] = mask;
}

export function applyCharacterMap(map: Record<string, ImageMask | string>) {
    const keys = Object.keys(map);
    for (let i = 0; i < keys.length; ++i) {
        let mask = map[keys[i]];
        if (typeof mask === 'string') mask = parseMask(mask);
        currentTextMasks[keys[i]] = mask;
    }
}

export function clearCharacterMap() {
    const keys = Object.keys(currentTextMasks);
    for (let i = 0; i < keys.length; ++i) delete currentTextMasks[keys[i]];
}
