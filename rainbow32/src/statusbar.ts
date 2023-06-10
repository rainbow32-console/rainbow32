import { HEIGHT, WIDTH } from '.';
import { offsetX, offsetY, putImageRaw, setOffset, square } from './imageUtils';
import { writeText } from './text';

let msg = '';
let open = 0;
let lastUpdate = -1;
let lastChange = -1;
let shouldClose = false;

export function displayMessage(message: string) {
    msg = message;
    lastChange = Date.now();
    shouldClose = false;
}

export function resetStatusbar() {
    msg = '';
    open = 0;
    lastChange = -1;
    lastUpdate = -1;
    shouldClose = false;
}

export function updateStatusBar() {
    if (Date.now() - lastUpdate > 100) {
        if (msg.length > 0 && !shouldClose && open < 7) open++;
        else if ((msg.length < 1 || shouldClose) && open > 0) open--;
    }
    if (Date.now() - lastChange > 1500 && open > 0 && !shouldClose)
        shouldClose = true;

    if (open < 1) return;
    const ox = offsetX;
    const oy = offsetY;
    setOffset(0, 0);
    putImageRaw(0, HEIGHT - open, square(WIDTH, 7, 14));
    writeText(msg, 1, HEIGHT + 1 - open, Infinity, {
        background: 14,
        color: 20,
    });
    setOffset(ox, oy);
}
