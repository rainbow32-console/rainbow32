import {
    comp,
    GameObject,
    buttons,
    HEIGHT,
    WIDTH,
    Scene,
    Image,
} from 'library';
import { parseImage, putImageRaw } from 'library/imageUtils';
import { readFromFile, storeToFile } from 'library/saveFile';
import { writeText } from 'library/textUtils';
import { Blinker } from '../components/blinker';
import { PressWalker } from '../components/pressWalk';

function generateImg(canvas: number[]) {
    let data: string[] = [];

    for (let h = 0; h < 35; ++h)
        for (let w = 0; w < 40; ++w) {
            const color =
                canvas[h * 40 + w] === 0xff
                    ? ' '
                    : canvas[h * 40 + w].toString(32);
            let offset = h * 1000 /* 5 * 200 */ + w * 5;
            data[offset] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = color;
            data[offset + 4] = color;
            offset += 200;
            data[offset] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = color;
            data[offset + 4] = color;
            offset += 200;
            data[offset] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = color;
            data[offset + 4] = color;
            offset += 200;
            data[offset] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = color;
            data[offset + 4] = color;
            offset += 200;
            data[offset] = color;
            data[offset + 1] = color;
            data[offset + 2] = color;
            data[offset + 3] = color;
            data[offset + 4] = color;
        }

    return `200:175:${data.join('')}`;
}

export const MainScene = new Scene<{
    cursor: GameObject;
    canvas: number[];
    data: Image;
    selected: number;
}>({
    gameObjects: [],
    name: 'MainScene',
    beforeInit(scene) {
        const config = {
            cursor: new GameObject({
                name: 'cursor',
                image: parseImage('5:5:0 0 0 0 0 0 0 0 0 0 0 0 0'),
                components: [comp(Blinker), comp(PressWalker)],
            }),
            canvas:
                readFromFile<number[]>('drawing') ||
                new Array<number>(40 * 35).fill(0xff),
            data: undefined as any as Image,
            selected: 0,
        };
        config.data = parseImage(generateImg(config.canvas));
        scene.addObject(config.cursor);

        return config;
    },
    beforeUpdate(config, scene, dt) {
        const { canvas, cursor } = config;

        if (buttons.o.press) config.selected--;
        if (buttons.p.press) config.selected++;
        if (config.selected > 31) config.selected = 0;
        if (config.selected < 0) config.selected = 31;

        if (buttons.u.down) {
            canvas[
                Math.floor(cursor.transform.position.y / 5) * 40 +
                    Math.floor(cursor.transform.position.x / 5)
            ] = config.selected;
            config.data = parseImage(generateImg(canvas));
        }
        if (buttons.i.down) {
            canvas[
                Math.floor(cursor.transform.position.y / 5) * 40 +
                    Math.floor(cursor.transform.position.x / 5)
            ] = 0xff;
            config.data = parseImage(generateImg(canvas));
            // download(imgToPng(parseImage(generateImg()), 'image/png'), 'image.png');
        }

        putImageRaw(0, 0, config.data);
        putImageRaw(
            0,
            HEIGHT - 5,
            parseImage('5:5:' + config.selected.toString(32).repeat(25))
        );
        writeText(
            'Selected: ' +
                config.selected +
                '(' +
                config.selected.toString(32) +
                ')',
            10,
            HEIGHT - 5,
            WIDTH - 5,
            {
                color: config.selected < 2 ? 8 : 0,
                background: config.selected,
            }
        );
    },
    beforeRemove(config, scene) {
        storeToFile(config.canvas, 'drawing');
    },
});
