export function _getCode(color: string, name: string): string {
    return `const MainScene = new Scene<{}>({
    name: 'Main',
    gameObjects: [],
    beforeInit() {
        return {};
    },
    afterUpdate(_cfg, _scene, _dt) {
        TextUtils.writeText('World', WIDTH / 2, (HEIGHT / 2) + 6, WIDTH);
    }
});

// if something may be running after remove() is called (because it is not called for update, or does not exit before the update call ends), please check that this is still true
let isRunning = false;

registerGame({
    name: ${JSON.stringify(name)},
    bg: ${JSON.stringify(color)},
    defaultScene: 0,
    scenes: [MainScene],
    init() {
        isRunning = true;
    },
    remove() {
        isRunning = false;
    },
    update(_dt) {
        TextUtils.writeText('Hello', WIDTH / 2, HEIGHT / 2, WIDTH);
    }
});`;
}
