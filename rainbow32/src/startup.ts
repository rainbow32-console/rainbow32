import { HEIGHT, WIDTH } from '.';
import { playSound } from './audioUtils';
import { Vec2 } from './gameObject';
import { putImage, setOffset, square } from './imageUtils';
import { writeText } from './text';

const colors = [3, 4, 5, 27, 28, 12, 13, 11, 10, 9, 15, 19, 20];

function writeRainbowText(x: number, text: string, y: number): Vec2 {
    let col = 0;
    const _x = x;
    for (let i = 0; i < text.length; ++i) {
        x =
            writeText(text[i], x, y, WIDTH - _x, {
                color: colors[col % colors.length],
                background: 0,
            })[0].end + 1;
        if (text[i] === '\n') y += 6;
        if (text[i] !== '\n' && text[i] !== ' ') col++;
    }

    return { x, y };
}

export function runStartupAnimation(): Promise<void> {
    putStartupImage();

    playSound(
        { octave: 5, sharp: false, sound: 'c' },
        'square-wave',
        0.2,
        0.1
    ).then(() =>
        playSound(
            { octave: 6, sharp: false, sound: 'c' },
            'square-wave',
            0.2,
            0.2
        )
    );
    return new Promise((r) => setTimeout(r, 320));
}

export function runLoadAnimation(): Promise<void> {
    const y = putStartupImage();
    writeText('loading cartridge...', 3, y, WIDTH - 3, {
        color: 3,
        background: 0,
    });

    return new Promise((r) => setTimeout(r, 200));
}

export async function runErrorAnimation(err?: any): Promise<void> {
    const y = putStartupImage();
    writeText(
        'cartridge crashed! :(\n\n' + ('' + err).toLowerCase(),
        3,
        y,
        WIDTH - 3,
        {
            color: 3,
            background: 0,
        }
    );

    await playSound(
        { octave: 4, sharp: false, sound: 'c' },
        'square-wave',
        0.2,
        0.1
    );
    await playSound(
        { octave: 3, sharp: false, sound: 'c' },
        'square-wave',
        0.2,
        0.2
    );
}

export function pressEnterImageData() {
    const y = putStartupImage();
    writeText('press enter to start!', 3, y, WIDTH - 3, {
        color: 3,
        background: 0,
    });
}

export function putStartupImage(): number {
    setOffset(0, 0);
    putImage(0, 0, square(WIDTH, HEIGHT, 0));
    return writeRainbowText(3, 'rainbow32 v1.0', 3).y + 8;
}
