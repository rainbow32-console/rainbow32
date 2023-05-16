import {
    applyImageMask,
    defaultPalette,
    getCurrentPalette,
    Image,
    ImageMask,
    imgToPng,
    parsedPalette,
    parseImage,
    parseMask,
    square,
    stringifyImage,
    stringifyMask,
} from '../../rainbow32/src/imageUtils';
import {
    Animation,
    AnimationFrame,
    AnimationPlayer,
} from '../../rainbow32/src/animation';
import { imageDataURI } from './img';
import { compileTypescript, compile } from './esbuild';
import {
    getSound,
    Instrument,
    loadMusic,
    parseAudio,
    playSound,
    Sound,
    unloadMusic,
} from '../../rainbow32/src/audioUtils';
import { download, sleep } from '../../rainbow32/src/utils';
import globals from './globals';
import {
    getDebugString,
    HEIGHT,
    loadGameByContents,
    memory,
    onLoad,
    setDbgDataCollection,
    unload,
    WIDTH,
} from '../../rainbow32/src/index';
import { _getCode } from './newCode';
import _default from '../../rainbow32/src/fonts/default';
import { b64DecodeUnicode, b64EncodeUnicode } from './b64';
import { calculateWidth } from '../../rainbow32/src/text';

function getColor(color: number): Record<'r' | 'g' | 'b' | 'a', number> {
    const palette = getCurrentPalette();
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
function imgToImageData(img: Image): ImageData | null {
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

function text(text: string): Text {
    return document.createTextNode(text);
}
function h(
    name: string,
    attributes: Record<string, any>,
    children: (HTMLElement | Text)[]
): HTMLElement {
    const $el = document.createElement(name);
    for (const [k, v] of Object.entries(attributes))
        $el.setAttribute(k, v + '');
    $el.append(...children);
    return $el;
}

function paletteEntry(
    selected: boolean,
    index: number,
    color: string
): HTMLElement {
    return h(
        'div',
        {
            class: 'tooltip palette-entry ' + (selected && 'active'),
            style: `background-color: ${color};--tooltip: '${index}/${index.toString(
                32
            )}\\A${color.toLowerCase()}'`,
            'data-index': index.toString(),
        },
        []
    );
}

function makePalette(interactive?: boolean, selected?: number) {
    const paletteDiv = h(
        'div',
        { class: 'palette ' + (interactive && 'palette-interactive') },
        []
    );
    let i = 0;
    const row1 = h('div', { class: 'row' }, [
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
    ]);
    const row2 = h('div', { class: 'row' }, [
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
    ]);
    const row3 = h('div', { class: 'row' }, [
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
    ]);
    const row4 = h('div', { class: 'row' }, [
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
        paletteEntry(selected === i, i, defaultPalette[i++]),
    ]);
    paletteDiv.append(row1, row2, row3, row4);

    return paletteDiv;
}
function kbd(txt: string) {
    return h('kbd', {}, [text(txt)]);
}
function textButton(
    attributes: Record<string, string>,
    children: (HTMLElement | Text)[]
) {
    return h(
        'div',
        { ...attributes, class: 'text-button ' + (attributes.class || '') },
        children
    );
}

type tab =
    | 'draw'
    | 'mask'
    | 'music'
    | 'keybinds'
    | 'editor'
    | 'data'
    | 'utils'
    | 'animations';

let lastSelected: 'compiled' | tab = 'draw';

const tabs: tab[] = [
    'draw',
    'mask',
    'keybinds',
    'music',
    'animations',
    'editor',
    'data',
    'utils',
];

export interface AnimationData {
    type: 'text' | 'image' | 'mask';
    animation: Animation<string>;
}

declare var require: any;
declare var monaco: any;
let updateMasks = (newMasks: string[]) => {};
let updateAudios = (newAudios: string[]) => {};
let updateImages = (newImages: string[]) => {};
let updateTexts = (newTexts: string[]) => {};
let updateAnimations = (newAnimations: string[]) => {};
let editorPostInit = () => {};
export let getImages: () => Record<string, string> = () => ({});
export let getMasks: () => Record<string, string> = getImages;
export let getAudios: () => Record<string, string> = getImages;
export let getTexts: () => Record<string, string> = getImages;
export let getAnimations: () => Record<string, AnimationData> =
    getImages as any;
let getCode: () => string = () => localStorage.getItem('code') || '';
let compileAndPopup = () => {};
let compileAndDownload = () => {};
let addImage = (name?: string, image?: string) => {};
let getAnimation: () => AnimationData = () => ({ type: 'text', animation: [] });
let setAnimation: (animation: AnimationData) => void = getImages as any;

function serialize(): string {
    try {
        return JSON.stringify({
            code: localStorage.getItem('code') || '',
            audios: localStorage.getItem('audios') || '{}',
            images: localStorage.getItem('images') || '{}',
            masks: localStorage.getItem('masks') || '{}',
            animations: localStorage.getItem('animations') || '{}',
            author: localStorage.getItem('author') || '',
            name: localStorage.getItem('name') || '',
            texts: localStorage.getItem('texts') || '',
        });
    } catch (e) {
        createNotification(
            'Error',
            'Error saving your current project! Does your browser support localStorage?',
            '#b91c1c'
        );
        throw e;
    }
}
function deserialize(data: string) {
    try {
        const parsed = JSON.parse(data);
        localStorage.setItem('code', parsed.code || '');
        localStorage.setItem('author', parsed.author || '');
        localStorage.setItem('name', parsed.name || '');
        localStorage.setItem('audios', parsed.audios || '{}');
        localStorage.setItem('images', parsed.images || '{}');
        localStorage.setItem('masks', parsed.masks || '{}');
        localStorage.setItem('texts', parsed.texts || '{}');
        localStorage.setItem('animations', parsed.animations || '{}');
    } catch (e) {
        createNotification('Error', 'Error loading your project!', '#b91c1c');
        throw e;
    }
}

function escapeName(name: string): string {
    let newStr = '';
    for (let i = 0; i < name.length; ++i) {
        if (name[i] === ' ') newStr += '_';
        else if (
            'abcdefghijklmmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(
                name[i]
            )
        )
            newStr += name[i].toLowerCase();
    }
    return newStr;
}

const menuActions: Record<string, (ev: MouseEvent, el: HTMLDivElement) => any> =
    {
        save(ev) {
            ev.preventDefault();
            download(
                'data:application/octet-stream;base64,' +
                    btoa(b64EncodeUnicode(serialize())),
                escapeName(localStorage.getItem('name') || 'unnamed') + '.rb32p'
            );
        },
        load(ev) {
            ev.preventDefault();
            if (
                !confirm('Are you sure?\nAny unsaved changes will be discarded')
            )
                return;
            (
                document.getElementsByClassName(
                    'menu-load-file'
                )[0] as HTMLElement
            ).click();
        },
        new() {
            if (
                !confirm('Are you sure?\nAny unsaved changes will be discarded')
            )
                return;
            const name = prompt('Name', 'my awesome game');
            if (!name) return;
            const author = prompt('Author');
            localStorage.setItem('code', _getCode(name));
            localStorage.setItem('audios', '{}');
            localStorage.setItem(
                'images',
                '{"_cartridge": "84:87:' + '8'.repeat(7308) + '"}'
            );
            localStorage.setItem('masks', '{}');
            localStorage.setItem('animations', '{}');
            localStorage.setItem(
                'texts',
                `{"_name": ${JSON.stringify(name)}, "_author": ${JSON.stringify(
                    author
                )}}`
            );
            localStorage.setItem('name', name);
            if (!author) localStorage.removeItem('author');
            else localStorage.setItem('author', author);
            location.reload();
        },
        async export(ev) {
            ev.preventDefault();
            if (
                !confirm(
                    'How to:\n1. Draw a 84x87 image\n2. Click File > Export\nCan you confirm you did all these steps?'
                )
            )
                return;
            const name = prompt('Name:', localStorage.getItem('name') || '');
            if (!name) return;
            const author = prompt(
                'Author:',
                localStorage.getItem('author') || ''
            );
            if (!author) return;
            try {
                const uri = await codeToCartridge(
                    (
                        document.getElementsByClassName(
                            'img-data-input'
                        )[0] as HTMLTextAreaElement
                    ).value,
                    name,
                    author
                );
                openImagePopup(uri);
            } catch (e) {
                alert('' + e);
            }
        },
        test() {
            compileAndPopup();
        },
        compile() {
            compileAndDownload();
        },
    };

function closeX() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon', 'icon-close');
    svg.style.width = '24px';
    svg.style.height = '24px';
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.style.strokeWidth = '2px';
    svg.style.stroke = '#000';
    svg.style.fill = 'none';
    svg.style.strokeLinecap = 'round';
    svg.style.strokeLinejoin = 'round';
    const path1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );
    path1.style.stroke = 'none';
    path1.setAttribute('d', 'M0 0h24v24H0z');
    const path2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );
    path2.setAttribute('d', 'M18 6l-12 12');
    const path3 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );
    path3.setAttribute('d', 'M6 6l12 12');

    svg.append(path1, path2, path3);
    return svg;
}
function row(...elements: HTMLElement[]) {
    return h('div', { class: 'row' }, elements);
}

