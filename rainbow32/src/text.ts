import charmap from './charmap';
import {
    applyImageMask,
    ColorPalette,
    ImageMask,
    imgToImageData,
    parseImage,
    parseMask,
    blendImageDataR,
    square,
} from './imageUtils';

export const currentTextMasks = { ...charmap };

export function writeText(
    text: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maxWidth: number,
    {
        background,
        color,
        palette,
        spaceWidth,
    }: {
        palette?: ColorPalette;
        color?: number;
        background?: number;
        spaceWidth?: number;
    } = {}
): { y: number; start: number; end: number }[] {
    spaceWidth ||= 5;
    spaceWidth++;
    const lines: { y: number; start: number; end: number }[] = [];

    color ||= 0;
    let origX = x;
    const images = [
        square(1, 5, color),
        square(2, 5, color),
        square(3, 5, color),
        square(4, 5, color),
        square(5, 5, color),
    ];
    const bg =
        typeof background === 'number'
            ? ([
                  imgToImageData(square(1, 5, background)),
                  imgToImageData(square(2, 5, background)),
                  imgToImageData(square(3, 5, background)),
                  imgToImageData(square(4, 5, background)),
                  imgToImageData(square(5, 5, background)),
              ] as ImageData[])
            : null;
    const bgLine =
        typeof background === 'number'
            ? imgToImageData(square(1, 5, background))
            : null;

    let lineLength = 0;

    for (let i = 0; i < text.length; ++i) {
        if (x > maxWidth || text[i] === '\n') {
            lines.push({
                y,
                start: origX,
                end: origX + lineLength - 1,
            });
            x = origX;
            y += 6;
            if (background && lineLength > 0)
                ctx.putImageData(
                    imgToImageData(
                        square(lineLength, 1, background)
                    ) as ImageData,
                    x,
                    y - 1
                );
            lineLength = 0;
            if (text[i] === '\n') {
                continue;
            }
        }
        if (text[i] === ' ' && bg) {
            ctx.putImageData(
                imgToImageData(square(7, 5, background || 0)) as ImageData,
                x - 1,
                y
            );
        }
        if (text[i] === ' ') {
            lineLength += spaceWidth;
            x += spaceWidth;
            continue;
        }
        const mask = currentTextMasks[text[i].toLowerCase()];
        if (!mask && bg) {
            ctx.putImageData(
                imgToImageData(
                    parseImage('6:5:' + background?.toString(32).repeat(35))
                ) as ImageData,
                x,
                y
            );
        }
        if (!mask) {
            lineLength += 6;
            x += 6;
            console.log('Text: No mask found for "%s"', text[i]);
            continue;
        }
        const data = imgToImageData(
            applyImageMask(images[mask.width - 1], mask),
            palette
        );
        if (data && bg) blendImageDataR(bg[mask.width - 1], data);
        if (data) ctx.putImageData(data, x, y);
        if (bgLine && lineLength > 0) ctx.putImageData(bgLine, x - 1, y);
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
