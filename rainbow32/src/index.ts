import { isInApp, electronAPI } from './electron';
import {
    contextState,
    loadMusic,
    playSound,
    recreateContext,
    toggleMute,
    unloadMusic,
} from './audioUtils';
import {
    clearAllEffectsAndRenderer,
    getPixel,
    updateEffect as updateEffects,
} from './effects';
import { canvasFullScreen, show } from './electron';
import { exposeToWorld } from './expose';
import _default from './fonts/default';
import {
    cls,
    ColorPalette,
    defaultPalette,
    getColor,
    isDirty,
    removeDirtyMark,
    setCurrentPalette,
    setOffset,
    setPaletteTranslation,
} from './imageUtils';
import { removeParticles, updateParticles } from './particleSystem';
import {
    putOldImage,
    renderPauseMenu,
    resetEntries,
    resetSelected,
} from './pausemenu';
import { Scene, SceneManager } from './SceneManager';
import {
    putStartupImage,
    runErrorAnimation,
    runStartupAnimation,
} from './startup';
import { applyCharacterMap, clearCharacterMap } from './text';
import { download } from './utils';
import { displayMessage, resetStatusbar, updateStatusBar } from './statusbar';

export type Button = 'up' | 'down' | 'left' | 'right' | 'u' | 'i' | 'o' | 'p';
export const buttonIds: Readonly<Button[]> = [
    'up',
    'down',
    'left',
    'right',
    'u',
    'i',
    'o',
    'p',
];

export const WIDTH = 200;
export const HEIGHT = 180;
/**
 * Memory Layout (bytes):
 * 0x0-0x1: buttons
 * 0x1-0x8ca1: screen
 */
export const memory: Uint8Array = new Uint8Array(1 + WIDTH * HEIGHT);
export function isPressed(button: Button): boolean {
    const id = buttonIds.indexOf(button);
    if (id === -1) return false;

    return (memory[0] >> id) & 0x1 ? true : false;
}

export function changeButtonState(value: boolean, button: Button) {
    if (!frame || !frame.isConnected) return;
    const buttonId = buttonIds.indexOf(button);
    if (buttonId < 0) return;
    memory[0] &= 0xff ^ (1 << buttonId);
    memory[0] |= (value ? 1 : 0) << buttonId;

    if (buttonElements[button])
        buttonElements[button].style.backgroundColor = value
            ? '#15803d'
            : '#171717';
}

export let isCollectingDebugData = false;
export function setDbgDataCollection(value: boolean) {
    isCollectingDebugData = value;
}

export const buttons: Record<Button, { down: boolean; press: boolean }> = {
    down: {
        get down() {
            return !!((memory[0] >> 1) & 1);
        },
        press: false,
    },
    up: {
        get down() {
            return !!(memory[0] & 1);
        },
        press: false,
    },
    left: {
        get down() {
            return !!((memory[0] >> 2) & 1);
        },
        press: false,
    },
    right: {
        get down() {
            return !!((memory[0] >> 3) & 1);
        },
        press: false,
    },
    u: {
        get down() {
            return !!((memory[0] >> 4) & 1);
        },
        press: false,
    },
    i: {
        get down() {
            return !!((memory[0] >> 5) & 1);
        },
        press: false,
    },
    o: {
        get down() {
            return !!((memory[0] >> 6) & 1);
        },
        press: false,
    },
    p: {
        get down() {
            return !!((memory[0] >> 7) & 1);
        },
        press: false,
    },
};

export interface GameFile {
    name: string;
    palette?: ColorPalette;

    init?(): void;
    update?(dt: number): void;
    remove?(): void;
    scenes?: Scene<any>[];
    defaultScene?: number;
}

const buttonElements: Record<Button | 'start' | 'stop', HTMLDivElement> =
    {} as any;

