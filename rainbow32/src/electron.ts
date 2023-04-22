import { loadGameByContents, memory } from './index';

interface ElectronAPI {
    getDevices(): Promise<string[]>;
    mountDevice(device: string): Promise<void>;
    unmountDevice(device: string): Promise<void>;
    listDirectory(
        device: string,
        path: string
    ): Promise<undefined | { name: string; file: boolean }[]>;
    getFileContents(device: string, path: string): Promise<string | undefined>;
}
const electronAPI: ElectronAPI | undefined = (window as any).electron
    ?.ipcRenderer;

function path(d: string) {
    const pathEl = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );
    pathEl.setAttribute('d', d);
    return pathEl;
}

function fileSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1rem');
    svg.setAttribute('height', '1rem');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path1 = path('M0 0h24v24H0z');
    path1.setAttribute('stroke', 'none');
    path1.setAttribute('fill', 'none');
    svg.append(
        path1,
        path('M14 3v4a1 1 0 0 0 1 1h4'),
        path(
            'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z'
        )
    );
    return svg;
}
function folderSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1rem');
    svg.setAttribute('height', '1rem');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path1 = path('M0 0h24v24H0z');
    path1.setAttribute('stroke', 'none');
    path1.setAttribute('fill', 'none');
    svg.append(
        path1,
        path(
            'M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2'
        )
    );
    return svg;
}

function makeEntry(name: string, selected: boolean, file: boolean | undefined) {
    const p = document.createElement('p');
    p.classList.add('fileselect');
    if (selected) p.classList.add('active');
    p.append(document.createTextNode(selected ? '▶ ' : '\xa0\xa0'));
    if (file !== undefined) p.append(file ? fileSVG() : folderSVG());
    const nameEl = document.createElement('span');
    nameEl.textContent = name;
    p.append(nameEl);

    return p;
}

let devices: string[] = [];
let selected = 0;
let currentDevice: string | null = null;
let currentPath: string[] = [];
let files: { file: boolean; name: string }[] = [];

function render() {
    const div = document.createElement('div');
    div.classList.add('fileSelector');
    const pathOverview = document.createElement('p');
    pathOverview.classList.add('path');
    pathOverview.textContent =
        (!currentDevice
            ? ''
            : currentDevice === 'home'
            ? 'home'
            : currentDevice === '/'
            ? ''
            : '/mnt/' + currentDevice) +
        '/' +
        currentPath.join('/');
    div.append(pathOverview);

    if (currentDevice) {
        for (let i = 0; i < files.length; ++i)
            div.append(makeEntry(files[i].name, selected === i, files[i].file));
    } else {
        div.append(
            makeEntry('/ (Root)', selected === 0, undefined),
            makeEntry('home', selected === 1, undefined)
        );
        for (let i = 0; i < devices.length; ++i)
            div.append(makeEntry(devices[i], selected === i + 2, undefined));
    }

    return div;
}

let currentDiv = render();

function rerender() {
    const newDiv = render();
    currentDiv.parentNode?.append(newDiv);
    currentDiv.remove();
    currentDiv = newDiv;
}

export let focused: boolean;

export function isInApp(): boolean {
    return !!electronAPI;
}

export function show(): boolean {
    if (!electronAPI) return false;
    focused = true;
    if (currentDiv.parentElement) return true;
    document.body.append(currentDiv);
    currentDevice = null;
    electronAPI.getDevices().then((d) => {
        devices = d;
        rerender();
    });
    currentPath = [];
    selected = 0;

    memory[0] = 0;
    return true;
}
export function isFocused() {
    if (!electronAPI) return false;
    return focused;
}
export function hide() {
    if (!electronAPI) return;
    focused = false;
    currentDiv.remove();
}

function $goUp() {
    if (!electronAPI) return;
    if (!currentDevice) return hide();
    else if (currentPath.length < 1) {
        if (currentDevice !== '/' && currentDevice !== 'home')
            electronAPI.unmountDevice(currentDevice);
        currentDevice = null;
        selected = 0;
        rerender();
    } else {
        currentPath.pop();
        electronAPI
            .listDirectory(currentDevice, '/' + currentPath.join('/'))
            .then((dir) => {
                if (!dir) return;
                files = dir;
                selected = 0;
                rerender();
            });
    }
}

function $move(up: boolean) {
    let max = 0;
    if (currentDevice) max += files.length;
    else max += devices.length + 2;

    let newSelected = 0;

    if (up) newSelected = (selected === 0 ? max : selected) - 1;
    else newSelected = selected === max - 1 ? 0 : selected + 1;

    const oldNode = currentDiv.children[selected + 1];
    if (oldNode) {
        oldNode.classList.remove('active');
        (oldNode.childNodes[0] as Text).data = '\xa0\xa0';
    }
    if (newSelected < 0) selected = 0;
    else if (newSelected >= max) selected = max - 1;
    else selected = newSelected;
    const node = currentDiv.children[selected + 1];
    if (node) {
        node.classList.add('active');
        node.scrollIntoView({
            behavior: 'auto',
            block: 'center',
        });
        (node.childNodes[0] as Text).data = '▶ ';
    }
    // rerender();
}

function $open() {
    if (!electronAPI) return;
    if (currentDevice) {
        const f = files[selected];
        if (!f) return;
        if (f.file) {
            electronAPI
                .getFileContents(
                    currentDevice,
                    currentPath.join('/') + '/' + f.name
                )
                .then((c) => {
                    if (!c) return;
                    loadGameByContents(c).catch(() => {});
                    hide();
                });
            return;
        }
        currentPath.push(f.name);
        electronAPI
            .listDirectory(currentDevice, '/' + currentPath.join('/'))
            .then((dir) => {
                if (!dir) return;
                files = dir;
                selected = 0;
                rerender();
            });

        return;
    }
    if (selected === 0) {
        electronAPI.listDirectory('/', '/').then((dir) => {
            if (!dir) return;
            currentDevice = '/';
            files = dir;
            currentPath = [];
            selected = 0;
            rerender();
        });
        return;
    }
    if (selected === 1) {
        electronAPI.listDirectory('home', '/').then((dir) => {
            if (!dir) return;
            currentDevice = 'home';
            files = dir;
            currentPath = [];
            selected = 0;
            rerender();
        });
        return;
    }
    const d = devices[selected - 2];
    if (!d) return;
    electronAPI
        .mountDevice(d)
        .then(() => electronAPI.listDirectory(d, '/'))
        .then((dir) => {
            if (!dir) return;
            currentDevice = d;
            files = dir;
            currentPath = [];
            selected = 0;
            rerender();
        });
}

window.addEventListener('load', () => {
    function keyDown(ev: KeyboardEvent) {
        if (!focused || !electronAPI) return;
        if (ev.key === 'ArrowDown' || ev.key === 's') {
            $move(false);
            ev.preventDefault();
        } else if (ev.key === 'ArrowUp' || ev.key === 'w') {
            $move(true);
            ev.preventDefault();
        } else if (ev.key === 'ArrowRight' || ev.key === 'a') {
            $open();
            ev.preventDefault();
        } else if (ev.key === 'ArrowLeft' || ev.key === 'd') {
            $goUp();
            ev.preventDefault();
        } else if (ev.key === 'Escape') {
            hide();
            ev.preventDefault();
        }
    }
    window.addEventListener('keydown', keyDown);
});

export function canvasFullScreen() {
    return !!(globalThis as any).__console_config_canvasFullScreen;
}
