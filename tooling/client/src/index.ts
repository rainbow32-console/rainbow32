import {
    applyImageMask,
    defaultPalette,
    getCurrentPalette,
    Image,
    ImageMask,
    parseImage,
    parseMask,
    square,
    stringifyImage,
    stringifyMask,
} from '../../../rainbow32/src/imageUtils';
import { imageDataURI } from './img';
import {
    Audio,
    getSound,
    Instrument,
    parseAudio,
    playSound,
    Sound,
} from '../../../rainbow32/src/audioUtils';
import { download, sleep } from '../../../rainbow32/src/utils';
import globals from './globals';
import {
    getDebugString,
    loadGameByContents,
    onLoad,
    setDbgDataCollection,
    unload,
} from '../../../rainbow32/src/index';
import { getCode } from './newCode';
import _default from '../../../rainbow32/src/fonts/default';

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
    attributes: Record<string, string>,
    children: (HTMLElement | Text)[]
): HTMLElement {
    const $el = document.createElement(name);
    for (const [k, v] of Object.entries(attributes)) $el.setAttribute(k, v);
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
            class: 'palette-entry ' + (selected && 'active'),
            style: `background-color: ${color};`,
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

type tab = 'draw' | 'mask' | 'music' | 'keybinds' | 'editor' | 'data';

let lastSelected: 'compiled' | tab = 'draw';

const tabs: tab[] = ['draw', 'mask', 'keybinds', 'music', 'editor', 'data'];

declare var require: any;
declare var monaco: any;
let updateMasks = (newMasks: string[]) => {};
let updateAudios = (newAudios: string[]) => {};
let updateImages = (newImages: string[]) => {};
let editorPostInit = () => {};
let getImages: () => Record<string, string> = () => ({});
let getMasks: () => Record<string, string> = getImages;
let getAudios: () => Record<string, string> = getImages;
let compileAndPopup = () => {};
let compileAndDownload = () => {};

type Requestify<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Uint8Array ? number[] : T[K];
};

