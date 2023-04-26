import type { Component } from 'library';
import { buttons, HEIGHT, WIDTH } from 'library';

export const PressWalker: Component<{ x: number; y: number; steps: number; speed: number }> = {
    init({ steps = 5, speed = 1 } = {}) {
        return { x: 0, y: 0, steps, speed };
    },
    update(config, dt, gameObject) {
        const step = config.steps;
        if (buttons.up.down) config.y -= 0.05 * dt * config.speed;
        if (buttons.left.down) config.x -= 0.05 * dt * config.speed;

        if (buttons.down.down) config.y += 0.05 * dt * config.speed;
        if (buttons.right.down) config.x += 0.05 * dt * config.speed;

        gameObject.transform.position.x = Math.round(config.x / step) * step;
        gameObject.transform.position.y = Math.round(config.y / step) * step;

        if (gameObject.transform.position.x > WIDTH - gameObject.image.width)
            config.x = 0;
        if (gameObject.transform.position.x < 0)
            config.x = WIDTH - gameObject.image.width;
        if (gameObject.transform.position.y > HEIGHT - gameObject.image.height)
            config.y = 0;
        if (gameObject.transform.position.y < 0)
            config.y = HEIGHT - gameObject.image.height;

        gameObject.transform.position.x = Math.round(config.x / step) * step;
        gameObject.transform.position.y = Math.round(config.y / step) * step;
    },
    name: 'PressWalker',
};