window.addEventListener('keydown', (ev) => {
    if (!frame || !frame.isConnected) return;
    // wasd
    if (ev.key === 'w') changeButtonState(true, 'up');
    else if (ev.key === 'a') changeButtonState(true, 'left');
    else if (ev.key === 's') changeButtonState(true, 'down');
    else if (ev.key === 'd') changeButtonState(true, 'right');
    // arrows keys
    else if (ev.key === 'ArrowUp') changeButtonState(true, 'up');
    else if (ev.key === 'ArrowLeft') changeButtonState(true, 'left');
    else if (ev.key === 'ArrowDown') changeButtonState(true, 'down');
    else if (ev.key === 'ArrowRight') changeButtonState(true, 'right');
    // action keys
    else if (ev.key === 'u') changeButtonState(true, 'u');
    else if (ev.key === 'i') changeButtonState(true, 'i');
    else if (ev.key === 'o') changeButtonState(true, 'o');
    else if (ev.key === 'p') changeButtonState(true, 'p');
    // start and reset
    else if (ev.key === 'Escape') {
        stopGame();
        if (canvasFullScreen()) return;
        buttonElements.stop?.classList.add('active');
        setTimeout(() => buttonElements.stop?.classList.remove('active'), 100);
    } else if (ev.key === 'Enter') {
        startGame();
        if (canvasFullScreen()) return;
        buttonElements.start?.classList.add('active');
        setTimeout(() => buttonElements.start?.classList.remove('active'), 100);
    } else if (ev.key === 'F10') {
        ev.preventDefault();
        console.log(
            '%c[Rainbow32]',
            'font-weight: bold; color: #1e40af;',
            'Debug Data Printout'
        );
        for (const [k, v] of Object.entries(debugData))
            console.log('%c%s:', 'font-weight: bold;', k, v);
        console.log('%cRender times', 'font-weight: bold');
        const _renderTimes: Record<number, number> = {};
        for (const t of renderTimes) {
            _renderTimes[t] ||= 0;
            _renderTimes[t]++;
        }
        for (const [k, v] of Object.entries(_renderTimes))
            console.log('%dms: %d', k, v);
        console.log('JSON:', { ...debugData, renderTimes });
        displayMessage('dumped debug log');
    } else if (ev.key === 'F3') {
        if (isInApp()) electronAPI?.loadProgram('sdk');
    }
});
window.addEventListener('keyup', (ev) => {
    if (!frame || !frame.isConnected) return;
    // wasd
    if (ev.key === 'w') changeButtonState(false, 'up');
    else if (ev.key === 'a') changeButtonState(false, 'left');
    else if (ev.key === 's') changeButtonState(false, 'down');
    else if (ev.key === 'd') changeButtonState(false, 'right');
    // arrows keys
    else if (ev.key === 'ArrowUp') changeButtonState(false, 'up');
    else if (ev.key === 'ArrowLeft') changeButtonState(false, 'left');
    else if (ev.key === 'ArrowDown') changeButtonState(false, 'down');
    else if (ev.key === 'ArrowRight') changeButtonState(false, 'right');
    // action keys
    else if (ev.key === 'u') changeButtonState(false, 'u');
    else if (ev.key === 'i') changeButtonState(false, 'i');
    else if (ev.key === 'o') changeButtonState(false, 'o');
    else if (ev.key === 'p') changeButtonState(false, 'p');
});

let ctx: CanvasRenderingContext2D | null = null;

let previous = Date.now();

let pressedButtonsPreviously = new Uint8Array([0]);

let unfocused = false;

const renderTimes: number[] = [];
let oldPaused = false;

let lastDt = 0;
export function renderParticles() {
    updateParticles(lastDt);
}

let renderFn = () => {};