function serialize(): string {
    try {
        return JSON.stringify({
            code: localStorage.getItem('code') || '',
            audios: localStorage.getItem('audios') || '{}',
            images: localStorage.getItem('images') || '{}',
            masks: localStorage.getItem('masks') || '{}',
            author: localStorage.getItem('author') || '',
            name: localStorage.getItem('name') || '',
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
                'data:application/octet-stream;base64,' + btoa(serialize()),
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
            const name = prompt('Name', 'My awesome game');
            if (!name) return;
            const author = prompt('Author');
            const color = prompt('Background', '#ffffff');
            if (!color) return;
            localStorage.setItem('code', getCode(color, name));
            localStorage.setItem('audios', '{}');
            localStorage.setItem(
                'images',
                '{"_cartridge": "84:87:' + '8'.repeat(7308) + '"}'
            );
            localStorage.setItem('masks', '{}');
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
                alert(
                    'An image will open in a new tab. This is your game, so save it. Import it like a javascript script, and it should launch.'
                );
                console.log(uri);
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

function createNotification(title: string, description: string, color: string) {
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
async function openImagePopup(url: string) {
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
    const img = h(
        'img',
        {
            src: url,
            style: 'image-rendering: pixelated;height: 100%;',
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
        h('p', {}, [kbd('w'), text('/'), kbd('↑'), text(': Trigger up key')]),
        h('p', {}, [kbd('a'), text('/'), kbd('←'), text(': Trigger left key')]),
        h('p', {}, [kbd('s'), text('/'), kbd('↓'), text(': Trigger down key')]),
        h('p', {}, [
            kbd('d'),
            text('/'),
            kbd('→'),
            text(': Trigger right key'),
        ]),
        h('p', {}, [kbd('u'), text(': Trigger action 1 key')]),
        h('p', {}, [kbd('i'), text(': Trigger action 2 key')]),
        h('p', {}, [kbd('o'), text(': Trigger action 3 key')]),
        h('p', {}, [kbd('p'), text(': Trigger action 4 key')]),
        h('br', {}, []),
        h('h3', {}, [text('Debug Data')]),
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
            'FPS: ' + (1000 / (dt - previous)).toFixed(0);
        requestAnimationFrame(render);
        previous = dt;
    }
    requestAnimationFrame(render);

    function keydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' || ev.key === 'Enter') {
            close();
            ev.cancelBubble = true;
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

function setupDrawing() {
    const drawElement = document.getElementsByClassName('draw')[0];
    if (!drawElement || !(drawElement instanceof HTMLDivElement)) return;
    drawElement.addEventListener('mousedown', () => (lastSelected = 'draw'));

    const palette = makePalette(true, 0);
    drawElement.append(h('h2', {}, [text('Drawing tool')]), palette);
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
    drawElement.append(
        h('div', {}, [
            h('h3', {}, [text('Width:')]),
            widthIn,
            h('h3', {}, [text('Height:')]),
            heightIn,
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
            width: width.toString(),
            height: height.toString(),
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
    const loadBtn = textButton({ class: 'img-load-btn' }, [text('Load')]);
    const clearBtn = textButton({ class: 'img-clear-btn' }, [text('Clear')]);
    drawElement.append(
        canvas,
        h('div', { class: 'row', style: 'align-items: flex-end' }, [
            dataEl,
            h('div', { class: 'row' }, [loadBtn, clearBtn]),
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
    clearBtn.addEventListener('click', () => {
        width = 16;
        height = 16;
        widthIn.value = '16';
        heightIn.value = '16';
        data = [];
        updateCanvas();
    });
    function updateCanvas() {
        canvas.width = width;
        canvas.height = height;
        const image: Image = {
            height,
            width,
            buf: new Uint8Array(width * height),
        };
        for (let h = 0; h < height; ++h)
            for (let w = 0; w < width; ++w)
                image.buf[h * width + w] =
                    data[h * width + w] !== undefined
                        ? data[h * width + w]
                        : 0xff;
        ctx?.putImageData(imgToImageData(image)!, 0, 0);
        dataEl.value = stringifyImage(image);
    }
    updateCanvas();
    canvas.addEventListener('mousemove', (ev) => {
        if (ev.buttons !== 1 && ev.buttons !== 2) return;
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
        if (ev.buttons === 1) data[y * width + x] = selected;
        else delete data[y * width + x];
        updateCanvas();
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
        data[y * width + x] = selected;
        updateCanvas();
    });
    canvas.addEventListener('contextmenu', (ev) => {
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
        delete data[y * width + x];
        updateCanvas();
    });
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
    maskingDiv.append(
        h('h2', {}, [text('Masking Tool')]),
        h('div', {}, [
            h('h3', {}, [text('Width:')]),
            widthIn,
            h('h3', {}, [text('Height:')]),
            heightIn,
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
    let data: boolean[] = [];
    const canvas = h(
        'canvas',
        {
            width: width.toString(),
            height: height.toString(),
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
    const btnClear = h('div', { class: 'text-button' }, [text('Clear')]);
    const btnLoad = h('div', { class: 'text-button mask-load-btn' }, [
        text('Load'),
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
                    data[h * mask.width + w] = true;
        width = mask.width;
        height = mask.height;
        widthIn.value = mask.width.toString();
        heightIn.value = mask.height.toString();
        updateCanvas();
    });

    function updateCanvas() {
        canvas.width = width;
        canvas.height = height;
        const image: Image = {
            height,
            width,
            buf: new Uint8Array(width * height),
        };
        const mask = {
            height,
            width,
            buf: new Uint8Array(Math.ceil((width * height) / 8)),
        };
        for (let h = 0; h < height; ++h)
            for (let w = 0; w < width; ++w) {
                const off = h * width + w;
                image.buf[off] = data[off] ? 0 : 8;
                if (data[off]) mask.buf[Math.floor(off / 8)] |= 1 << off % 8;
            }
        ctx?.putImageData(imgToImageData(image)!, 0, 0);
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
        if (ev.buttons === 1) data[y * width + x] = true;
        else delete data[y * width + x];
        updateCanvas();
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
        data[y * width + x] = true;
        updateCanvas();
    });
    canvas.addEventListener('contextmenu', (ev) => {
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
        delete data[y * width + x];
        updateCanvas();
    });
}
function setupMusic() {
    const element = document.getElementsByClassName('music')[0];
    if (!element) return;
    element.addEventListener('mousedown', () => (lastSelected = 'music'));

    element.append(h('h2', {}, [text('Music editor')]));
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
    const playBtn = h('div', { class: 'text-button' }, [text('Play')]);

    element.append(
        h('div', { class: 'row', style: 'gap: .25rem;' }, [
            h('h3', {}, [text('Channel')]),
            h('h3', {}, [text('Length')]),
            lengthInput,
            h('div', { style: 'flex-grow: 1;' }, []),
            h('h3', {}, [text('Speed (ms)')]),
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
                            ? `${data[0][i].sound.toUpperCase()}${
                                  data[0][i].octave
                              }${data[0][i].halfToneStepUp ? '#' : ''}`
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
                    sharp = data[channel - 1][i].halfToneStepUp;
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
                        ? `${data[1][i].sound.toUpperCase()}${
                              data[1][i].octave
                          }${data[1][i].halfToneStepUp ? '#' : ''}`
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
                    sharp = data[channel - 1][i].halfToneStepUp;
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
                        ? `${data[2][i].sound.toUpperCase()}${
                              data[2][i].octave
                          }${data[2][i].halfToneStepUp ? '#' : ''}`
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
                    sharp = data[channel - 1][i].halfToneStepUp;
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
                        ? `${data[3][i].sound.toUpperCase()}${
                              data[3][i].octave
                          }${data[3][i].halfToneStepUp ? '#' : ''}`
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
                    sharp = data[channel - 1][i].halfToneStepUp;
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

    const clearBtnCur = h('div', { class: 'text-button' }, [text('Clear')]);
    const clearBtnChan = h('div', { class: 'text-button' }, [
        text('Clear Channel'),
    ]);
    const clearBtnAll = h('div', { class: 'text-button' }, [text('Clear All')]);
    const octaveDown = h('div', { class: 'text-button' }, [text('<')]);
    const octaveUp = h('div', { class: 'text-button' }, [text('>')]);
    const octave = h('div', { class: 'text-button-fake' }, [text('')]);
    const instrumentSelector = h('select', { class: 'input-select' }, [
        h('option', { value: 'square-wave', selected: '' }, [
            text('Square Wave'),
        ]),
        h('option', { value: 'sine-wave' }, [text('Sine Wave')]),
        h('option', { value: 'sawtooth-wave' }, [text('Sawtooth Wave')]),
        h('option', { value: 'triangle-wave' }, [text('Triangle Wave')]),
        h('option', { value: 'noise' }, [text('Noise')]),
    ]) as HTMLSelectElement;

    element.append(
        h('h3', {}, [text('Channels')]),
        currentlyRenderedDiv,
        h('div', { class: 'row', style: 'gap:.25rem;' }, [
            clearBtnCur,
            clearBtnChan,
            clearBtnAll,
            h('h3', { style: 'margin-left: 2rem' }, [text('Octave:')]),
            octaveDown,
            octave,
            octaveUp,
            h('div', { style: 'width: 2rem' }, []),
            h('h3', { style: 'margin-left: 2rem' }, [text('Instrument:')]),
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
            [text('C'), kbd('D')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'c',
                'data-sharp': 'true',
            },
            [text('C#'), kbd('C')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'd',
                'data-sharp': 'false',
            },
            [text('D'), kbd('F')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'd',
                'data-sharp': 'true',
            },
            [text('D#'), kbd('V')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'e',
                'data-sharp': 'false',
            },
            [text('E'), kbd('G')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'f',
                'data-sharp': 'false',
            },
            [text('F'), kbd('B')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'f',
                'data-sharp': 'true',
            },
            [text('F#'), kbd('H')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'g',
                'data-sharp': 'false',
            },
            [text('G'), kbd('N')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'g',
                'data-sharp': 'true',
            },
            [text('G#'), kbd('J')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'a',
                'data-sharp': 'false',
            },
            [text('A'), kbd('M')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'a',
                'data-sharp': 'true',
            },
            [text('A#'), kbd('K')]
        ),
        h(
            'div',
            {
                class: 'keyboard-key',
                'data-key': 'b',
                'data-sharp': 'false',
            },
            [text('B'), kbd('L')]
        ),
    ];

    function updateNote() {
        if (currentNote !== null && currentOctave === null) currentOctave = 4;
        if (currentNote === null && currentOctave !== null) currentNote = 'c';
        if (currentOctave === null || currentNote === null)
            delete data[channel - 1][selectedNote];
        else
            data[channel - 1][selectedNote] = {
                halfToneStepUp: sharp,
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
            ].textContent = `${currentNote.toUpperCase()}${currentOctave}${
                sharp ? '#' : ''
            }`;

        if (currentNote !== null && currentOctave !== null)
            playSound(
                {
                    sound: currentNote,
                    octave: currentOctave,
                    halfToneStepUp: sharp,
                },
                instruments[channel - 1],
                0.5,
                0.5
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
        playSound(
            {
                halfToneStepUp: false,
                octave: 4,
                sound: 'c',
            },
            (instrumentSelector.value || 'square-wave') as 'square-wave',
            0.5,
            0.25
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
            playBtn.textContent = 'Play';
            return;
        }
        isPlaying = true;
        playBtn.textContent = 'Stop';
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
                sharp = data[channel - 1][selectedNote].halfToneStepUp;
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
                    sharp = data[channel - 1][selectedNote].halfToneStepUp;
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
                    sharp = data[channel - 1][selectedNote].halfToneStepUp;
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
        [text('Load')]
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
        instruments[0] = audio.channel1Instrument;
        instruments[1] = audio.channel2Instrument;
        instruments[2] = audio.channel3Instrument;
        instruments[3] = audio.channel4Instrument;
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
            sharp = data[0][0].halfToneStepUp;
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
                (sound.halfToneStepUp ? '#' : ' ')
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
    const compileBtn = textButton({}, [text('Compile')]);
    const downloadBtn = textButton({}, [text('Download')]);
    const saveBtn = textButton({}, [text('Save')]);
    const saveText = h('h4', { style: 'margin-right: .25rem;color: #a3a3a3' }, [
        text('Changes Saved'),
    ]);
    const loadingText = h('h2', { style: 'font-family: var(--font)' }, [
        text('Loading...'),
    ]);
    const editor = h('div', { class: 'meditor' }, [loadingText]);
    element.append(
        h('div', { class: 'row el-titlebar' }, [
            h('h2', { style: 'margin-right: auto' }, [text('Code Editor')]),
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
                const stringImgs = getImages();
                const stringMasks = getMasks();
                const stringAudios = getAudios();
                const images: Record<string, Requestify<Image>> = {};
                const masks: Record<string, Requestify<ImageMask>> = {};
                const audios: Record<string, Requestify<Audio>> = {};

                for (const k of Object.keys(stringImgs)) {
                    try {
                        const parsed = parseImage(stringImgs[k]);
                        images[k] = {
                            buf: [...parsed.buf.values()],
                            height: parsed.height,
                            width: parsed.width,
                        };
                    } catch {}
                }
                for (const k of Object.keys(stringMasks)) {
                    try {
                        const parsed = parseMask(stringMasks[k]);
                        masks[k] = {
                            buf: [...parsed.buf.values()],
                            height: parsed.height,
                            width: parsed.width,
                        };
                    } catch {}
                }
                for (const k of Object.keys(stringAudios)) {
                    try {
                        const parsed = parseAudio(stringAudios[k]);
                        audios[k] = {
                            channel1Instrument: parsed.channel1Instrument,
                            channel2Instrument: parsed.channel2Instrument,
                            channel3Instrument: parsed.channel3Instrument,
                            channel4Instrument: parsed.channel4Instrument,
                            length: parsed.length,
                            channel1: [...parsed.channel1.values()],
                            channel2: [...parsed.channel2.values()],
                            channel3: [...parsed.channel3.values()],
                            channel4: [...parsed.channel4.values()],
                        };
                    } catch {}
                }

                await fetch(window.location.origin + '/api/build', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: '\n' + monacoEditor.getValue(),
                        images,
                        masks,
                        audios,
                    }),
                })
                    .then((res) =>
                        !res.ok
                            ? res.text().then((val) => ({ ok: false, val }))
                            : res.text().then((val) => ({ ok: true, val }))
                    )
                    .then(({ ok, val }) => {
                        if (!ok) {
                            console.error(val);
                            createNotification(
                                'Error',
                                'Failed to compile! Check the console (F12/Ctrl+Shift+I)',
                                '#b91c1c'
                            );
                            return;
                        } else {
                            openPopup(val);
                        }
                    })
                    .catch(() => {});

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
                const stringImgs = getImages();
                const stringMasks = getMasks();
                const stringAudios = getAudios();
                const images: Record<string, Requestify<Image>> = {};
                const masks: Record<string, Requestify<ImageMask>> = {};
                const audios: Record<string, Requestify<Audio>> = {};

                for (const k of Object.keys(stringImgs)) {
                    try {
                        const parsed = parseImage(stringImgs[k]);
                        images[k] = {
                            buf: [...parsed.buf.values()],
                            height: parsed.height,
                            width: parsed.width,
                        };
                    } catch {}
                }
                for (const k of Object.keys(stringMasks)) {
                    try {
                        const parsed = parseMask(stringMasks[k]);
                        masks[k] = {
                            buf: [...parsed.buf.values()],
                            height: parsed.height,
                            width: parsed.width,
                        };
                    } catch {}
                }
                for (const k of Object.keys(stringAudios)) {
                    try {
                        const parsed = parseAudio(stringAudios[k]);
                        audios[k] = {
                            channel1Instrument: parsed.channel1Instrument,
                            channel2Instrument: parsed.channel2Instrument,
                            channel3Instrument: parsed.channel3Instrument,
                            channel4Instrument: parsed.channel4Instrument,
                            length: parsed.length,
                            channel1: [...parsed.channel1.values()],
                            channel2: [...parsed.channel2.values()],
                            channel3: [...parsed.channel3.values()],
                            channel4: [...parsed.channel4.values()],
                        };
                    } catch {}
                }

                await fetch(window.location.origin + '/api/build', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: '\n' + monacoEditor.getValue(),
                        images,
                        masks,
                        audios,
                    }),
                })
                    .then((res) =>
                        !res.ok
                            ? res.text().then((val) => ({ ok: false, val }))
                            : res.text().then((val) => ({ ok: true, val }))
                    )
                    .then(({ ok, val }) => {
                        if (!ok) {
                            console.error(val);
                            alert('Failed to compile! Check console!');
                            return;
                        } else {
                            download(
                                'data:javascript;base64,' + btoa(val),
                                'game.js'
                            );
                        }
                    })
                    .catch(() => {});

                compileBtn.removeAttribute('disabled');
                downloadBtn.removeAttribute('disabled');
                compiling = false;
            };
            downloadBtn.addEventListener('click', compileAndDownload);

            const monacoEditor = monaco.editor.create(editor, {
                language: 'typescript',
                automaticLayout: true,
                theme: 'vs-dark',
                value: localStorage.getItem('code') || '',
            });
            let timeoutId = 0;
            function queueSave() {
                saveText.textContent = 'Unsaved changes';
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
                saveText.textContent = 'Saving...';
                localStorage.setItem('code', monacoEditor.getValue());
                saveText.textContent = 'Changes Saved';
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
                    'type ValidMaskPath = never',
                    'defaults-masks.d.ts'
                ).dispose;
            let disposeAudios =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type ValidAudioPath = never',
                    'defaults-audios.d.ts'
                ).dispose;
            let disposeImages =
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    'type ValidImagePath = never',
                    'defaults-images.d.ts'
                ).dispose;
            updateMasks = function (masks) {
                disposeMasks();
                disposeMasks =
                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        'type ValidMaskPath = ' +
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
                        'type ValidAudioPath = ' +
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
                        'type ValidImagePath = ' +
                            (images.length < 1
                                ? 'never'
                                : images
                                      .map((el) => JSON.stringify(el))
                                      .join('|')),
                        'defaults-images.d.ts'
                    ).dispose;
            };
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                globals,
                'globals.d.ts'
            );
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                'declare function getImage(path: ValidImagePath): Image;\ndeclare function getMask(path: ValidMaskPath): ImageMask;\ndeclare function getAudios(path: ValidAudioPath): Audio;',
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
                            'Error while loading!\n' +
                                (e?.stack || e?.message || e?.name || e)
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

    getImages = () => images;
    getMasks = () => masks;
    getAudios = () => audios;

    editorPostInit = () => {
        updateMasks(Object.keys(masks));
        updateImages(Object.keys(images));
        updateAudios(Object.keys(audios));
    };

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

    function sync() {
        localStorage.setItem('images', JSON.stringify(images));
        localStorage.setItem('masks', JSON.stringify(masks));
        localStorage.setItem('audios', JSON.stringify(audios));
        updateMasks(Object.keys(masks));
        updateImages(Object.keys(images));
        updateAudios(Object.keys(audios));
    }

    const addImageBtn = textButton({ style: 'margin-left: auto' }, [
        text('Add'),
    ]);
    element.append(
        h('h2', {}, [text('Data Manager')]),
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('Images')]),
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

    function generateImageBtn(name?: string, data?: string) {
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
            text('Overwrite'),
        ]);
        const removeBtn = textButton({}, [text('Remove')]);
        const loadBtn = textButton({}, [text('Load')]);
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
    }

    for (const [k, v] of Object.entries(images)) generateImageBtn(k, v);

    addImageBtn.addEventListener('click', () => generateImageBtn());

    const addMaskBtn = textButton({ style: 'margin-left: auto' }, [
        text('Add'),
    ]);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('Masks')]),
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
            text('Overwrite'),
        ]);
        const removeBtn = textButton({}, [text('Remove')]);
        const loadBtn = textButton({}, [text('Load')]);
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

    const addAudioBtn = textButton({ style: 'margin-left: auto' }, [
        text('Add'),
    ]);
    element.append(
        h('div', { class: 'line', style: 'margin-top: 7px' }, []),
        h('div', { class: 'row' }, [
            h('h3', { style: 'margin-top: 7px;' }, [text('Audio')]),
            addAudioBtn,
        ])
    );
    const audioElement = h('div', {}, []);
    element.append(audioElement);

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
            text('Overwrite'),
        ]);
        const removeBtn = textButton({}, [text('Remove')]);
        const loadBtn = textButton({}, [text('Load')]);
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
            if (confirm('Do you want to overwrite ' + name)) {
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
window.addEventListener('load', () => {
    setupDrawing();
    setupMasking();
    setupMusic();

    if (location.protocol.startsWith('file')) {
        document.querySelector('[data-name="data"]')?.remove();
        document.querySelector('[data-name="editor"]')?.remove();
        document.getElementsByClassName('topbar')[0]?.remove();
        document.body.style.marginTop = '0';
    } else {
        setupDataManager();
        setupEditor();
        setupMenu();
    }
    document.body
        .getElementsByClassName('keybinds')[0]
        ?.addEventListener('mousedown', () => (lastSelected = 'keybinds'));
    function render() {
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
    maxWidth: number
) {
    let color = 8;
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
        const mask = _default[text[i].toLowerCase()];
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

function compile(code: string): Promise<string | void> {
    return fetch(window.location.origin + '/api/build', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: '\n' + code,
            images: getImages(),
            masks: getMasks(),
            audios: getAudios(),
        }),
    })
        .then((res) =>
            !res.ok
                ? res.text().then((val) => ({ ok: false, val }))
                : res.text().then((val) => ({ ok: true, val }))
        )
        .then(({ ok, val }) => {
            if (!ok) {
                console.error(val);
                createNotification(
                    'Error',
                    'Failed to compile! Check the console (F12/Ctrl+Shift+I)',
                    '#b91c1c'
                );
                return;
            } else return val;
        })
        .catch(() => {});
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

    customWriteText(`${name}\nBy ${author}`, ctx, 22, 115, 106);
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
