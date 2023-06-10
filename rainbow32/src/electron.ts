import { imgToPng } from './imageUtils';
import { HEIGHT, WIDTH, isLoaded, loadGameByContents, memory } from './index';
import { displayMessage } from './statusbar';

interface ElectronAPI {
    getCartridges(): Promise<string[]>;
    loadProgram(program: 'sdk' | 'rainbow32'): void;
    toggleFullscreen(): void;
    getExplorerCode(): Promise<string>;
    saveScreenshot(data: Uint8Array, name: string): void;
    prompt(message: string, value?: string): Promise<string|null>
}
export const electronAPI: ElectronAPI | undefined = (window as any).electron
    ?.ipcRenderer;

export let focused: boolean;

export function isInApp(): boolean {
    return !!electronAPI;
}

export function show(): boolean {
    if (!electronAPI) return false;
    runCartridgeExplorer();
    return true;
}

let explorerContents = electronAPI?.getExplorerCode();

export function runCartridgeExplorer() {
    if (explorerContents === undefined) return;
    explorerContents.then((res) => loadGameByContents(res, true));
}

window.addEventListener(
    'load',
    () => {
        function keyDown(ev: KeyboardEvent) {
            if (!isLoaded()) return;
            if (ev.key === 'F11' && electronAPI) {
                ev.cancelBubble = true;
                ev.stopPropagation?.();
                ev.preventDefault();
                electronAPI.toggleFullscreen();
            }
            if (ev.key === 'F2' && electronAPI) {
                ev.cancelBubble = true;
                ev.stopPropagation?.();
                ev.preventDefault();
                const buf = memory.slice(1);
                for (let i = 0; i < buf.length; ++i)
                    buf[i] = buf[i] === 0xff ? 0 : buf[i];
                const url = imgToPng({ width: WIDTH, height: HEIGHT, buf });
                if (!url) return;
                const now = new Date();
                const name = `screenshot-${now.getFullYear()}-${now.getMonth()}-${
                    now.getDay() + 1
                }-${now.getHours()}-${now.getSeconds()}-${now.getMilliseconds()}.png`;
                displayMessage('screenshot saved');
                fetch(url)
                    .then((res) => res.arrayBuffer())
                    .then((buf) =>
                        electronAPI?.saveScreenshot(new Uint8Array(buf), name)
                    )
                    .then(
                        () => {},
                        () => {}
                    );
            }
        }
        window.addEventListener('keydown', keyDown, { capture: true });
    },
    { capture: true }
);

export function canvasFullScreen() {
    return !!(globalThis as any).__console_config_canvasFullScreen;
}