function render(dt: number) {
    if (Math.abs(dt - previous) < 1) return;
    try {
        const start = Date.now();
        if (unfocused || !frame || !frame.isConnected || !done) {
            unfocused = false;
            return;
        }

        callEvent('beforeRender', [ctx, dt - previous]);

        if (isCollectingDebugData) debugData['Update State'] = 'Buttons';
        for (let i = 0; i < buttonIds.length; i++)
            buttons[buttonIds[i]].press =
                (memory[0] >> i) & 1 &&
                !((pressedButtonsPreviously[0] >> i) & 1)
                    ? true
                    : false;

        if (oldPaused !== paused && paused) resetSelected();
        if (oldPaused !== paused && !paused) putOldImage();
        oldPaused = paused;
        if (ctx) {
            if (!paused && currentGame) {
                lastDt = dt - previous;
                if (isCollectingDebugData) debugData['Update State'] = 'Global';
                updateEffects(dt);
                currentGame.update?.(lastDt);
                if (isCollectingDebugData)
                    debugData['Update State'] = 'Particles';
                SceneManager.update(lastDt);
            }
            renderFn();
            if (paused) renderPauseMenu();
            updateStatusBar();
            if (isCollectingDebugData) debugData['Update State'] = 'Screen';
            const buf = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
            if (isDirty) {
                ctx.clearRect(0, 0, WIDTH, HEIGHT);
                for (let h = 0; h < HEIGHT; ++h)
                    for (let w = 0; w < WIDTH; ++w) {
                        const color =
                            !paused && currentGame
                                ? getPixel(memory[h * WIDTH + w + 1], {
                                      x: w,
                                      y: h,
                                  })
                                : getColor(memory[h * WIDTH + w + 1]);
                        const offset = (h * WIDTH + w) * 4;
                        buf[offset] = color.r;
                        buf[offset + 1] = color.g;
                        buf[offset + 2] = color.b;
                        buf[offset + 3] = color.a;
                    }

                ctx.putImageData(new ImageData(buf, WIDTH, HEIGHT), 0, 0);
            }
            removeDirtyMark();
        }

        previous = dt;
        pressedButtonsPreviously[0] = memory[0];
        renderTimes.push(Date.now() - start);
        if (Date.now() - start > 30) {
            console.warn('[Violation] Screen Update took over 30 milliseconds');
            displayMessage('warn: lagging!');
        }
        callEvent('afterRender', [ctx, dt - previous]);

        if (isCollectingDebugData) {
            debugData['Update State'] = 'Idle';
            debugData['Render (ms)'] = Date.now() - start + 'ms';
            debugData['Buttons Down'] = '';
            debugData['Buttons Pressed'] = '';
            for (let i = 0; i < buttonIds.length; ++i) {
                if (buttons[buttonIds[i]].press)
                    debugData['Buttons Pressed'] += buttonIds[i] + ' ';
                if (buttons[buttonIds[i]].down)
                    debugData['Buttons Down'] += buttonIds[i] + ' ';
            }
            debugData['Buttons Down'] ||= 'None';
            debugData['Buttons Pressed'] ||= 'None';
            debugData['Mean Update Time'] =
                (
                    renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
                ).toFixed(2) + 'ms';
            debugData['Worst Update Time'] =
                renderTimes.reduce((a, b) => (a > b ? a : b), 0) + 'ms';
        }
    } catch (e: any) {
        stopGame();
        runErrorAnimation();
        console.error('Failed to render frame!\n╰─> %s', e?.stack || e);
    }
    requestAnimationFrame(render);
}

let frame: HTMLElement | null = null;

export function makeBtn(key: Button): HTMLDivElement {
    const div = document.createElement('div');
    div.dataset.type = key;
    div.style.width = '2.5rem';
    div.style.height = '2.5rem';
    div.style.backgroundColor = '#171717';
    div.style.margin = '3px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.userSelect = 'none';
    div.style.cursor = 'pointer';
    div.style.fontFamily = 'sans-serif';
    div.style.fontWeight = 'bold';
    div.classList.add('__rainbow32_button', '__rainbow32_button_' + key);
    div.textContent =
        key === 'down'
            ? '↓'
            : key === 'left' || key === 'up' || key === 'right'
            ? '↑'
            : key;
    if (key === 'left') div.style.transform = 'rotateZ(-90deg)';
    else if (key === 'right') div.style.transform = 'rotateZ(90deg)';
    return div;
}

export function makeTextBtn(text: string): HTMLDivElement {
    const div = document.createElement('div');
    div.dataset.textContent = text.toLowerCase();
    div.style.minWidth = '3rem';
    div.style.height = '25px';
    div.style.backgroundColor = '#171717';
    div.style.padding = '0px .5rem';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.userSelect = 'none';
    div.style.cursor = 'pointer';
    div.style.fontFamily = 'sans-serif';
    div.style.fontWeight = 'bold';
    div.classList.add('__rainbow32_textbutton');

    return div;
}

