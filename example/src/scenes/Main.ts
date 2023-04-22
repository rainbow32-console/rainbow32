import {
    comp,
    GameObject,
    buttons,
    HEIGHT,
    WIDTH,
    Scene,
} from 'library';
import { imgToImageData, parseImage, putImageData } from 'library/imageUtils';
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
    data: ImageData;
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
            data: undefined as any as ImageData,
            selected: 0,
        };
        config.data = imgToImageData(
            parseImage(generateImg(config.canvas))
        ) as ImageData;
        scene.addObject(config.cursor);

        return config;
    },
    beforeUpdate(config, scene, dt, ctx) {
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
            config.data = imgToImageData(
                parseImage(generateImg(canvas))
            ) as ImageData;
        }
        if (buttons.i.down) {
            canvas[
                Math.floor(cursor.transform.position.y / 5) * 40 +
                    Math.floor(cursor.transform.position.x / 5)
            ] = 0xff;
            config.data = imgToImageData(
                parseImage(generateImg(canvas))
            ) as ImageData;
            // download(imgToPng(parseImage(generateImg()), 'image/png'), 'image.png');
        }

        putImageData(ctx, config.data, 0, 0);
        putImageData(
            ctx,
            imgToImageData(
                parseImage('5:5:' + config.selected.toString(32).repeat(25))
            ),
            0,
            HEIGHT - 5
        );
        writeText(
            'Selected: ' +
                config.selected +
                '(' +
                config.selected.toString(32) +
                ')',
            ctx,
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
