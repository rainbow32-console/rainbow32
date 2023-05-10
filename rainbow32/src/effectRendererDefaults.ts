import { createEffect, createRenderer, removeEffect } from './effects';
import {
    defaultPalette,
    getColor,
    jokobah32,
    setCurrentPalette,
    setOffset,
} from './imageUtils';

export const screenshake = createEffect<number>(
    'screenshake',
    (_dt, heaviness, effect) => {
        setOffset(0, 0);
        if (heaviness < 0.1) return removeEffect(effect);
        heaviness *= 10;
        const hh = heaviness * 0.5;
        setOffset(
            Math.floor(Math.random() * heaviness + 1) - hh,
            Math.floor(Math.random() * heaviness + 1) - hh
        );
        effect.value *= 0.95;
    }
);

export const blackwhiteColorRenderer = createRenderer<number>(
    '2bitColorRenderer',
    (_, col, colidx) =>
        col === 0 || col === 0xff ? getColor(0) : getColor(colidx)
);

export const oldColors = createEffect(
    'coldcolors',
    () => setCurrentPalette(jokobah32),
    () => {},
    () => setCurrentPalette(defaultPalette)
);