let done = false;
let onUnload: (() => void)[] = [];

export let debugData: Record<string, string> = {
    'Game State': 'Uninitialized',
    'Render (ms)': '-1ms',
    'Buttons Down': 'None',
    'Buttons Pressed': 'None',
    'Game Name': '',
};
export function getDebugString(): string {
    let str = '';
    const keys = Object.keys(debugData);
    for (let i = 0; i < keys.length; ++i)
        if (debugData[keys[i]].length > 0)
            str += `${keys[i]}: ${debugData[keys[i]]}\n`;
    return str.toLowerCase();
}

export async function unload() {
    unfocused = true;
    unloadMusic();
    await stopGame();
    for (const fn of onUnload) fn();
    onUnload = [];
    for (const btn of buttonIds) (buttonElements[btn] as any) = undefined;
    (buttonElements.start as any) = undefined;
    (buttonElements.stop as any) = undefined;
    frame = null;

    currentGame = null;
    done = false;
    if (!isCollectingDebugData) return;
    debugData['Game State'] = 'Uninitialized';
}

export interface Rainbow32ConsoleElementGeneratorOptions {
    canvas: {
        height: string;
        width: string;
        aspectRatio: string;
        bgCol: 'var(--bg-col)';
        zIndex: number;
    };
    classes: {
        canvas: string;
        fileInput: string;
        buttons: Record<Button | 'start' | 'stop', string>;
        button: string;
        textButton: string;
    };
    withControls: boolean;
    frame: HTMLElement;
}

export interface Rainbow32ConsoleElements {
    canvas: HTMLCanvasElement;
    fileInput: HTMLInputElement;
    buttons: Record<Button | 'start' | 'stop', HTMLDivElement>;
}

export type Rainbow32ConsoleElementGenerator = (
    opts: Rainbow32ConsoleElementGeneratorOptions
) => Rainbow32ConsoleElements;

let paused: boolean;

function startRender(dt: number) {
    if (unfocused) return (unfocused = false);
    previous = dt - 16;
    render(dt);
}

export function isLoaded() {
    return done && frame && frame.isConnected;
}

export function getCurrentImage() {
    return ctx?.canvas.toDataURL();
}