export function createNotification(
    title: string,
    description: string,
    color: string
) {
    const element = document.getElementsByClassName(
        'notifications'
    )[0] as HTMLElement;
    if (!element) return;
    const notification = document.createElement('div');
    notification.setAttribute('style', '--color: ' + color + ';');
    notification.classList.add('notification');

    const ntitlebar = document.createElement('div');
    ntitlebar.classList.add('n-titlebar');

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.classList.add('n-title');
    const xBtn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    xBtn.classList.add('n-x-button');
    xBtn.setAttribute('viewBox', '0 0 15 15');
    xBtn.setAttribute('fill', 'none');
    xBtn.setAttribute('width', '1rem');
    xBtn.setAttribute('height', '1rem');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
        'd',
        'M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z'
    );
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('clip-rule', 'evenodd');
    xBtn.append(path);
    ntitlebar.append(titleEl, xBtn);

    const body = document.createElement('div');
    body.textContent = description;
    body.classList.add('n-body');

    notification.append(ntitlebar, body);

    element.append(notification);

    setTimeout(() => notification.remove(), 3000);

    xBtn.addEventListener('click', () => notification.remove());
}
interface ArrayLikeReadable<T> {
    length: number;
    [i: number]: number;
}
function setColor(
    arr: ArrayLikeReadable<number>,
    x: number,
    y: number,
    width: number,
    color: number
) {
    arr[y * width + x] = color;
}
function getColorFromArray(
    arr: ArrayLikeReadable<number>,
    x: number,
    y: number,
    width: number
): number {
    return arr[y * width + x] === undefined ? 255 : arr[y * width + x];
}
async function openImagePopup(url: string) {
    if (lastSelected === 'compiled') return;
    const _selected = lastSelected;
    lastSelected = 'compiled';
    const popup = document.createElement('div');
    popup.classList.add('game-popup');
    popup.classList.add('ignore');
    popup.style.zIndex = '5000';
    popup.style.position = 'absolute';
    popup.style.minWidth = '100%';
    popup.style.minHeight = '100%';
    popup.style.width = 'fit-content';
    popup.style.height = 'fit-content';
    popup.style.top = '0px';
    popup.style.bottom = '0px';
    popup.style.left = '0px';
    popup.style.right = '0px';
    popup.style.margin = '0px';
    popup.style.border = 'none';
    popup.style.backgroundColor = '#64748b';
    popup.style.boxSizing = 'border-box';
    document.body.style.overflow = 'auto';

    const svg = closeX();
    svg.style.position = 'fixed';
    svg.style.margin = '10px';
    svg.style.right = '0px';
    svg.style.top = '0px';
    svg.style.cursor = 'pointer';
    const img = h(
        'img',
        {
            src: url,
            style: 'image-rendering: pixelated;',
        },
        []
    );

    popup.append(svg, img);

    window.scrollTo({
        behavior: 'auto',
        top: 0,
    });

    async function close() {
        lastSelected = _selected;
        document.body.style.overflow = 'visible';
        popup.remove();
        svg.removeEventListener('click', close);
        window.removeEventListener('keydown', keydown);
    }
    svg.addEventListener('click', close);

    document.body.append(popup);

    function keydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' || ev.key === 'Enter') {
            close();
            ev.cancelBubble = true;
            ev.stopPropagation?.();
            ev.preventDefault();
        }
    }
    window.addEventListener('keydown', keydown);
    popup.getElementsByTagName('input').item(0)?.remove();

    await awaitLoad(img as HTMLImageElement);
    return popup;
}
async function openPopup(code: string) {
    if (lastSelected === 'compiled') return;
    const _selected = lastSelected;
    lastSelected = 'compiled';
    const popup = document.createElement('div');
    popup.classList.add('game-popup');
    popup.classList.add('ignore');
    popup.style.zIndex = '5000';
    popup.style.position = 'absolute';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.top = '0px';
    popup.style.bottom = '0px';
    popup.style.left = '0px';
    popup.style.right = '0px';
    popup.style.margin = '0px';
    popup.style.border = 'none';
    popup.style.backgroundColor = '#64748b';
    popup.style.boxSizing = 'border-box';
    document.body.style.overflow = 'hidden';

    const svg = closeX();
    svg.style.position = 'absolute';
    svg.style.margin = '10px';
    svg.style.right = '0px';
    svg.style.top = '0px';
    svg.style.cursor = 'pointer';

    const debugDataPre = h('pre', {}, []);
    const keybindsDiv = h('div', { class: 'popup-keybinds' }, [
        h('p', {}, [kbd('w'), text('/'), kbd('U'), text(': trigger up key')]),
        h('p', {}, [kbd('a'), text('/'), kbd('L'), text(': trigger left key')]),
        h('p', {}, [kbd('s'), text('/'), kbd('D'), text(': trigger down key')]),
        h('p', {}, [
            kbd('d'),
            text('/'),
            kbd('R'),
            text(': trigger right key'),
        ]),
        h('p', {}, [kbd('u'), text(': trigger action 1 key')]),
        h('p', {}, [kbd('i'), text(': trigger action 2 key')]),
        h('p', {}, [kbd('o'), text(': trigger action 3 key')]),
        h('p', {}, [kbd('p'), text(': trigger action 4 key')]),
        h('br', {}, []),
        h('h3', {}, [text('debug data')]),
        debugDataPre,
    ]);
    popup.append(svg);

    window.scrollTo({
        behavior: 'auto',
        top: 0,
    });

    async function close() {
        lastSelected = _selected;
        await unload();
        document.body.style.overflow = 'visible';
        popup.remove();
        svg.removeEventListener('click', close);
        window.removeEventListener('keydown', keydown);
        stopRender = true;
    }
    svg.addEventListener('click', close);

    document.body.append(popup);

    let stopRender = false;

    let previous = Date.now();
    function render(dt: number) {
        if (stopRender) return;
        debugDataPre.textContent = getDebugString();
        debugDataPre.textContent +=
            'fps: ' + (1000 / (dt - previous)).toFixed(0);
        requestAnimationFrame(render);
        previous = dt;
    }
    requestAnimationFrame(render);

    function keydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape') close();
        if (ev.key === 'Enter' || ev.key === 'Escape') {
            ev.cancelBubble = true;
            ev.stopPropagation?.();
            ev.preventDefault();
        }
    }
    window.addEventListener('keydown', keydown);

    await onLoad(popup, false);
    setDbgDataCollection(true);
    popup.append(keybindsDiv);
    loadGameByContents(code);
    popup.getElementsByTagName('input').item(0)?.remove();

    return popup;
}
function _useBucket(
    arr: ArrayLikeReadable<number>,
    x: number,
    y: number,
    width: number,
    height: number,
    checked: number[],
    color: number,
    col: number,
    toApply: [number, number][]
) {
    if (x < 0 || y < 0) return;
    if (x >= width || y >= height) return;
    if (checked.includes(y * width + x)) return;
    checked.push(y * width + x);
    if (getColorFromArray(arr, x, y, width) === col) {
        toApply.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        setColor(arr, x, y, width, color);
    }
}
function useBucket(
    arr: ArrayLikeReadable<number>,
    x: number,
    y: number,
    width: number,
    height: number,
    checked: number[],
    color: number
) {
    let col = getColorFromArray(arr, x, y, width);
    if (col === color) return;
    const toApply: [number, number][] = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
    ];
    while (toApply.length > 0) {
        let [x, y] = toApply.pop();
        if (x === undefined || y === undefined) return;
        _useBucket(arr, x, y, width, height, checked, color, col, toApply);
    }
}
function setupDrawing() {
    const drawElement = document.getElementsByClassName('draw')[0];
    if (!drawElement || !(drawElement instanceof HTMLDivElement)) return;
    drawElement.addEventListener('mousedown', () => (lastSelected = 'draw'));

    const palette = makePalette(true, 0);
    drawElement.append(h('h2', {}, [text('drawing tool')]), palette);
    let selected = 0;
    let width = 16;
    let height = 16;
    let scaleFactor = 1;
    palette.addEventListener('click', (ev) => {
        if (
            !ev.target ||
            !(ev.target instanceof HTMLDivElement) ||
            !ev.target.hasAttribute('data-index') ||
            isNaN(Number(ev.target.hasAttribute('data-index')))
        )
            return;
        palette.children[Math.floor(selected / 8)].children[
            selected % 8
        ].classList.remove('active');
        selected = Number(ev.target.getAttribute('data-index'));
        ev.target.classList.add('active');
    });
    window.addEventListener('keydown', (ev) => {
        if (lastSelected !== 'draw' || ev.target instanceof HTMLTextAreaElement)
            return;
        if ((ev.key === '+' || ev.key === '-') && ev.altKey) {
            ev.preventDefault();
            if (ev.key === '+') scaleFactor += 0.25;
            else if (ev.key === '-' && scaleFactor > 1) scaleFactor -= 0.25;
            canvas.setAttribute('style', '--scale-factor: ' + scaleFactor);

            return;
        }
        if (!ev.key.startsWith('Arrow')) return;
        ev.preventDefault();
        let delta =
            ev.key === 'ArrowUp'
                ? -8
                : ev.key === 'ArrowDown'
                ? 8
                : ev.key === 'ArrowLeft'
                ? -1
                : 1;

        palette.children[Math.floor(selected / 8)].children[
            selected % 8
        ].classList.remove('active');
        selected = (selected + 32 + delta) % 32;
        palette.children[Math.floor(selected / 8)].children[
            selected % 8
        ].classList.add('active');
    });
    const widthIn = h(
        'input',
        { type: 'number', value: width.toString() },
        []
    ) as HTMLInputElement;
    const heightIn = h(
        'input',
        { type: 'number', value: height.toString() },
        []
    ) as HTMLInputElement;
    const brushSelector = textButton({ class: 'selected' }, [text('brush')]);
    const bucketSelector = textButton({}, [text('fill bucket')]);
    drawElement.append(
        h('div', {}, [
            h('h3', {}, [text('width:')]),
            widthIn,
            h('h3', {}, [text('height:')]),
            heightIn,
            h('h3', {}, [text('tool:')]),
            h('div', { class: 'row' }, [brushSelector, bucketSelector]),
        ])
    );
    widthIn.addEventListener('change', () => {
        const newWidth = Number(widthIn.value);
        if (
            isNaN(newWidth) ||
            !isFinite(newWidth) ||
            newWidth < 1 ||
            newWidth > 255
        )
            return;
        width = newWidth;
        updateCanvas();
    });
    heightIn.addEventListener('change', () => {
        const newHeight = Number(heightIn.value);
        if (
            isNaN(newHeight) ||
            !isFinite(newHeight) ||
            newHeight < 1 ||
            newHeight > 255
        )
            return;
        height = newHeight;
        updateCanvas();
    });
    let data: number[] = [];
    const canvas = h(
        'canvas',
        {
            width: width * 8 - 1,
            height: height * 8 - 1,
            class: 'paintCanvas',
            style: '--scale-factor: ' + scaleFactor,
        },
        []
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const dataEl = h(
        'textarea',
        {
            style: 'font-family: var(--font);',
            class: 'img-data-input',
        },
        []
    ) as HTMLTextAreaElement;
    const loadBtn = textButton({ class: 'img-load-btn' }, [text('load')]);
    const clearBtn = textButton({ class: 'img-clear-btn' }, [text('clear')]);
    const pngBtn = textButton({ class: 'img-download-btn' }, [
        text('save as png'),
    ]);
    const fromInput = h(
        'input',
        {
            type: 'file',
            accept: '.png',
            id: 'img-upload',
            name: 'img-upload',
            style: 'display:none',
        },
        []
    ) as HTMLInputElement;
    drawElement.append(
        canvas,
        h('div', { class: 'row', style: 'align-items: flex-end' }, [
            dataEl,
            h('div', { class: 'row' }, [
                loadBtn,
                clearBtn,
                pngBtn,
                fromInput,
                h(
                    'label',
                    { class: 'img-upload-btn text-button', for: 'img-upload' },
                    [text('load from png')]
                ),
            ]),
        ])
    );
    loadBtn.addEventListener('click', () => {
        const img = parseImage(dataEl.value.toLowerCase());
        width = img.width;
        height = img.height;
        widthIn.value = width.toString();
        heightIn.value = height.toString();
        data = [];
        for (let i = 0; i < img.buf.length; ++i)
            if (img.buf[i] !== 0xff) data[i] = img.buf[i];
        updateCanvas();
    });
    fromInput.addEventListener('change', async () => {
        const f = fromInput.files?.item(0);
        if (!f || !f.name.endsWith('.png')) return;
        const src = URL.createObjectURL(f);
        const img = h('img', { src }, []) as HTMLImageElement;
        document.body.append(img);
        await awaitLoad(img);
        img.remove();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;
        data = [];
        width = canvas.width;
        height = canvas.height;
        widthIn.value = width.toString();
        heightIn.value = height.toString();
        for (let i = 0; i < imgData.length >> 2; ++i) {
            if (imgData[(i << 2) + 3] < 127) continue;
            const idx = parsedPalette.findIndex(
                (v) =>
                    v.r === imgData[i << 2] &&
                    v.g === imgData[(i << 2) + 1] &&
                    v.b === imgData[(i << 2) + 2]
            );
            if (idx < 0) continue;
            data[i] = idx;
        }
        updateCanvas();
    });
    pngBtn.addEventListener('click', () => {
        const buf = new Uint8Array(width * height);
        for (let i = 0; i < buf.length; ++i)
            buf[i] = data[i] !== undefined ? data[i] : 0xff;

        download(
            imgToPng({
                width,
                height,
                buf,
            }),
            'image.png'
        );
    });
    clearBtn.addEventListener('click', () => {
        width = 16;
        height = 16;
        widthIn.value = '16';
        heightIn.value = '16';
        data = [];
        updateCanvas();
    });
    function updateCanvas() {
        canvas.width = width * 8 - 1;
        canvas.height = height * 8 - 1;
        const image: Image = {
            height: height,
            width: width,
            buf: new Uint8Array(width * height),
        };
        ctx.clearRect(0, 0, width * 8, height * 8);
        for (let h = 0; h < height; ++h)
            for (let w = 0; w < width; ++w)
                if (
                    data[h * width + w] !== undefined &&
                    getColorFromArray(data, w, h, width) !== 255
                ) {
                    ctx.fillStyle =
                        defaultPalette[getColorFromArray(data, w, h, width)];
                    ctx.fillRect(w * 8, h * 8, 7, 7);
                    setColor(image.buf, w, h, width, data[h * width + w]);
                } else setColor(image.buf, w, h, width, 255);

        dataEl.value = stringifyImage(image);
    }
    updateCanvas();
    let tool: 'brush' | 'fill' = 'brush';
    bucketSelector.addEventListener('click', () => {
        tool = 'fill';
        brushSelector.classList.remove('selected');
        bucketSelector.classList.add('selected');
    });
    brushSelector.addEventListener('click', () => {
        tool = 'brush';
        bucketSelector.classList.remove('selected');
        brushSelector.classList.add('selected');
    });
    canvas.addEventListener('mousemove', (ev) => {
        if (ev.buttons !== 1 && ev.buttons !== 2) return;
        else if (tool !== 'brush') return;
        const x = Math.floor(
            ((ev.clientX - canvas.getBoundingClientRect().left) /
                canvas.clientWidth) *
                width
        );
        const y = Math.floor(
            ((ev.clientY - canvas.getBoundingClientRect().top) /
                canvas.clientHeight) *
                height
        );
        let col = ev.buttons === 1 ? selected : 255;
        setColor(data, x, y, width, col);
        updateCanvas();
    });
    canvas.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        const x = Math.floor(
            ((ev.clientX - canvas.getBoundingClientRect().left) /
                canvas.clientWidth) *
                width
        );
        const y = Math.floor(
            ((ev.clientY - canvas.getBoundingClientRect().top) /
                canvas.clientHeight) *
                height
        );
        const col = ev.buttons === 1 ? selected : 255;
        if (tool === 'brush') setColor(data, x, y, width, col);
        else if (tool === 'fill') useBucket(data, x, y, width, height, [], col);
        updateCanvas();
    });
    canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
}
function setupMasking() {
    const maskingDiv = document.getElementsByClassName('mask')[0];
    if (!maskingDiv) return;
    maskingDiv.addEventListener('mousedown', () => (lastSelected = 'mask'));

    let width = 16;
    let height = 16;
    let scaleFactor = 1;
    window.addEventListener('keydown', (ev) => {
        if (lastSelected !== 'mask') return;
        if ((ev.key === '+' || ev.key === '-') && ev.altKey) {
            ev.preventDefault();
            if (ev.key === '+') scaleFactor += 0.25;
            else if (ev.key === '-' && scaleFactor > 1) scaleFactor -= 0.25;
            canvas.setAttribute('style', '--scale-factor: ' + scaleFactor);
        }
    });

    const widthIn = h(
        'input',
        { type: 'number', value: width.toString() },
        []
    ) as HTMLInputElement;
    const heightIn = h(
        'input',
        { type: 'number', value: height.toString() },
        []
    ) as HTMLInputElement;
    const brushSelector = textButton({ class: 'selected' }, [text('brush')]);
    const bucketSelector = textButton({}, [text('fill bucket')]);
    maskingDiv.append(
        h('h2', {}, [text('masking tool')]),
        h('div', {}, [
            h('h3', {}, [text('width:')]),
            widthIn,
            h('h3', {}, [text('height:')]),
            heightIn,
            h('h3', {}, [text('tool:')]),
            h('div', { class: 'row' }, [brushSelector, bucketSelector]),
        ])
    );
    widthIn.addEventListener('change', () => {
        const newWidth = Number(widthIn.value);
        if (
            isNaN(newWidth) ||
            !isFinite(newWidth) ||
            newWidth < 1 ||
            newWidth > 255
        )
            return;
        width = newWidth;
        updateCanvas();
    });
    heightIn.addEventListener('change', () => {
        const newHeight = Number(heightIn.value);
        if (
            isNaN(newHeight) ||
            !isFinite(newHeight) ||
            newHeight < 1 ||
            newHeight > 255
        )
            return;
        height = newHeight;
        updateCanvas();
    });
    let data: number[] = [];
    const canvas = h(
        'canvas',
        {
            width: width * 8 - 1,
            height: height * 8 - 1,
            class: 'paintCanvas',
            style: '--scale-factor: ' + scaleFactor,
        },
        []
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const dataEl = h(
        'textarea',
        {
            style: 'font-family: var(--font);',
            class: 'mask-data-input',
        },
        []
    ) as HTMLTextAreaElement;
    const dataEl1 = h(
        'textarea',
        {
            style: 'font-family: var(--font);',
            cols: '17',
            rows: '17',
        },
        []
    ) as HTMLTextAreaElement;
    const btnClear = h('div', { class: 'text-button' }, [text('clear')]);
    const btnLoad = h('div', { class: 'text-button mask-load-btn' }, [
        text('load'),
    ]);
    maskingDiv.append(
        h('div', { class: 'row' }, [
            canvas,
            h('div', { style: 'display:flex;flex-direction:column;' }, [
                dataEl,
                dataEl1,
                h('div', { class: 'row' }, [btnClear, btnLoad]),
            ]),
        ])
    );
    btnClear.addEventListener('click', () => {
        data = [];
        updateCanvas();
    });
    btnLoad.addEventListener('click', () => {
        const mask = parseMask(dataEl.value);
        data = [];
        for (let h = 0; h < height; ++h)
            for (let w = 0; w < width; ++w)
                if (
                    (mask.buf[Math.floor((h * mask.width + w) / 8)] >>
                        (h * mask.width + w) % 8) &
                    1
                )
                    data[h * mask.width + w] = 1;
        width = mask.width;
        height = mask.height;
        widthIn.value = mask.width.toString();
        heightIn.value = mask.height.toString();
        updateCanvas();
    });

    function updateCanvas() {
        canvas.width = width * 8 - 1;
        canvas.height = height * 8 - 1;
        const mask = {
            height,
            width,
            buf: new Uint8Array(Math.ceil((width * height) / 8)),
        };
        ctx.fillStyle = defaultPalette[20];
        ctx.fillRect(0, 0, width * 8 - 1, height * 8 - 1);
        ctx.fillStyle = defaultPalette[0];
        for (let h = 0; h < height; ++h)
            for (let w = 0; w < width; ++w) {
                const off = h * width + w;
                if (data[off] && data[off] !== 255) {
                    mask.buf[Math.floor(off / 8)] |= 1 << off % 8;
                    ctx.fillRect(w * 8, h * 8, 7, 7);
                }
            }
        dataEl.value = stringifyMask(mask);
        let _data = '';
        let off = width.toString().length + height.toString().length + 2;
        for (let i = 0; i < height; ++i)
            _data += `${dataEl.value.substring(
                i * width + off,
                i * width + width + off
            )}\n`;
        dataEl1.value = _data;
    }
    updateCanvas();
    canvas.addEventListener('mousemove', (ev) => {
        if (ev.buttons !== 1 && ev.buttons !== 2) return;
        if (tool !== 'brush') return;
        const x = Math.floor(
            ((ev.clientX - canvas.getBoundingClientRect().left) /
                canvas.clientWidth) *
                width
        );
        const y = Math.floor(
            ((ev.clientY - canvas.getBoundingClientRect().top) /
                canvas.clientHeight) *
                height
        );

        if (ev.buttons === 1) data[y * width + x] = 1;
        else delete data[y * width + x];
        updateCanvas();
    });
    let tool: 'brush' | 'fill' = 'brush';
    brushSelector.addEventListener('click', () => {
        tool = 'brush';
        bucketSelector.classList.remove('selected');
        brushSelector.classList.add('selected');
    });
    bucketSelector.addEventListener('click', () => {
        tool = 'fill';
        brushSelector.classList.remove('selected');
        bucketSelector.classList.add('selected');
    });
    canvas.addEventListener('mousedown', (ev) => {
        const x = Math.floor(
            ((ev.clientX - canvas.getBoundingClientRect().left) /
                canvas.clientWidth) *
                width
        );
        const y = Math.floor(
            ((ev.clientY - canvas.getBoundingClientRect().top) /
                canvas.clientHeight) *
                height
        );
        if (tool === 'brush')
            setColor(data, x, y, width, ev.buttons === 1 ? 1 : 255);
        else
            useBucket(
                data,
                x,
                y,
                width,
                height,
                [],
                ev.buttons === 1 ? 1 : 255
            );
        updateCanvas();
    });
    canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
}
function setupMusic() {
    const element = document.getElementsByClassName('music')[0];
    if (!element) return;
    element.addEventListener('mousedown', () => (lastSelected = 'music'));

    element.append(h('h2', {}, [text('music editor')]));
    const lengthInput = h(
        'input',
        { type: 'number', value: '16' },
        []
    ) as HTMLInputElement;
    const speedInput = h(
        'input',
        { type: 'number', value: '500' },
        []
    ) as HTMLInputElement;
    const playBtn = h('div', { class: 'text-button' }, [text('play')]);

    element.append(
        h('div', { class: 'row', style: 'gap: .25rem;' }, [
            h('h3', {}, [text('channel')]),
            h('h3', {}, [text('length')]),
            lengthInput,
            h('div', { style: 'flex-grow: 1;' }, []),
            h('h3', {}, [text('speed (ms)')]),
            speedInput,
            playBtn,
        ])
    );

    let channel: 1 | 2 | 3 | 4 = 1;
    let length = 16;

    lengthInput.addEventListener('change', () => {
        let newVal = Math.floor(Number(lengthInput.value));
        if (isNaN(newVal)) newVal = 16;
        else if (newVal < 1) newVal = 1;
        else if (newVal > 255) newVal = 255;
        lengthInput.value = newVal.toString();
        if (newVal < 0) {
            lengthInput.value = '0';
            newVal = 0;
        }
        if (newVal > 255) {
            lengthInput.value = '255';
            newVal = 255;
        }
        length = newVal;
        rerender();
    });

    let selectedNote = 0;
    let data: [Sound[], Sound[], Sound[], Sound[]] = [[], [], [], []];

    let instruments: [Instrument, Instrument, Instrument, Instrument] = [
        'square-wave',
        'square-wave',
        'square-wave',
        'square-wave',
    ];

    const dataOutEl = h(
        'textarea',
        {
            style: 'margin:0 .5rem;flex-grow:1;height:5rem;font-family: var(--font);',
            class: 'audio-data-input',
        },
        []
    ) as HTMLTextAreaElement;

    function render() {
        channel = 1;
        selectedNote = 0;

        const divs = [
            h('div', { class: 'audio-entries active' }, []),
            h('div', { class: 'audio-entries' }, []),
            h('div', { class: 'audio-entries' }, []),
            h('div', { class: 'audio-entries' }, []),
        ];
        for (let i = 0; i < length; ++i) {
            const node1 = h(
                'div',
                { class: 'audio-entry ' + (selectedNote === i && 'active') },
                [
                    text(
                        data[0][i] && data[0][i].octave !== undefined
                            ? `${data[0][i].sound.toLowerCase()}${
                                  data[0][i].octave
                              }${data[0][i].sharp ? '#' : ''}`
                            : ''
                    ),
                ]
            );
            node1.addEventListener('click', () => {
                if (channel !== 1) {
                    currentlyRenderedDiv.children[channel - 1].classList.remove(
                        'active'
                    );
                    currentlyRenderedDiv.children[0].classList.add('active');
                }
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                selectedNote = i;
                channel = 1;
                currentlyRenderedDiv.children[channel - 1].children[
                    i
                ].classList.add('active');
                if (data[channel - 1][i]) {
                    currentNote = data[channel - 1][i].sound;
                    currentOctave = data[channel - 1][i].octave;
                    sharp = data[channel - 1][i].sharp;
                } else {
                    currentNote = null;
                    currentOctave = null;
                    sharp = false;
                }
                updateNote();
            });

            const node2 = h('div', { class: 'audio-entry' }, [
                text(
                    data[1][i] && data[1][i].octave !== undefined
                        ? `${data[1][i].sound.toLowerCase()}${
                              data[1][i].octave
                          }${data[1][i].sharp ? '#' : ''}`
                        : ''
                ),
            ]);
            node2.addEventListener('click', () => {
                if (channel !== 2) {
                    currentlyRenderedDiv.children[channel - 1].classList.remove(
                        'active'
                    );
                    currentlyRenderedDiv.children[1].classList.add('active');
                }
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                selectedNote = i;
                channel = 2;
                currentlyRenderedDiv.children[channel - 1].children[
                    i
                ].classList.add('active');
                if (data[channel - 1][i]) {
                    currentNote = data[channel - 1][i].sound;
                    currentOctave = data[channel - 1][i].octave;
                    sharp = data[channel - 1][i].sharp;
                } else {
                    currentNote = null;
                    currentOctave = null;
                    sharp = false;
                }
                updateNote();
            });

            const node3 = h('div', { class: 'audio-entry' }, [
                text(
                    data[2][i] && data[2][i].octave !== undefined
                        ? `${data[2][i].sound.toLowerCase()}${
                              data[2][i].octave
                          }${data[2][i].sharp ? '#' : ''}`
                        : ''
                ),
            ]);
            node3.addEventListener('click', () => {
                if (channel !== 3) {
                    currentlyRenderedDiv.children[channel - 1].classList.remove(
                        'active'
                    );
                    currentlyRenderedDiv.children[2].classList.add('active');
                }
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                selectedNote = i;
                channel = 3;
                currentlyRenderedDiv.children[channel - 1].children[
                    i
                ].classList.add('active');
                if (data[channel - 1][i]) {
                    currentNote = data[channel - 1][i].sound;
                    currentOctave = data[channel - 1][i].octave;
                    sharp = data[channel - 1][i].sharp;
                } else {
                    currentNote = null;
                    currentOctave = null;
                    sharp = false;
                }
                updateNote();
            });

            const node4 = h('div', { class: 'audio-entry' }, [
                text(
                    data[3][i] && data[3][i].octave !== undefined
                        ? `${data[3][i].sound.toLowerCase()}${
                              data[3][i].octave
                          }${data[3][i].sharp ? '#' : ''}`
                        : ''
                ),
            ]);
            node4.addEventListener('click', () => {
                if (channel !== 4) {
                    currentlyRenderedDiv.children[channel - 1].classList.remove(
                        'active'
                    );
                    currentlyRenderedDiv.children[3].classList.add('active');
                }
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                selectedNote = i;
                channel = 4;
                currentlyRenderedDiv.children[channel - 1].children[
                    i
                ].classList.add('active');
                if (data[channel - 1][i]) {
                    currentNote = data[channel - 1][i].sound;
                    currentOctave = data[channel - 1][i].octave;
                    sharp = data[channel - 1][i].sharp;
                } else {
                    currentNote = null;
                    currentOctave = null;
                    sharp = false;
                }
                updateNote();
            });

            divs[0].append(node1);
            divs[1].append(node2);
            divs[2].append(node3);
            divs[3].append(node4);
        }
        updateDataOut();
        return h('div', { style: 'width: fit-content' }, divs);
    }

    let currentlyRenderedDiv = render();
    function rerender() {
        const newDiv = render();
        currentlyRenderedDiv.replaceWith(newDiv);
        currentlyRenderedDiv = newDiv;
    }

    let currentNote: Sound['sound'] | null = null;
    let currentOctave: Sound['octave'] | null = null;
    let sharp: boolean = false;

    const clearBtnCur = h('div', { class: 'text-button' }, [text('clear')]);
    const clearBtnChan = h('div', { class: 'text-button' }, [
        text('clear channel'),
    ]);
    const clearBtnAll = h('div', { class: 'text-button' }, [text('clear all')]);
    const octaveDown = h('div', { class: 'text-button' }, [text('L')]);
    const octaveUp = h('div', { class: 'text-button' }, [text('R')]);
    const octave = h('div', { class: 'text-button-fake' }, [text('')]);
    const instrumentSelector = h('select', { class: 'input-select' }, [
        h('option', { value: 'square-wave', selected: '' }, [
            text('square wave'),
        ]),
        h('option', { value: 'sine-wave' }, [text('sine wave')]),
        h('option', { value: 'sawtooth-wave' }, [text('sawtooth wave')]),
        h('option', { value: 'triangle-wave' }, [text('triangle wave')]),
        h('option', { value: 'noise' }, [text('noise')]),
    ]) as HTMLSelectElement;

    element.append(
        h('h3', {}, [text('channels')]),
        currentlyRenderedDiv,
        h('div', { class: 'row', style: 'gap:.25rem;' }, [
            clearBtnCur,
            clearBtnChan,
            clearBtnAll,
            h('h3', { style: 'margin-left: 2rem' }, [text('octave:')]),
            octaveDown,
            octave,
            octaveUp,
            h('div', { style: 'width: 2rem' }, []),
            h('h3', { style: 'margin-left: 2rem' }, [text('instrument:')]),
            instrumentSelector,
        ])
    );

    const noteSelects: HTMLElement[] = [
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'c',
                'data-sharp': 'false',
            },
            [text('c'), kbd('d')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'c',
                'data-sharp': 'true',
            },
            [text('c#'), kbd('c')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'd',
                'data-sharp': 'false',
            },
            [text('d'), kbd('f')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'd',
                'data-sharp': 'true',
            },
            [text('d#'), kbd('v')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'e',
                'data-sharp': 'false',
            },
            [text('e'), kbd('g')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'f',
                'data-sharp': 'false',
            },
            [text('f'), kbd('b')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'f',
                'data-sharp': 'true',
            },
            [text('f#'), kbd('h')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'g',
                'data-sharp': 'false',
            },
            [text('g'), kbd('n')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'g',
                'data-sharp': 'true',
            },
            [text('g#'), kbd('j')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'a',
                'data-sharp': 'false',
            },
            [text('a'), kbd('m')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'a',
                'data-sharp': 'true',
            },
            [text('a#'), kbd('k')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'b',
                'data-sharp': 'false',
            },
            [text('b'), kbd('l')]
        ),
    ];

    function updateNote() {
        if (currentNote !== null && currentOctave === null) currentOctave = 4;
        if (currentNote === null && currentOctave !== null) currentNote = 'c';
        if (currentOctave === null || currentNote === null)
            delete data[channel - 1][selectedNote];
        else
            data[channel - 1][selectedNote] = {
                sharp: sharp,
                octave: currentOctave,
                sound: currentNote,
            };

        if (currentOctave === null || currentNote === null)
            currentlyRenderedDiv.children[channel - 1].children[
                selectedNote
            ].textContent = '';
        else
            currentlyRenderedDiv.children[channel - 1].children[
                selectedNote
            ].textContent = `${currentNote.toLowerCase()}${currentOctave}${
                sharp ? '#' : ''
            }`;

        if (currentNote !== null && currentOctave !== null)
            loadMusic().then(() =>
                playSound(
                    {
                        sound: currentNote!,
                        octave: currentOctave!,
                        sharp: sharp,
                    },
                    instruments[channel - 1],
                    0.5,
                    0.5
                ).then(unloadMusic)
            );

        octave.textContent = currentOctave?.toString() || '';
        if (currentOctave === 0) octaveDown.setAttribute('disabled', '');
        else octaveDown.removeAttribute('disabled');
        if (currentOctave === 8) octaveUp.setAttribute('disabled', '');
        else octaveUp.removeAttribute('disabled');
        instrumentSelector.value = instruments[channel - 1];
        updateDataOut();
    }

    instrumentSelector.addEventListener('change', () => {
        loadMusic().then(() =>
            playSound(
                {
                    sharp: false,
                    octave: 4,
                    sound: 'c',
                },
                (instrumentSelector.value || 'square-wave') as 'square-wave',
                0.5,
                0.25
            ).then(unloadMusic)
        );

        instruments[channel - 1] = (instrumentSelector.value ||
            'square-wave') as 'square-wave';
        updateNote();
    });

    clearBtnCur.addEventListener('click', () => {
        sharp = false;
        currentNote = null;
        currentOctave = null;
        updateNote();
    });

    clearBtnChan.addEventListener('click', () => {
        data[channel - 1] = [];
        sharp = false;
        currentNote = null;
        currentOctave = null;
        updateNote();
        for (let i = 0; i < length; ++i)
            currentlyRenderedDiv.children[channel - 1].children[i].textContent =
                '';
    });

    clearBtnAll.addEventListener('click', () => {
        data = [[], [], [], []];
        sharp = false;
        currentNote = null;
        currentOctave = null;
        channel = 1;
        selectedNote = 0;
        rerender();
        updateNote();
    });

    octaveDown.addEventListener('click', () => {
        if (currentOctave === null) currentOctave = 4;
        else if (currentOctave > 0) currentOctave--;
        updateNote();
    });
    octaveUp.addEventListener('click', () => {
        if (currentOctave === null) currentOctave = 4;
        else if (currentOctave < 8) currentOctave++;
        updateNote();
    });

    for (const n of noteSelects) {
        n.addEventListener('click', () => {
            if (n.hasAttribute('disabled')) return;
            currentNote = n.getAttribute('data-key') as 'c';
            sharp = n.getAttribute('data-sharp') === 'true';
            updateNote();
        });
    }

    let isPlaying = false;

    async function playPause() {
        if (isPlaying) {
            isPlaying = false;
            playBtn.textContent = 'play';
            return;
        }
        isPlaying = true;
        playBtn.textContent = 'stop';
        let speed = Number(speedInput.value);
        if (isNaN(speed) || !isFinite(speed) || speed <= 1) speed = 0.5;
        else speed /= 1000;

        for (let i = 0; i < length; ++i) {
            if (!isPlaying) return;
            if (data[0][i]) playSound(data[0][i], instruments[0], 0.5, speed);
            if (data[1][i]) playSound(data[1][i], instruments[1], 0.5, speed);
            if (data[2][i]) playSound(data[2][i], instruments[2], 0.5, speed);
            if (data[3][i]) playSound(data[3][i], instruments[3], 0.5, speed);
            await sleep(speed * 1000);
        }

        isPlaying = false;
        playBtn.textContent = 'Play';
    }
    playBtn.addEventListener('click', playPause);

    const keyToNote: Record<string, [boolean, Sound['sound']]> = {
        d: [false, 'c'],
        c: [true, 'c'],
        f: [false, 'd'],
        v: [true, 'd'],
        g: [false, 'e'],
        b: [false, 'f'],
        h: [true, 'f'],
        n: [false, 'g'],
        j: [true, 'g'],
        m: [false, 'a'],
        k: [true, 'a'],
        l: [false, 'b'],
    };

    window.addEventListener('keydown', (ev) => {
        if (
            lastSelected !== 'music' ||
            ev.target instanceof HTMLInputElement ||
            ev.target instanceof HTMLOptionElement ||
            ev.target instanceof HTMLSelectElement ||
            ev.target instanceof HTMLTextAreaElement
        )
            return;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
            currentlyRenderedDiv.children[channel - 1].children[
                selectedNote
            ].classList.remove('active');
            if (ev.key === 'ArrowLeft')
                if (selectedNote <= 0) selectedNote = length - 1;
                else selectedNote--;
            else if (true)
                if (selectedNote >= length - 1) selectedNote = 0;
                else selectedNote++;
            currentlyRenderedDiv.children[channel - 1].children[
                selectedNote
            ].classList.add('active');
            if (data[channel - 1][selectedNote]) {
                currentNote = data[channel - 1][selectedNote].sound;
                currentOctave = data[channel - 1][selectedNote].octave;
                sharp = data[channel - 1][selectedNote].sharp;
            } else {
                currentNote = null;
                currentOctave = null;
                sharp = false;
            }
            updateNote();
            ev.preventDefault();
        } else if (ev.key === 'ArrowUp') {
            if (!ev.altKey) {
                if (currentOctave === null) currentOctave = 4;
                else if (currentOctave < 8) currentOctave++;
            } else {
                currentlyRenderedDiv.children[channel - 1].classList.remove(
                    'active'
                );
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                if (channel === 1) channel = 4;
                else channel--;
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.add('active');
                currentlyRenderedDiv.children[channel - 1].classList.add(
                    'active'
                );
                if (!data[channel - 1][selectedNote]) {
                    sharp = false;
                    currentNote = null;
                    currentOctave = null;
                } else {
                    sharp = data[channel - 1][selectedNote].sharp;
                    currentNote = data[channel - 1][selectedNote].sound;
                    currentOctave = data[channel - 1][selectedNote].octave;
                }
            }
            updateNote();
            ev.preventDefault();
        } else if (ev.key === 'ArrowDown') {
            if (!ev.altKey) {
                if (currentOctave === null) currentOctave = 4;
                else if (currentOctave > 0) currentOctave--;
            } else {
                currentlyRenderedDiv.children[channel - 1].classList.remove(
                    'active'
                );
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.remove('active');
                if (channel === 4) channel = 1;
                else channel++;
                currentlyRenderedDiv.children[channel - 1].classList.add(
                    'active'
                );
                currentlyRenderedDiv.children[channel - 1].children[
                    selectedNote
                ].classList.add('active');
                if (!data[channel - 1][selectedNote]) {
                    sharp = false;
                    currentNote = null;
                    currentOctave = null;
                } else {
                    sharp = data[channel - 1][selectedNote].sharp;
                    currentNote = data[channel - 1][selectedNote].sound;
                    currentOctave = data[channel - 1][selectedNote].octave;
                }
            }
            updateNote();
            ev.preventDefault();
        } else if (keyToNote[ev.key]) {
            sharp = keyToNote[ev.key][0];
            currentNote = keyToNote[ev.key][1];
            updateNote();
            ev.preventDefault();
        } else if (ev.key === ' ') {
            playPause();
            ev.preventDefault();
        } else if (ev.key === 'Escape') {
            currentNote = null;
            currentOctave = null;
            sharp = false;
            updateNote();
            ev.preventDefault();
        } else if (ev.key === '+' || ev.key === '-') {
            let newVal = Math.floor(Number(lengthInput.value));
            if (isNaN(newVal)) newVal = 16;
            else if (newVal < 1) newVal = 1;
            else if (newVal > 255) newVal = 255;
            if (ev.key === '-' && newVal > 1) newVal--;
            else if (ev.key === '+' && newVal < 255) newVal++;
            lengthInput.value = newVal.toString();

            if (newVal < 0) {
                lengthInput.value = '0';
                newVal = 0;
            }
            if (newVal > 255) {
                lengthInput.value = '255';
                newVal = 255;
            }
            length = newVal;
            rerender();
        }
    });

    const loadBtn = textButton(
        {
            style: 'margin-left:auto;margin-right:.5rem;width:3rem',
            class: 'audio-load-btn',
        },
        [text('load')]
    );

    element.append(
        h('div', { class: 'row' }, [
            h('div', { class: 'keyboard' }, noteSelects),
            dataOutEl,
        ]),
        loadBtn
    );

    loadBtn.addEventListener('click', () => {
        const audio = parseAudio(dataOutEl.value.toLowerCase());
        length = audio.length;
        lengthInput.value = length.toString();
        instruments[0] = audio.channel1instrument;
        instruments[1] = audio.channel2instrument;
        instruments[2] = audio.channel3instrument;
        instruments[3] = audio.channel4instrument;
        channel = 1;
        instrumentSelector.value = instruments[channel - 1];
        selectedNote = 0;
        data[0] = [];
        data[1] = [];
        data[2] = [];
        data[3] = [];
        for (let i = 0; i < length; ++i) {
            const sound1 = getSound(audio.channel1[i]);
            const sound2 = getSound(audio.channel2[i]);
            const sound3 = getSound(audio.channel3[i]);
            const sound4 = getSound(audio.channel4[i]);
            if (sound1) data[0][i] = sound1;
            if (sound2) data[1][i] = sound2;
            if (sound3) data[2][i] = sound3;
            if (sound4) data[3][i] = sound4;
        }
        currentOctave = null;
        currentNote = null;
        sharp = false;
        if (data[0][0]) {
            currentOctave = data[0][0].octave;
            currentNote = data[0][0].sound;
            sharp = data[0][0].sharp;
        }
        rerender();
        updateNote();
    });

    function stringifySound(sound: Sound | undefined): string {
        if (!sound) return '   ';
        else
            return (
                sound.sound +
                sound.octave.toString() +
                (sound.sharp ? '#' : ' ')
            );
    }

    function updateDataOut() {
        let channel1: string = '';
        let channel2: string = '';
        let channel3: string = '';
        let channel4: string = '';

        for (let i = 0; i < length; ++i) {
            channel1 += stringifySound(data[0][i]);
            channel2 += stringifySound(data[1][i]);
            channel3 += stringifySound(data[2][i]);
            channel4 += stringifySound(data[3][i]);
        }
        channel1 = channel1.replaceAll(/(   )+$/g, '');
        channel2 = channel2.replaceAll(/(   )+$/g, '');
        channel3 = channel3.replaceAll(/(   )+$/g, '');
        channel4 = channel4.replaceAll(/(   )+$/g, '');
        dataOutEl.value = `${length}:${instruments.join(
            ':'
        )}:${channel1}:${channel2}:${channel3}:${channel4}`;
    }
}
function setupEditor() {
    const element = document.getElementsByClassName('editor')[0];
    if (!element) return;
    element.addEventListener('mousedown', () => (lastSelected = 'editor'));
    const compileBtn = textButton({}, [text('compile')]);
    const downloadBtn = textButton({}, [text('download')]);
    const saveBtn = textButton({}, [text('save')]);
    const saveText = h('h4', { style: 'margin-right: .25rem;color: #a3a3a3' }, [
        text('changes saved'),
    ]);
    const loadingText = h('h2', { style: 'font-family: var(--font)' }, [
        text('loading...'),
    ]);
    const editor = h('div', { class: 'meditor' }, [loadingText]);
    element.append(
        h('div', { class: 'row el-titlebar' }, [
            h('h2', { style: 'margin-right: auto' }, [text('code editor')]),
            h('h4', { style: 'margin-right: auto' }, [text('game.ts')]),
            saveText,
            saveBtn,
            compileBtn,
            downloadBtn,
        ]),
        editor
    );

    (require as any)(['vs/editor/editor.main'], function () {
        try {
            let compiling = false;
            compileAndPopup = async () => {
                if (compiling) return;
                compiling = true;
                compileBtn.setAttribute('disabled', '');
                downloadBtn.setAttribute('disabled', '');
                await compile(getCode()).then((code) =>
                    code ? openPopup(code) : null
                );

                compileBtn.removeAttribute('disabled');
                downloadBtn.removeAttribute('disabled');
                compiling = false;
            };
            compileBtn.addEventListener('click', compileAndPopup);
            compileAndDownload = async () => {
                if (compiling) return;
                compiling = true;
                compileBtn.setAttribute('disabled', '');
                downloadBtn.setAttribute('disabled', '');
                await compile(getCode()).then((val) => {
                    if (!val) return;
                    download('data:javascript;base64,' + btoa(val), 'game.js');
                });

                compileBtn.removeAttribute('disabled');
                downloadBtn.removeAttribute('disabled');
                compiling = false;
            };
            downloadBtn.addEventListener('click', compileAndDownload);
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                lib: ['ES2015', 'Promise'],
                allowNonTsExtensions: true,
            });
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                lib: ['ES2015', 'Promise'],
                allowNonTsExtensions: true,
            });

            const monacoEditor = monaco.editor.create(editor, {
                language: 'typescript',
                automaticLayout: true,
                theme: 'vs-dark',
                value: localStorage.getItem('code') || '',
            });
            getCode = () => monacoEditor.getValue();
            let timeoutId = 0;
            function queueSave() {
                saveText.textContent = 'unsaved changes';
                clearTimeout(timeoutId);
                setTimeout(saveBtnEvent, 5000);
            }
            monacoEditor.onKeyUp(queueSave);
            monacoEditor.onDidPaste(queueSave);
            monacoEditor.onDidBlurEditorWidget(() => {
                clearTimeout(timeoutId);
                saveBtnEvent();
            });
            const saveBtnEvent = async () => {
                saveText.textContent = 'saving...';
                localStorage.setItem('code', monacoEditor.getValue());
                saveText.textContent = 'changes saved';
            };
            saveBtn.addEventListener('click', saveBtnEvent);

            monacoEditor.addAction({
                id: 'save',
                run: saveBtnEvent,
                label: 'Save Code',
            });
            monacoEditor.addAction({
                id: 'download',
                run: compileAndDownload,
                label: 'Download Compiled Game',
            });
            monacoEditor.addAction({
                id: 'compile',
                run: compileAndPopup,
                label: 'Compile Code',
            });
            let disposeMasks =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type validmaskpath = never',
                    'defaults-masks.d.ts'
                ).dispose;
            let disposeAudios =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type validaudiopath = never',
                    'defaults-audios.d.ts'
                ).dispose;
            let disposeImages =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type validimagepath = never',
                    'defaults-images.d.ts'
                ).dispose;
            let disposeTexts =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type validstringpath = never',
                    'defaults-strings.d.ts'
                ).dispose;
            let disposeAnimations =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type validanimationspath = never',
                    'defaults-animations.d.ts'
                ).dispose;
            updateMasks = function (masks) {
                disposeMasks();
                disposeMasks =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type validmaskpath = ' +
                            (masks.length < 1
                                ? 'never'
                                : masks
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-masks.d.ts'
                    ).dispose;
            };
            updateAudios = function (audios) {
                disposeAudios();
                disposeAudios =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type validaudiopath = ' +
                            (audios.length < 1
                                ? 'never'
                                : audios
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-audios.d.ts'
                    ).dispose;
            };
            updateImages = function (images) {
                disposeImages();
                disposeImages =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type validimagepath = ' +
                            (images.length < 1
                                ? 'never'
                                : images
                                      .filter(
                                          (el) => !el.startsWith('__screenshot')
                                      )
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-images.d.ts'
                    ).dispose;
            };
            updateTexts = function (texts) {
                disposeTexts();
                disposeTexts =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type validstringpath = ' +
                            (texts.length < 1
                                ? 'never'
                                : texts
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-strings.d.ts'
                    ).dispose;
            };
            updateAnimations = function (animations) {
                disposeAnimations();
                disposeAnimations =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type validanimationspath = ' +
                            (animations.length < 1
                                ? 'never'
                                : animations
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-animations.d.ts'
                    ).dispose;
            };
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                globals,
                'globals.d.ts'
            );
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                'declare function getimage(path: validimagepath): image;\ndeclare function getmask(path: validmaskpath): imagemask;\ndeclare function getaudio(path: validaudiopath): audio;\ndeclare function getstring(path: validstringpath): string;\ndeclare function getanimation(path: validanimationspath): Animation<string|image|imagemask>;',
                'utils.d.ts'
            );
            editorPostInit();
            loadingText.remove();
        } catch (e) {
            console.error(e);
            if (loadingText.isConnected)
                loadingText.replaceWith(
                    h('pre', {}, [
                        text(
                            'error while loading!\n' +
                                (
                                    '' +
                                    (e?.stack || e?.message || e?.name || e)
                                ).toLowerCase()
                        ),
                    ])
                );
        }
    });
}
function setupDataManager() {
    const element = document.getElementsByClassName('data')[0];
    if (!element) return;
    element.addEventListener('mousedown', () => (lastSelected = 'data'));

    let images: Record<string, string> = {};
    let masks: Record<string, string> = {};
    let audios: Record<string, string> = {};
    let texts: Record<string, string> = {};
    let animations: Record<string, AnimationData> = {};

    getImages = () => images;
    getMasks = () => masks;
    getAudios = () => audios;
    getTexts = () => texts;
    getAnimations = () => animations;

    editorPostInit = () => {
        updateMasks(Object.keys(masks));
        updateImages(Object.keys(images));
        updateAudios(Object.keys(audios));
        updateTexts(Object.keys(texts));
        updateAnimations(Object.keys(animations));
    };
    //#region loading
    try {
        const n = JSON.parse(localStorage.getItem('images') || '');
        if (!n || typeof n !== 'object') throw '';
        images = n;
    } catch {}
    try {
        const n = JSON.parse(localStorage.getItem('masks') || '');
        if (!n || typeof n !== 'object') throw '';
        masks = n;
    } catch {}
    try {
        const n = JSON.parse(localStorage.getItem('audios') || '');
        if (!n || typeof n !== 'object') throw '';
        audios = n;
    } catch {}
    try {
        const n = JSON.parse(localStorage.getItem('texts') || '');
        if (!n || typeof n !== 'object') throw '';
        texts = n;
    } catch {}
    try {
        const n = JSON.parse(localStorage.getItem('texts') || '');
        if (!n || typeof n !== 'object') throw '';
        texts = n;
    } catch {}
    try {
        const n = JSON.parse(localStorage.getItem('animations') || '');
        if (!n || typeof n !== 'object') throw '';
        animations = n;
    } catch {}
    //#endregion
    function sync() {
        localStorage.setItem('images', JSON.stringify(images));
        localStorage.setItem('masks', JSON.stringify(masks));
        localStorage.setItem('audios', JSON.stringify(audios));
        localStorage.setItem('texts', JSON.stringify(texts));
        localStorage.setItem('animations', JSON.stringify(animations));
        updateMasks(Object.keys(masks));
        updateImages(Object.keys(images));
        updateAudios(Object.keys(audios));
        updateTexts(Object.keys(texts));
        updateAnimations(Object.keys(animations));
    }
    //#region images
    const addImageBtn = textButton({ style: 'margin-left: auto' }, [
        text('add'),
    ]);
    element.append(
        h('h2', {}, [text('data manager')]),
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('images')]),
            addImageBtn,
        ])
    );

    const imagesElement = h('div', {}, []);
    element.append(imagesElement);

    const idataEl = document.getElementsByClassName(
        'img-data-input'
    )[0] as HTMLTextAreaElement;
    const iloadBtn = document.getElementsByClassName(
        'img-load-btn'
    )[0] as HTMLTextAreaElement;
    if (!idataEl) return alert('No img data element found!');
    if (!iloadBtn) return alert('No img load btn found!');

    addImage = function generateImageBtn(name?: string, data?: string) {
        if (!name) name = prompt('Name (at least 2 character):') || '';
        if (!name || name?.length < 2)
            return alert(
                'You either exited or gave a name of less than 2 characters!'
            );
        if (!data) data = idataEl.value;
        if (!data) return alert('Error: No data found!');
        images[name] = data;
        sync();
        const overwriteBtn = textButton({ style: 'margin-left: auto;' }, [
            text('overwrite'),
        ]);
        const removeBtn = textButton({}, [text('remove')]);
        const loadBtn = textButton({}, [text('load')]);
        const el = h('div', { class: 'row' }, [
            h('h4', {}, [text(name)]),
            overwriteBtn,
            removeBtn,
            loadBtn,
        ]);

        loadBtn.addEventListener('click', () => {
            idataEl.value = images[name!];
            iloadBtn.click();
        });

        overwriteBtn.addEventListener('click', () => {
            if (confirm('Do you want to overwrite ' + name)) {
                const data = idataEl.value;
                if (!data) return alert('Error: No data found!');
                images[name!] = data;
                sync();
            }
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Do you want to remove ' + name)) {
                el.remove();
                delete images[name!];
                sync();
            }
        });

        imagesElement.append(el);
        return el;
    };

    for (const [k, v] of Object.entries(images)) addImage(k, v);

    addImageBtn.addEventListener('click', () => addImage());
    //#endregion
    //#region masks
    const addMaskBtn = textButton({ style: 'margin-left: auto' }, [
        text('add'),
    ]);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('masks')]),
            addMaskBtn,
        ])
    );

    const maskElement = h('div', {}, []);
    element.append(maskElement);

    const mdataEl = document.getElementsByClassName(
        'mask-data-input'
    )[0] as HTMLTextAreaElement;
    const mloadBtn = document.getElementsByClassName(
        'mask-load-btn'
    )[0] as HTMLTextAreaElement;
    if (!mdataEl) return alert('No img data element found!');
    if (!mloadBtn) return alert('No img load btn found!');

    function generateMaskBtn(name?: string, data?: string) {
        if (!name) name = prompt('Name (at least 2 character):') || '';
        if (!name || name?.length < 2)
            return alert(
                'You either exited or gave a name of less than 2 characters!'
            );
        if (!data) data = mdataEl.value;
        if (!data) return alert('Error: No data found!');
        masks[name] = data;
        sync();
        const overwriteBtn = textButton({ style: 'margin-left: auto;' }, [
            text('overwrite'),
        ]);
        const removeBtn = textButton({}, [text('remove')]);
        const loadBtn = textButton({}, [text('load')]);
        const el = h('div', { class: 'row' }, [
            h('h4', {}, [text(name)]),
            overwriteBtn,
            removeBtn,
            loadBtn,
        ]);

        loadBtn.addEventListener('click', () => {
            mdataEl.value = masks[name!];
            mloadBtn.click();
        });

        overwriteBtn.addEventListener('click', () => {
            if (confirm('Do you want to overwrite ' + name)) {
                const data = mdataEl.value;
                if (!data) return alert('Error: No data found!');
                masks[name!] = data;
                sync();
            }
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Do you want to remove ' + name)) {
                el.remove();
                delete masks[name!];
                sync();
            }
        });

        maskElement.append(el);
        return el;
    }

    for (const [k, v] of Object.entries(masks)) generateMaskBtn(k, v);

    addMaskBtn.addEventListener('click', () => generateMaskBtn());
    //#endregion
    //#region audios
    const addAudioBtn = textButton({ style: 'margin-left: auto' }, [
        text('add'),
    ]);
    const audioElement = h('div', {}, []);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('audio')]),
            addAudioBtn,
        ]),
        audioElement
    );

    const adataEl = document.getElementsByClassName(
        'audio-data-input'
    )[0] as HTMLTextAreaElement;
    const aloadBtn = document.getElementsByClassName(
        'audio-load-btn'
    )[0] as HTMLTextAreaElement;
    if (!adataEl) return alert('No img data element found!');
    if (!aloadBtn) return alert('No img load btn found!');

    function generateAudioBtn(name?: string, data?: string) {
        if (!name) name = prompt('Name (at least 2 character):') || '';
        if (!name || name?.length < 2)
            return alert(
                'You either exited or gave a name of less than 2 characters!'
            );
        if (!data) data = adataEl.value;
        if (!data) return alert('Error: No data found!');
        audios[name] = data;
        sync();
        const overwriteBtn = textButton({ style: 'margin-left: auto;' }, [
            text('overwrite'),
        ]);
        const removeBtn = textButton({}, [text('remove')]);
        const loadBtn = textButton({}, [text('load')]);
        const el = h('div', { class: 'row' }, [
            h('h4', {}, [text(name)]),
            overwriteBtn,
            removeBtn,
            loadBtn,
        ]);

        loadBtn.addEventListener('click', () => {
            adataEl.value = audios[name!];
            aloadBtn.click();
        });

        overwriteBtn.addEventListener('click', () => {
            if (confirm('Do you want to overwrite ' + name)) {
                const data = adataEl.value;
                if (!data) return alert('Error: No data found!');
                audios[name!] = data;
                sync();
            }
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Do you want to remove ' + name)) {
                el.remove();
                delete audios[name!];
                sync();
            }
        });

        audioElement.append(el);
        return el;
    }

    for (const [k, v] of Object.entries(audios)) generateAudioBtn(k, v);

    addAudioBtn.addEventListener('click', () => generateAudioBtn());
    //#endregion
    //#region strings
    const addTextBtn = textButton({ style: 'margin-left: auto' }, [
        text('add'),
    ]);
    const textElement = h('div', {}, []);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 3px' }, [text('strings')]),
            addTextBtn,
        ]),
        textElement
    );

    function generateTextBtn(name?: string, data?: string) {
        if (!name) name = prompt('Name (at least 2 character):') || '';
        data ||= prompt('Data') || '';
        if (!data || !name) return;
        texts[name] = data;
        sync();
        const overwriteBtn = textButton({ style: 'margin-left: auto;' }, [
            text('overwrite'),
        ]);
        const peekBtn = textButton({}, [text('peek')]);
        const removeBtn = textButton({}, [text('remove')]);
        const el = h('div', { class: 'row' }, [
            h('h4', {}, [text(name)]),
            overwriteBtn,
            removeBtn,
            peekBtn,
        ]);

        overwriteBtn.addEventListener('click', () => {
            const data = prompt('New Data', texts[name!]);
            if (data === '') {
                if (confirm('Do you want to remove ' + name)) {
                    el.remove();
                    delete texts[name!];
                    sync();
                }
                return;
            }
            if (!data) return;
            texts[name!] = data;
            sync();
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Do you want to remove ' + name)) {
                el.remove();
                delete texts[name!];
                sync();
            }
        });

        peekBtn.addEventListener('click', () => alert(texts[name!]));

        textElement.append(el);
        return el;
    }

    for (const [k, v] of Object.entries(texts)) generateTextBtn(k, v);
    addTextBtn.addEventListener('click', () => generateTextBtn());
    //#endregion
    //#region animations

    const addAnimationsButtons = textButton({ style: 'margin-left: auto' }, [
        text('add'),
    ]);
    const animationsElement = h('div', {}, []);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 3px' }, [text('animations')]),
            addAnimationsButtons,
        ]),
        animationsElement
    );

    function generateAnimationsBtn(name?: string, data?: AnimationData) {
        if (!name) name = prompt('Name (at least 2 character):') || '';
        data ||= getAnimation();
        if (!data || !name) return;
        animations[name] = data;
        sync();
        const overwriteBtn = textButton({ style: 'margin-left: auto;' }, [
            text('overwrite'),
        ]);
        const loadBtn = textButton({}, [text('load')]);
        const removeBtn = textButton({}, [text('remove')]);
        const el = h('div', { class: 'row' }, [
            h('h4', {}, [text(name)]),
            overwriteBtn,
            removeBtn,
            loadBtn,
        ]);

        overwriteBtn.addEventListener('click', () => {
            if (!confirm('Do you want to overwrite ' + name)) return;
            const data = getAnimation();
            if (!data) return;
            animations[name!] = data;
            sync();
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Do you want to remove ' + name)) {
                el.remove();
                delete animations[name!];
                sync();
            }
        });

        loadBtn.addEventListener('click', () => {
            if (!animations[name!]) return;
            setAnimation(animations[name!]);
        })

        animationsElement.append(el);
        return el;
    }

    for (const [k, v] of Object.entries(animations)) generateAnimationsBtn(k, v);
    addAnimationsButtons.addEventListener('click', () => generateAnimationsBtn());

    //#endregion
}
function setupMenu() {
    const topbar = document.getElementsByClassName('topbar')[0] as
        | HTMLDivElement
        | undefined;
    if (!topbar) return;
    topbar.addEventListener('click', (ev) => {
        if (
            !(ev.target instanceof HTMLDivElement) ||
            (!ev.target.classList.contains('button-menu') &&
                !ev.target.hasAttribute('data-menu') &&
                !ev.target.hasAttribute('data-tab'))
        )
            return;
        if (ev.target.dataset.tab) {
            lastSelected = ev.target.dataset.tab as 'data';
            return;
        }
        const item = ev.target.dataset.menu;
        if (!item) return;
        return menuActions[item]?.(ev, ev.target);
    });
    const loadFileInput = topbar.getElementsByClassName('menu-load-file')[0] as
        | HTMLInputElement
        | undefined;
    loadFileInput?.addEventListener('change', (ev) => {
        if (!loadFileInput) return;
        if (
            loadFileInput.files &&
            loadFileInput.files.length > 0 &&
            loadFileInput.files.item(0)
        ) {
            loadFileInput.files
                .item(0)
                ?.text()
                .then((val) => b64DecodeUnicode(val))
                .then((val) => deserialize(val))
                .then(() => location.reload());
        }
    });
    const tabs = Object.values(
        document.querySelectorAll('[data-tab]')
    ) as HTMLDivElement[];
    function render() {
        for (let i = 0; i < tabs.length; ++i)
            if (tabs[i].dataset.tab === lastSelected)
                tabs[i].classList.add('selected');
            else tabs[i].classList.remove('selected');
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
function setupUtils() {
    const element = document.getElementsByClassName('utils')[0];
    if (!element) return;
    const textarea = h(
        'textarea',
        { style: 'flex-grow: 1;height: 20vh' },
        []
    ) as HTMLTextAreaElement;
    const submit = textButton({}, [text('process')]);
    const colorselect = h(
        'select',
        { style: 'color:' + defaultPalette[0] + ';background-color:#fff;' },
        []
    ) as HTMLSelectElement;
    for (let i = 0; i < defaultPalette.length; ++i) {
        const col = getColor(i);
        colorselect.append(
            h(
                'option',
                {
                    value: '' + defaultPalette[i],
                    style:
                        'color:' +
                        defaultPalette[i] +
                        (col.r + col.g + col.b < 127 * 2
                            ? ';background-color:#fff;'
                            : ';background-color:#181425'),
                },
                [text('' + defaultPalette[i])]
            )
        );
    }
    const lowercasebtn = textButton({}, [text('apply lowercase')]);
    element.append(
        row(
            h('h3', {}, [text('text to image')]),
            submit,
            colorselect,
            lowercasebtn
        ),
        textarea
    );
    colorselect.addEventListener('change', () => {
        colorselect.style.color = colorselect.value;
        const col = getColor(colorselect.selectedIndex);
        if (col.r + col.g + col.b < 127 * 2)
            colorselect.style.backgroundColor = '#fff';
        else colorselect.style.backgroundColor = '#181425';
    });
    lowercasebtn.addEventListener(
        'click',
        () => (textarea.value = textarea.value.toLowerCase())
    );
    submit.addEventListener('click', () => {
        const text = textarea.value;
        const width = calculateWidth(text);
        const height = text.split('\n').length * 6;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        customWriteText(text, ctx, 0, 0, Infinity, colorselect.selectedIndex);
        openImagePopup(canvas.toDataURL());
    });
}
function setupAnimations() {
    const element = document.getElementsByClassName(
        'animations'
    )[0] as HTMLDivElement;
    if (!element) return;
    element.addEventListener('mousedown', () => (lastSelected = 'animations'));

    let type: 'image' | 'mask' | 'text' = 'text';
    const typeSelector = h('select', {}, [
        h('option', { value: 'image' }, [text('image')]),
        h('option', { value: 'mask' }, [text('mask')]),
        h('option', { value: 'text', selected: '' }, [text('text')]),
    ]) as HTMLSelectElement;
    const addFrame = textButton({}, [text('add frame')]);
    const removeFrame = textButton({}, [text('remove last frame')]);
    const playButton = textButton({}, [text('play')]);
    let current = h(
        'input',
        { type: 'text', disabled: '', value: 'not playing' },
        []
    ) as HTMLInputElement | HTMLCanvasElement;
    element.append(
        h('h3', {}, [text('animations')]),
        row(h('h3', {}, [text('type:')]), typeSelector, addFrame, removeFrame, playButton),
        current
    );

    getAnimation = () => ({
        type,
        animation: frames.map((el) => ({ ...el })),
    });

    setAnimation = (animation) => {
        type = animation.type;
        while (frames.length) frames.pop();
        frames.push(...animation.animation);
        if (
            (type === 'image' || type === 'mask') &&
            !(current instanceof HTMLCanvasElement)
        ) {
            const node = h(
                'canvas',
                {
                    width: 1,
                    height: 1,
                    style: 'width: 16rem;height: 16rem;',
                },
                []
            ) as HTMLCanvasElement;
            current.replaceWith(node);
            current = node;
            const ctx = node.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, node.width, node.height);
            ctx.imageSmoothingEnabled = false;
            node.style.imageRendering = 'pixelated';
            node.style.backgroundColor = '#fff';
        } else if (type === 'text' && !(current instanceof HTMLInputElement)) {
            const node = h(
                'input',
                { type: 'text', disabled: '', value: 'not playing' },
                []
            ) as HTMLInputElement;
            current.replaceWith(node);
            current = node;
        }
        rerender();
    };

    typeSelector.addEventListener('change', () => {
        type = typeSelector.value as typeof type;
        while (frames.length) frames.pop();
        if (
            (type === 'image' || type === 'mask') &&
            !(current instanceof HTMLCanvasElement)
        ) {
            const node = h(
                'canvas',
                {
                    width: 1,
                    height: 1,
                    style: 'width: 16rem;height: 16rem;',
                },
                []
            ) as HTMLCanvasElement;
            current.replaceWith(node);
            current = node;
            node.style.imageRendering = 'pixelated';
            node.style.backgroundColor = '#fff';
        } else if (type === 'text' && !(current instanceof HTMLInputElement)) {
            const node = h(
                'input',
                { type: 'text', disabled: '', value: 'not playing' },
                []
            ) as HTMLInputElement;
            current.replaceWith(node);
            current = node;
        }
        if (current instanceof HTMLCanvasElement) {
            const ctx = current.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, current.width, current.height);
        }
        rerender();
    });

    let frames: AnimationFrame<string>[] = [];
    let player = new AnimationPlayer(frames);

    player.callback((frame: string) => {
        if (current instanceof HTMLInputElement) return (current.value = frame);
        const str = type === 'mask' ? getMasks()[frame] : getImages()[frame];
        if (!str) return;
        let imgormask: Image | ImageMask =
            type === 'mask' ? parseMask(str) : parseImage(str);
        let sz = Math.max(imgormask.width, imgormask.height);
        if (current.width !== sz) {
            current.width = sz;
            current.height = sz;
        }
        const ctx = current.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, sz, sz);
        if (type === 'mask')
            imgormask = applyImageMask(
                square(imgormask.width, imgormask.height, 0),
                imgormask
            );
        ctx.putImageData(imgToImageData(imgormask), 0, 0);
    });

    function onChange(ev: InputEvent) {
        const el = ev.target;
        if (
            !(el instanceof HTMLInputElement) &&
            !(el instanceof HTMLSelectElement)
        )
            return;
        const index = el.dataset.index as any as number;
        const type = el.dataset.type;
        const value = type === 'value' ? el.value : Number(el.value);
        frames[index][type] = value;
        player.recomputemaxlength();
    }

    playButton.addEventListener('click', () => {
        player.toggleplay();
        playButton.textContent = player.isplaying ? 'stop' : 'play';
        if (!player.isplaying && current instanceof HTMLInputElement)
            current.value = 'not playing';
        if (!player.isplaying && current instanceof HTMLCanvasElement) {
            const ctx = current.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, current.width, current.height);
        }
    });

    function render(): HTMLDivElement {
        player.recomputemaxlength();
        const div = h('div', {}, []) as HTMLDivElement;
        if (type === 'text') {
            for (let i = 0; i < frames.length; ++i) {
                const vali = h(
                        'input',
                        {
                            value: frames[i].value,
                            type: 'text',
                            'data-index': i,
                            'data-type': 'value',
                        },
                        []
                    ),
                    timei = h(
                        'input',
                        {
                            value: frames[i].time,
                            type: 'number',
                            'data-index': i,
                            'data-type': 'time',
                        },
                        []
                    );
                vali.addEventListener('change', onChange);
                timei.addEventListener('change', onChange);
                const el = h('div', { 'data-index': i, class: 'row' }, [
                    vali,
                    timei,
                ]);
                div.append(el);
            }
        } else {
            const options =
                type === 'image'
                    ? Object.keys(getImages())
                    : Object.keys(getMasks());
            if (options.length < 1) return div;
            for (let i = 0; i < frames.length; ++i) {
                if (!options.includes(frames[i].value))
                    frames[i].value = options[0];
                const select = h(
                        'select',
                        { 'data-index': i, 'data-type': 'value' },
                        options.map((el) =>
                            h(
                                'option',
                                {
                                    value: el,
                                    ...(frames[i].value === el
                                        ? { selected: '' }
                                        : {}),
                                },
                                [text(el)]
                            )
                        )
                    ),
                    timeInput = h(
                        'input',
                        {
                            type: 'number',
                            value: frames[i].time,
                            'data-index': i,
                            'data-type': 'time',
                        },
                        []
                    );
                select.addEventListener('change', onChange);
                timeInput.addEventListener('change', onChange);
                div.append(row(select, timeInput));
            }
        }

        return div;
    }
    let currentEl = render();
    element.append(currentEl);

    function rerender() {
        const div = render();
        currentEl.replaceWith(div);
        currentEl = div;
    }

    addFrame.addEventListener(
        'click',
        () => {
            if (type === 'text') {
                frames.push({ value: '', time: 0 });
                rerender();
            } else {
                const opts =
                    type === 'image'
                        ? Object.keys(getImages())
                        : Object.keys(getMasks());
                if (opts.length < 1) return;
                frames.push({
                    time: 0,
                    value: opts[0],
                });
                rerender();
            }
        }
    );
    removeFrame.addEventListener('click', () => {
        if (frames.length < 1) return;
        frames.pop();
        rerender();
    });
}
window.addEventListener('load', () => {
    setupDrawing();
    setupMasking();
    setupMusic();
    setupDataManager();
    setupEditor();
    setupMenu();
    setupUtils();
    setupAnimations();
    document.body
        .getElementsByClassName('keybinds')[0]
        ?.addEventListener('mousedown', () => (lastSelected = 'keybinds'));

    function render() {
        if (lastSelected === 'music') loadMusic();
        for (let i = 0; i < document.body.children.length; ++i) {
            if (!document.body.children[i].hasAttribute('data-name')) continue;
            if (
                document.body.children[i].getAttribute('data-name') !==
                lastSelected
            )
                document.body.children[i].classList.remove('active');
            else document.body.children[i].classList.add('active');
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});

window.addEventListener(
    'keydown',
    (ev) => {
        if (lastSelected === 'compiled' && ev.key === 'F2') {
            const name = `__screenshot-${Date.now()}`;
            const image = stringifyImage({
                width: WIDTH,
                height: HEIGHT,
                buf: memory.subarray(1),
            });
            addImage(name, image);
            ev.preventDefault();
            ev.cancelBubble = true;
            ev.stopPropagation?.();
        }
        if (lastSelected === 'compiled') return;
        if (ev.key === 'n' && ev.altKey)
            menuActions.new(ev as any, undefined as any);
        if (ev.key === 's' && ev.ctrlKey)
            menuActions.save(ev as any, undefined as any);
        if (ev.key === 'o' && ev.ctrlKey)
            menuActions.load(ev as any, undefined as any);
        if (ev.key === 'e' && ev.ctrlKey)
            menuActions.export(ev as any, undefined as any);
        if (ev.key === 't' && ev.altKey && !ev.ctrlKey)
            menuActions.test(ev as any, undefined as any);
        if (ev.key === 't' && ev.altKey && ev.ctrlKey)
            menuActions.compile(ev as any, undefined as any);
        if (
            ev.shiftKey &&
            ev.ctrlKey &&
            (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')
        ) {
            if (
                ev.target instanceof HTMLInputElement ||
                ev.target instanceof HTMLTextAreaElement
            )
                return;
            ev.preventDefault();
            ev.cancelBubble = true;
            ev.stopPropagation?.();
            let index = tabs.indexOf(lastSelected) + tabs.length;
            if (ev.key === 'ArrowRight') index++;
            else index--;
            index %= tabs.length;
            lastSelected = tabs[index];
        }
    },
    { capture: true }
);

function awaitLoad(el: HTMLImageElement): Promise<void> {
    return new Promise((res, rej) => {
        if (el.complete) return res();
        el.addEventListener('load', () => res());
        el.addEventListener('error', rej);
    });
}

export function putImageData(
    ctx: CanvasRenderingContext2D,
    data: ImageData | null,
    x: number,
    y: number
) {
    if (!data) return;
    const bgData = ctx.getImageData(x, y, data.width, data.height);
    blendImageData(bgData, data);
    ctx.putImageData(bgData, x, y);
}

export function blendImageData(data1: ImageData, data2: ImageData) {
    if (data1.height !== data2.height || data1.width !== data2.width)
        throw new Error('Width or height do not match between data1 and data2');

    for (let h = 0; h < data1.height; ++h)
        for (let w = 0; w < data1.width; ++w) {
            const offset = (h * data1.width + w) * 4;
            let r1 = data1.data[offset];
            let g1 = data1.data[offset + 1];
            let b1 = data1.data[offset + 2];

            const r2 = data2.data[offset];
            const g2 = data2.data[offset + 1];
            const b2 = data2.data[offset + 2];
            const a2 = data2.data[offset + 3];

            r1 = (r1 * (255 - a2) + r2 * a2) / 255;
            if (r1 > 255) r1 = 255;
            g1 = (g1 * (255 - a2) + g2 * a2) / 255;
            if (g1 > 255) g1 = 255;
            b1 = (b1 * (255 - a2) + b2 * a2) / 255;
            if (b1 > 255) b1 = 255;

            data1.data[offset] = r1;
            data1.data[offset + 1] = g1;
            data1.data[offset + 2] = b1;
            data1.data[offset + 3] = Math.max(a2, data1.data[offset + 3]);
        }
}

function customWriteText(
    text: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maxWidth: number,
    color?: number
) {
    if (color === undefined) color = 20;
    let origX = x;
    const images = [
        square(1, 5, color),
        square(2, 5, color),
        square(3, 5, color),
        square(4, 5, color),
        square(5, 5, color),
    ];

    for (let i = 0; i < text.length; ++i) {
        if (x > maxWidth || text[i] === '\n') {
            if (text[i] === '\n') {
                x = origX;
                y += 6;
            }
            continue;
        }
        if (text[i] === ' ') {
            x += 4;
            continue;
        }
        const mask = _default[text[i]];
        if (!mask) {
            x += 4;
            console.log('Text: No mask found for "%s"', text[i]);
            continue;
        }
        const data = imgToImageData(
            applyImageMask(images[mask.width - 1], mask)
        );
        putImageData(ctx, data, x, y);
        x += mask.width + 1;
    }
}

async function codeToCartridge(image: string, name: string, author: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 150;
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('your browser does not support use of canvas!');
    const img = h('img', { src: imageDataURI }, []) as HTMLImageElement;
    document.body.append(img);
    await awaitLoad(img);
    img.remove();
    ctx.drawImage(img, 0, 0);

    const parsed = parseImage(image);
    if (parsed.width !== 84 || parsed.height !== 87)
        throw new Error('Image has to be 84x87');
    ctx.putImageData(imgToImageData(square(84, 87, 8))!, 22, 17);
    putImageData(ctx, imgToImageData(parsed), 22, 17);

    customWriteText(
        `${name.toLowerCase()}\nby ${author.toLowerCase()}`,
        ctx,
        22,
        115,
        106
    );
    const data = await fetch(canvas.toDataURL('image/png'))
        .then((res) => res.arrayBuffer())
        .then((buf) => new Uint8Array(buf))
        .then(async (buf) => {
            const compiled = await compile(localStorage.getItem('code') || '');
            if (!compiled) return;
            const newBuf = new Uint8Array(buf.length + compiled.length + 4);
            for (let i = 0; i < buf.length; ++i) newBuf[i] = buf[i];
            for (let i = 0; i < compiled.length; ++i)
                newBuf[i + buf.length] = compiled[i].charCodeAt(0);
            newBuf[newBuf.length - 1] = buf.length & 0xff;
            newBuf[newBuf.length - 2] = (buf.length >> 8) & 0xff;
            newBuf[newBuf.length - 3] = (buf.length >> 16) & 0xff;
            newBuf[newBuf.length - 4] = (buf.length >> 24) & 0xff;
            return newBuf;
        })
        .then((buf) => {
            if (!buf) return;
            let str = '';
            for (let i = 0; i < buf.length; ++i)
                str += String.fromCharCode(buf[i]);

            return str;
        });

    if (!data) throw new Error('Failed to compile');
    return 'data:image/png;base64,' + btoa(data);
}

(window as any).compile = compileTypescript;
