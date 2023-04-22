import { Scene, WIDTH } from 'library';
import { writeText, currentTextMasks } from 'library/textUtils';

export const CharacterScene = new Scene({
    name: 'CharacterScene',
    gameObjects: [],
    afterUpdate(config, scene, dt, ctx) {
        writeText(
            Object.keys(currentTextMasks).join(''),
            ctx,
            10,
            10,
            WIDTH - 20
        );
    },
    beforeInit() {
        return {};
    },
});