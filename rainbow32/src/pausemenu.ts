import {
    buttonIds,
    buttons,
    HEIGHT,
    memory,
    resetCart,
    unpause,
    WIDTH,
} from '.';
import { muted, setVolume, toggleMute, volume } from './audioUtils';
import {
    cls,
    getColorTranslations,
    markAsDirty,
    putImage,
    setPaletteTranslation,
    square,
} from './imageUtils';
import { colors } from './namespacedcolors';
import { calculateWidth, writeText } from './text';

interface MenuEntry {
    name: string;
    callback: () => any;
}
let entries: MenuEntry[] = [];

let selected = 0;

function line(start: number, end: number, start1: number, end1: number) {
    const image =
        start === start1
            ? square(1, end1 - end, colors.white)
            : square(start1 - start, 1, colors.white);
    putImage(start, end, image);
}
let old_image_buf: Uint8Array;

export function renderPauseMenu() {
    cls();

    if (buttons.down.press) selected++;
    if (buttons.up.press) selected--;
    if (selected < 0) selected = entries.length + 2;
    selected %= entries.length + 3;
    let str = `${selected === 0 ? '▶' : ' '}continue`;
    for (let i = 0; i < entries.length; ++i) {
        str += '\n';
        if (selected === i + 1) str += '▶';
        else str += ' ';
        str += entries[i]?.name || '';
    }
    str += `\n${selected === entries.length + 1 ? '▶' : ' '}volume: ${
        muted ? '---' : volume
    }%\n${selected === entries.length + 2 ? '▶' : ' '}reset cartridge`;

    let maxWidth = calculateWidth(str) + 3;
    let height = str.split('\n').length * 6 + 3;

    putImage(0, 0, { width: WIDTH, height: HEIGHT, buf: old_image_buf });
    const xl = WIDTH / 2 - maxWidth / 2 - 3;
    const xr = WIDTH / 2 - maxWidth / 2 + maxWidth + 3;
    const yb = HEIGHT / 2 + height / 2;
    const yt = HEIGHT / 2 - height / 2 - 4;
    putImage(xl, yt, square(xr - xl, yb - yt, 0));
    writeText(str, WIDTH / 2 - maxWidth / 2, HEIGHT / 2 - height / 2, WIDTH, {
        background: 0,
    });
    line(xl, yb, xr + 1, yb);
    line(xl, yt, xr, yt);
    line(xl, yt, xl, yb);
    line(xr, yt, xr, yb);
    for (let i = 0; i < buttonIds.length; ++i)
        if (
            buttonIds[i] !== 'up' &&
            buttonIds[i] !== 'down' &&
            buttons[buttonIds[i]].down
        ) {
            if (selected === 0) unpause();
            else if (selected === entries.length + 1) {
                if (buttons.left.down) setVolume(volume - 1);
                if (buttons.right.down) setVolume(volume + 1);
                if (buttons.u.press) toggleMute();
            } else if (selected === entries.length + 2) resetCart();
            else entries[selected - 1]?.callback();
        }
}

export function resetEntries() {
    entries = [];
}
export function setEntry(index: number, entry: MenuEntry | undefined) {
    if (!entry) removeEntry(index);
    else entries[index] = entry;
}
export function removeEntry(index: number) {
    entries = entries.filter((_, i) => i !== index);
}
let lastColorPalette: Record<number, number> = {};
export function resetSelected() {
    selected = 0;
    lastColorPalette = { ...getColorTranslations() };
    setPaletteTranslation();
    old_image_buf = new Uint8Array(memory.length);
    for (let i = 1; i < memory.length; ++i) {
        old_image_buf[i - 1] = memory[i];
    }
}
export function putOldImage() {
    markAsDirty();
    for (const k in lastColorPalette)
        setPaletteTranslation(Number(k), lastColorPalette[k]);
    for (let i = 0; i < old_image_buf.length; ++i) {
        memory[i + 1] = old_image_buf[i];
    }
}
