import { Scene, WIDTH } from 'library';
import { writeText, currentTextMasks } from 'library/textUtils';

export const CharacterScene = new Scene({
    name: 'CharacterScene',
    gameObjects: [],
    afterUpdate(cfg) {
        writeText(
            Object.keys(currentTextMasks).join(''),
            10,
            10,
            WIDTH - 10
        );
    },
    beforeInit: () => ({}),
});
