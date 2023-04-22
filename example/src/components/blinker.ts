import { Component, imageUtils } from '../../../library/index';
const { parseImage } = imageUtils;

export const Blinker = {
    init(cfg, gameObject) {
        const img1 = gameObject.image;
        const img2 = parseImage('0:0:');
        let isActive = false;
        setInterval(() => {
            gameObject.image = isActive ? img1 : img2;
            isActive = !isActive;
        }, cfg?.time || 500);
        return { time: 0 };
    },
} as Component<{ time: number }>;