export async function onLoad(
    element?: HTMLElement,
    withControls?: boolean,
    generator?: Rainbow32ConsoleElementGenerator
) {
    exposeToWorld();
    if (done)
        throw new Error(
            'onLoad(...) was already called! call unload(...) first!'
        );
    done = true;
    paused = false;
    if (!element) element = document.body;
    if (withControls === undefined) withControls = true;
    if (canvasFullScreen()) withControls = false;
    if (frame) frame.remove();
    frame = element;

    const generated = generator?.(
        defaultElGenProps(frame, canvasFullScreen() || !withControls)
    );

    const canvas = generated?.canvas
        ? generated.canvas
        : document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 180;
    if (!canvas.isConnected) element.append(canvas);
    if (!generated?.canvas) {
        if (canvasFullScreen() || !withControls) canvas.style.height = '100%';
        else canvas.style.height = '50%';
        canvas.style.margin = '0 auto';
        canvas.style.aspectRatio = '200/180';
        canvas.style.width = 'auto';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.backgroundColor = 'var(--bg-col)';
        canvas.style.zIndex = '10';
    }
    canvas.setAttribute(
        'style',
        '--bg-col: ' + defaultPalette[0] + ';' + canvas.getAttribute('style')
    );

    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return console.error('Error: Could not initialize 2d context');
    ctx.imageSmoothingEnabled = false;

    if (contextState() !== 'running') recreateContext();
    requestAnimationFrame(startRender);
    const p = runStartupAnimation();

    resetStatusbar();
    onUnload.push(resetStatusbar);

    function keyDown(ev: KeyboardEvent) {
        if (!frame || !frame.isConnected) return;
        if (ev.key === 'F2') {
            ev.preventDefault();
            const now = new Date();
            download(
                canvas.toDataURL(),
                `screenshot-${now.getFullYear()}-${now.getMonth()}-${
                    now.getDay() + 1
                }-${now.getHours()}-${now.getSeconds()}-${now.getMilliseconds()}.png`
            );
            displayMessage('screenshot saved');
        } else if (ev.key === ' ') paused = !paused;
        else if (ev.key === 'm' && ev.ctrlKey) toggleMute();
    }
    window.addEventListener('keydown', keyDown);

    function loseFocus() {
        if (!done) return;
        unfocused = true;
    }
    function gainFocus() {
        if (!done) return;
        requestAnimationFrame(startRender);
    }

    window.addEventListener('blur', loseFocus);
    window.addEventListener('focus', gainFocus);
    onUnload.push(() => {
        window.removeEventListener('keydown', keyDown);
        window.removeEventListener('blur', loseFocus);
        window.removeEventListener('focus', gainFocus);
    });

    if (canvasFullScreen() || !withControls) {
        const tmpEl = document.createElement('div');
        for (const btn of buttonIds) {
            buttonElements[btn] = tmpEl;
            generated?.buttons?.[btn]?.remove();
        }
        buttonElements.start = tmpEl;
        buttonElements.stop = tmpEl;
    } else {
        for (const btn of buttonIds) {
            const btnEl = generated?.buttons?.[btn]
                ? generated.buttons[btn]
                : makeBtn(btn);
            btnEl.dataset.type = btn;
            buttonElements[btn] = btnEl;
            if (!btnEl.isConnected) element.append(btnEl);
            function down(ev: Event) {
                changeButtonState(true, btn);
                ev.preventDefault();
            }
            function up() {
                changeButtonState(false, btn);
            }
            function pointerOver(ev: PointerEvent) {
                if (ev.pressure > 0) {
                    changeButtonState(true, btn);
                    ev.preventDefault();
                }
            }

            btnEl.addEventListener('pointerdown', down);
            btnEl.addEventListener('contextmenu', down);
            btnEl.addEventListener('pointerover', pointerOver);
            btnEl.addEventListener('pointerenter', pointerOver);
            btnEl.addEventListener('pointerup', up);
            btnEl.addEventListener('pointerleave', up);
            btnEl.addEventListener('pointerout', up);
            btnEl.addEventListener('pointercancel', up);

            onUnload.push(() => {
                btnEl.addEventListener('pointerdown', down);
                btnEl.addEventListener('contextmenu', down);
                btnEl.addEventListener('pointerover', pointerOver);
                btnEl.addEventListener('pointerenter', pointerOver);
                btnEl.addEventListener('pointerup', up);
                btnEl.addEventListener('pointerleave', up);
                btnEl.addEventListener('pointerout', up);
                btnEl.addEventListener('pointercancel', up);
            });
        }
    }

    if (!canvasFullScreen() && withControls) {
        const input = generated?.fileInput
            ? generated.fileInput
            : document.createElement('input');
        if (generated?.fileInput) {
            input.type = 'file';
            input.name = 'game-file';
            input.id = '__rainbow32_gamefile';
            input.classList.add('__rainbow32_gamefile');
            input.style.display = 'none';
        }
        input.addEventListener('change', loadFromEvent as any);

        const start = generated?.buttons?.start
            ? generated.buttons.start
            : makeTextBtn('start');
        const reset = generated?.buttons?.stop
            ? generated.buttons.stop
            : makeTextBtn('reset');

        if (!generated?.buttons?.start)
            start.classList.add('__rainbow32_button_start');
        if (!generated?.buttons?.stop)
            start.classList.add('__rainbow32_button_stop');

        if (!input.isConnected) element.append(input);
        if (!start.isConnected) element.append(start);
        if (!reset.isConnected) element.append(reset);

        start.addEventListener('click', startGame);
        reset.addEventListener('click', () => stopGame());

        onUnload.push(() => {
            input.removeEventListener('change', loadFromEvent as any);
            start.removeEventListener('click', startGame);
            reset.removeEventListener('click', () => stopGame());
        });
    } else {
        generated?.buttons?.start?.remove();
        generated?.buttons?.stop?.remove();
    }
    if (isCollectingDebugData) debugData['Game State'] = 'Idle';

    onUnload.push(unpause);
    return Promise.allSettled([p]);
}

