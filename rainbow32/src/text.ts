import { colors } from './namespacedcolors';
import charmap from './charmap';
import {
    applyImageMask,
    ImageMask,
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
    text = ''+text;
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
    for (let i = 0; i < text.length; ++i) {
        if (x > maxWidth || text[i] === '\n') {
            lines.push({
                y,
                start: origX + (linePadLeft[line] || 0),
                end: origX + (linePadLeft[line] || 0) + lineLength - 1,
            });
            x = origX;
            if (centered && linePadLeft[++line]) x += linePadLeft[line];
            y += 6;
            if (text[i] === '\n') continue;
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            x += spaceWidth;
            continue;
        }
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        if (!mask) {
            lineLength += 6;
            x += 6;
            continue;
        }
        lineLength += mask.width + 1;
        x += mask.width + 1;
    }

    lines.push({ y, start: origX, end: origX + lineLength - 1 });
    return lines;
}
export function calculateWidth(text: string, spaceWidth?: number): number {
    text = ''+text;
    let maxLineWidth = 0;
    spaceWidth ||= 5;
    spaceWidth++;

    let lineLength = 0;
    for (let i = 0; i < text.length; ++i) {
        if (text[i] === '\n') {
            if (lineLength > maxLineWidth) maxLineWidth = lineLength;
            lineLength = 0;
            continue;
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            continue;
        }
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        lineLength += mask.width + 1;
    }

    if (lineLength > maxLineWidth) return lineLength;
    else return maxLineWidth;
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
    text = ''+text;
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
    const images = [
        square(1, 5, color),
        square(2, 5, color),
        square(3, 5, color),
        square(4, 5, color),
        square(5, 5, color),
    ];
    const bg =
        typeof background === 'number'
            ? [
                  square(1, 5, background),
                  square(2, 5, background),
                  square(3, 5, background),
                  square(4, 5, background),
                  square(5, 5, background),
              ]
            : null;
    const bgLine =
        typeof background === 'number' ? square(1, 5, background) : null;

    let lineLength = 0;

    for (let i = 0; i < text.length; ++i) {
        const mask = currentTextMasks[text[i]] || unknownCharacter;
        if (x + mask.width > maxWidth || text[i] === '\n') {
            lines.push({ y, start: origX, end: origX + lineLength - 1 });
            x = origX;
            if (text[i] === '\n' && linePadLeft[++line]) x += linePadLeft[line];
            y += 6;
            if (background && lineLength > 0)
                putImageRaw(x, y - 1, square(lineLength, 1, background));
            lineLength = 0;
            if (text[i] === '\n') continue;
        }
        if (text[i] === ' ' && bg) {
            putImageRaw(x - 1, y, square(7, 5, background || 0));
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            x += spaceWidth;
            continue;
        }
        const image = applyImageMask(images[mask.width - 1], mask);
        if (image && bg) {
            putImageRaw(x, y, bg[mask.width - 1]);
            putImage(x, y, image);
        } else if (image) putImageRaw(x, y, image);
        if (bgLine && lineLength > 0) putImageRaw(x - 1, y, bgLine);
        lineLength += mask.width + 1;
        x += mask.width + 1;
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
