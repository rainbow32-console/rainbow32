import { GameObject, Image, Scene } from 'library';
import { parseImage } from 'library/imageUtils';

function generateImg(color: number): Image {
    return parseImage(`25:45:${color.toString(32).repeat(1125)}`);
}

export const ColorPaletteScene = new Scene({
    name: 'ColorPaletteScene',
    gameObjects: [],
    beforeInit: (scene) => {
        for (let y = 0; y < 4; ++y)
            for (let x = 0; x < 8; ++x) {
                const color = y * 8 + x;
                scene.addObject(
                    new GameObject({
                        name: color.toString(),
                        image: generateImg(color),
                        transform: {
                            position: {
                                x: x * 25,
                                y: y * 45,
                            },
                        },
                    })
                );
            }
        return {};
    },
});
