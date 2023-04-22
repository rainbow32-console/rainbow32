import { comp, GameObject, Scene } from 'library';
import { circle, square } from 'library/imageUtils';
import { PressWalker } from '../components/pressWalk';

export const OpacityScene = new Scene({
    name: 'OpacityScene',
    gameObjects: [
        new GameObject({
            name: 'a',
            image: circle(26, 10),
            opacity: 0.75,
            transform: {
                position: {
                    x: 200 / 2 - 13,
                    y: 180 / 2 - 13,
                },
            },
        }),
        new GameObject({
            name: 'b',
            image: square(26, 26, 24),
            opacity: 0.5,
            components: [comp(PressWalker, { steps: 1, speed: 0.5 })],
        }),
    ],
    beforeInit: () => ({}),
});