let currentGame: GameFile | null = null;

const events: Record<string, ((...args: any[]) => void)[]> = {};

export function registerEvent(
    ev: 'afterLoad',
    handler: (game: GameFile) => void
): () => void;
export function registerEvent(ev: 'afterStop', handler: () => void): () => void;
export function registerEvent(
    ev: 'beforeRender',
    handler: (ctx: CanvasRenderingContext2D, dt: number) => void
): () => void;
export function registerEvent(
    ev: 'afterRender',
    handler: (ctx: CanvasRenderingContext2D, dt: number) => void
): () => void;

export function registerEvent(
    ev: string,
    handler: (...args: any[]) => void
): () => void {
    events[ev] ||= [];
    events[ev].push(handler);
    return () => (events[ev] = events[ev].filter((el) => el !== handler));
}

function callEvent(event: string, args: any[]) {
    if (!events[event]) return;
    for (let i = 0; i < events[event].length; ++i) {
        try {
            events[event][i](...args);
        } catch (e) {
            console.error(
                'A evenhandler for ' + event + ' threw an error!\n╰─> %s',
                e
            );
        }
    }
}

export async function loadGame(game: GameFile) {
    if (!ctx) return;
    setOffset(0, 0);
    try {
        renderFn = () => {};
        resetEntries();
        await loadMusic();
        if (isCollectingDebugData) {
            debugData['Game State'] = 'Running';
            debugData['Game Name'] = game.name;
        }
        if (!frame || !frame.isConnected) return;
        cls();
        unpause();
        currentGame = game;
        if (game.palette) setCurrentPalette(game.palette);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        clearAllEffectsAndRenderer();
        setPaletteTranslation();
        clearCharacterMap();
        applyCharacterMap(_default);
        setCurrentPalette(defaultPalette);
        game?.init?.();
        if (game.scenes) SceneManager.setscenes(game.scenes, game.defaultScene);
        callEvent('afterLoad', [game]);
    } catch (e: any) {
        stopGame(true);
        console.error('Could not load Game!\n╰─> %s', e?.stack || e);
        (async () => {
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
        })();
        renderFn = () => runErrorAnimation(e);
    }
}

export function stopGame(noani?: boolean): Promise<void> {
    removeParticles();
    if (isCollectingDebugData) {
        debugData['Game State'] = 'Idle';
        debugData['Game Name'] = '';
    }
    if (!currentGame) return new Promise((res) => res());
    const _game = currentGame;
    clearAllEffectsAndRenderer();
    setPaletteTranslation();
    clearCharacterMap();
    applyCharacterMap(_default);
    _game.remove?.();
    setCurrentPalette(defaultPalette);
    SceneManager.setscenes([]);
    currentGame = null;
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    resetEntries();
    if (ctx) putStartupImage();
    callEvent('afterStop', []);
    if (!noani) renderFn = putStartupImage;
    return new Promise((res) => requestAnimationFrame(res as any));
}

export async function loadFromEvent(ev: InputEvent) {
    if (!frame || !frame.isConnected) return;
    try {
        await stopGame();

        const el = ev.target as HTMLInputElement;
        if (!el.files || !el.files.item(0)) return;
        const f = el.files.item(0);
        if (!f) return;
        let text = '';
        const buf = new Uint8Array(await f.arrayBuffer());
        if (f.name.endsWith('.png')) {
            let offset =
                buf[buf.length - 1] |
                (buf[buf.length - 2] << 8) |
                (buf[buf.length - 3] << 16) |
                (buf[buf.length - 4] << 24);

            for (let i = offset; i < buf.length - 4; ++i) {
                text += String.fromCharCode(buf[i]);
            }
        } else {
            for (let i = 0; i < buf.length; ++i)
                text += String.fromCharCode(buf[i]);
        }
        if (!text) return;
        loadGameByContents(text);
    } catch (e: any) {
        stopGame();
        console.error('Could not load file!\n╰─> %s', e?.stack || e);
        runErrorAnimation();
    }
    (ev.target as HTMLInputElement).value = '';
    delete (globalThis as any).__registeredGame;
}

