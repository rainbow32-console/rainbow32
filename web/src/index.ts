import {
    Button,
    getDebugString,
    onLoad,
    Rainbow32ConsoleElementGeneratorOptions,
    Rainbow32ConsoleElements,
    registerEvent,
} from '../../rainbow32/src/index';

let gameTitleH1: HTMLHeadingElement;

function makeBtn(classes: string[], type: Button) {
    const div = document.createElement('div');
    div.style.width = '2.5rem';
    div.style.height = '2.5rem';
    div.style.backgroundColor = '#171717';
    div.style.margin = '3px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.userSelect = 'none';
    div.style.cursor = 'pointer';
    div.style.fontWeight = 'bold';
    div.classList.add(...classes);
    div.textContent =
        type === 'down'
            ? '↓'
            : type === 'left' || type === 'up' || type === 'right'
            ? '↑'
            : type;
    if (type === 'left') div.style.transform = 'rotateZ(-90deg)';
    else if (type === 'right') div.style.transform = 'rotateZ(90deg)';
    return div;
}

export function makeTextBtn(text: string): HTMLDivElement {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.minWidth = '3rem';
    div.style.height = '25px';
    div.style.backgroundColor = '#171717';
    div.style.padding = '0px .5rem';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.userSelect = 'none';
    div.style.cursor = 'pointer';
    div.style.fontWeight = 'bold';
    div.classList.add('__rainbow32_textbutton');

    return div;
}

function genEls(
    opt: Rainbow32ConsoleElementGeneratorOptions
): Rainbow32ConsoleElements {
    const tmpEl = document.createElement('div');

    const canvas = document.createElement('canvas');
    canvas.style.height = opt.canvas.height;
    canvas.style.aspectRatio = opt.canvas.aspectRatio;
    canvas.style.backgroundColor = opt.canvas.bgCol;
    canvas.style.zIndex = opt.canvas.zIndex.toString();
    canvas.style.width = 'auto';
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.bottom = '0px';
    canvas.style.left = '0px';
    canvas.style.right = '0px';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.margin = '0px auto';
    canvas.classList.add(opt.classes.canvas);
    opt.frame.append(canvas);

    if (!opt.withControls)
        return {
            canvas,
            fileInput: document.createElement('input'),
            buttons: {
                down: tmpEl,
                i: tmpEl,
                left: tmpEl,
                o: tmpEl,
                p: tmpEl,
                right: tmpEl,
                start: tmpEl,
                stop: tmpEl,
                u: tmpEl,
                up: tmpEl,
            },
        };

    const content = document.createElement('div');
    opt.frame.append(content);
    content.classList.add('content');

    const gameTitle = document.createElement('h1');
    gameTitleH1 = gameTitle;
    gameTitle.classList.add('gameTitle');
    gameTitle.textContent = 'No game loaded!';
    const buttons = document.createElement('div');
    buttons.classList.add('buttons');

    const moveBtns = document.createElement('div');
    moveBtns.classList.add('moveBtns');

    const btnUp = makeBtn([opt.classes.button, opt.classes.buttons.up], 'up');
    const btnMiddleGroup = document.createElement('div');
    btnMiddleGroup.style.display = 'flex';

    const btnLeft = makeBtn(
        [opt.classes.button, opt.classes.buttons.left],
        'left'
    );
    btnLeft.style.marginRight = 'calc(2.5rem + 9px)';

    const btnRight = makeBtn(
        [opt.classes.button, opt.classes.buttons.right],
        'right'
    );
    btnMiddleGroup.append(btnLeft, btnRight);
    const btnDown = makeBtn(
        [opt.classes.button, opt.classes.buttons.down],
        'down'
    );

    moveBtns.append(btnUp, btnMiddleGroup, btnDown);

    const actionBtns = document.createElement('div');

    const actionBtns1 = document.createElement('div');
    actionBtns1.style.display = 'flex';
    actionBtns1.style.marginLeft = '15px';
    const actionBtns2 = document.createElement('div');
    actionBtns2.style.display = 'flex';

    actionBtns.append(actionBtns1, actionBtns2);
    buttons.append(moveBtns, actionBtns);

    const btnU = makeBtn([opt.classes.button, opt.classes.buttons.u], 'u');
    const btnI = makeBtn([opt.classes.button, opt.classes.buttons.i], 'i');
    const btnO = makeBtn([opt.classes.button, opt.classes.buttons.o], 'o');
    const btnP = makeBtn([opt.classes.button, opt.classes.buttons.p], 'p');

    actionBtns1.append(btnU, btnI);
    actionBtns2.append(btnO, btnP);

    const fileInput = document.createElement('input');
    fileInput.classList.add(opt.classes.fileInput);
    fileInput.id = opt.classes.fileInput;
    fileInput.name = opt.classes.fileInput;
    fileInput.type = 'file';
    fileInput.style.display = 'none';

    const startBtn = makeTextBtn('Start');
    startBtn.classList.add(opt.classes.textButton, opt.classes.buttons.start);

    const stopBtn = makeTextBtn('Stop');
    stopBtn.classList.add(opt.classes.textButton, opt.classes.buttons.stop);

    content.append(gameTitle, buttons, fileInput, startBtn, stopBtn);

    return {
        canvas,
        buttons: {
            up: btnUp,
            down: btnDown,
            left: btnLeft,
            right: btnRight,
            u: btnU,
            i: btnI,
            o: btnO,
            p: btnP,
            start: startBtn,
            stop: stopBtn,
        },
        fileInput,
    };
}

window.addEventListener('load', () => {
    onLoad(document.body, true, genEls);
    const debugDataDiv = document.createElement('div');
    debugDataDiv.classList.add('debug-data');
    const title = document.createElement('h3');
    title.textContent = 'Debug Data';
    const pre = document.createElement('pre');
    pre.textContent = getDebugString();
    debugDataDiv.append(title, pre);
    let previous = Date.now();
    function render(dt: number) {
        pre.textContent = getDebugString();
        pre.textContent += 'FPS: ' + (1000 / (dt - previous)).toFixed(0);
        requestAnimationFrame(render);
        previous = dt;
    }
    requestAnimationFrame(render);
    document.body.append(debugDataDiv);
});

registerEvent('afterLoad', (game) => (gameTitleH1.textContent = game.name));
registerEvent('afterStop', () => (gameTitleH1.textContent = 'No game loaded!'));