(window as any).stopGame = stopGame;
(window as any).loadGame = loadFromEvent;

let lastContents: string = '';

let isLoadingGame = false;

async function runCode(code: string, norestrict: boolean) {
    return await new Function(
        'with({' +
            (norestrict ? '' : 'electron:undefined') +
            '}){\n' +
            code +
            '\n}'
    ).call({});
}

export async function loadGameByContents(
    contents: string | undefined | null,
    norestrict?: boolean
) {
    if (!frame || !frame.isConnected || !contents) return;
    await stopGame();

    lastContents = contents;
    try {
        isLoadingGame = true;
        await runCode(contents, !!norestrict);
        if (!(globalThis as any).__registeredGame) throw new Error();
        const game = (globalThis as any).__registeredGame as
            | GameFile
            | undefined;
        if (!game) throw new Error();
        delete (globalThis as any).__registeredGame;
        console.log('Loading Game %s', game?.name || 'no name specified', game);
        await loadGame(game as GameFile);
    } catch (e: any) {
        stopGame(true);
        console.error('Could not load file!\n╰─> %s', e?.stack || e);
        (async () => {
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
        })();
        renderFn = () => runErrorAnimation(e);
    }
    delete (globalThis as any).__registeredGame;
    isLoadingGame = false;
}

export function shouldBreak() {
    if (isLoadingGame) return false;
    return !currentGame || !frame || !frame.isConnected || !done;
}

export function getCurrentGameName(): string {
    return currentGame?.name || '';
}
(window as any).getCurrentGameName = getCurrentGameName;

export function startGame() {
    if (!frame || !frame.isConnected) return;
    if (!show())
        (
            frame.getElementsByClassName(
                '__rainbow32_gamefile'
            )[0] as HTMLElement
        )?.click();
}
(window as any).startGame = startGame;
(window as any).loadGameByContents = loadGameByContents;

export function defaultElGenProps(
    frame: HTMLElement,
    isFullscreen: boolean
): Rainbow32ConsoleElementGeneratorOptions {
    isFullscreen ||= canvasFullScreen();
    return {
        canvas: {
            aspectRatio: '200/180',
            bgCol: 'var(--bg-col)',
            height: isFullscreen ? '100%' : '50%',
            width: '100%',
            zIndex: 10,
        },
        classes: {
            canvas: '__rainbow32_canvas',
            fileInput: '__rainbow32_gamefile',
            buttons: {
                down: '__rainbow32_button_down',
                right: '__rainbow32_button_right',
                up: '__rainbow32_button_up',
                left: '__rainbow32_button_left',
                i: '__rainbow32_button_i',
                o: '__rainbow32_button_o',
                u: '__rainbow32_button_u',
                p: '__rainbow32_button_p',
                start: '__rainbow32_button_start',
                stop: '__rainbow32_button_stop',
            },
            button: '__rainbow32_button',
            textButton: '__rainbow32_textbutton',
        },
        withControls: !isFullscreen,
        frame,
    };
}

export function unpause() {
    paused = false;
}
export function resetCart() {
    if (!lastContents) return;
    unpause();

    stopGame();
    return loadGameByContents(lastContents);
}
window.addEventListener('beforeunload', () => {
    stopGame();
    return null;
});

export function isPaused() {
    return paused;
}
export function setPaused(value: boolean) {
    return (paused = !!value);
}

window.addEventListener('resize', () => {
    if (!ctx?.canvas.isConnected) return;
    ctx.canvas.style.width = '';
    ctx.canvas.style.height = '';
    if (
        window.outerWidth <
        window.outerHeight >> (buttonElements.up.isConnected ? 1 : 0)
    )
        ctx.canvas.style.width = '100%';
    else
        ctx.canvas.style.height = buttonElements.up.isConnected
            ? '50%'
            : '100%';
});
