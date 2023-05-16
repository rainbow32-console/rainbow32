import { shouldBreak } from './index';

export interface AnimationFrame<T> {
    time: number;
    value: T;
}

export type Animation<T> = AnimationFrame<T>[];

export function getAnimationFrame<T>(
    animation: Animation<T>,
    timeFromStart: number
): T | undefined {
    if (animation.length < 1) return undefined;
    let maxTime = animation.reduce((a, b) => a + b.time, 0);
    timeFromStart %= maxTime;
    for (let i = 0; i < animation.length; ++i) {
        timeFromStart -= animation[i].time;
        if (timeFromStart < 1) return animation[i].value;
    }
    return animation[animation.length - 1].value;
}

export class AnimationPlayer<T> {
    private ani: Animation<T>;
    private maxLength: number;
    private startTime: number;
    private lastFrame: T | undefined = undefined;
    private cb: ((frame: T) => void) | undefined = undefined;

    constructor(animation: Animation<T>) {
        this.maxLength = animation.reduce((a, b) => a + b.time, 0);
        this.ani = animation;
        this.startTime = -1;
    }

    start() {
        this.startTime = Date.now();
    }

    play() {
        this.startTime = Date.now();
    }

    stop() {
        this.startTime = -1;
    }

    recomputemaxlength() {
        this.maxLength = this.ani.reduce((a, b) => a + b.time, 0);
    }

    getframe(): T | undefined {
        if (this.startTime < 0 || this.ani.length < 1) return undefined;
        let time = Date.now() % this.maxLength;

        for (let i = 0; i < this.ani.length; ++i) {
            time -= this.ani[i].time;
            if (time < 1) return this.ani[i].value;
        }
        return this.ani[this.ani.length - 1].value;
    }

    setanimations(ani: Animation<T>) {
        this.ani = ani;
        this.recomputemaxlength();
        this.stop();
    }

    callback(cb?: ((frame: T) => void) | undefined) {
        if (this.cb === undefined)
            requestAnimationFrame(this.rendererCallback.bind(this));
        this.cb = cb;
    }

    private rendererCallback() {
        if (!this.cb || shouldBreak()) return;
        requestAnimationFrame(this.rendererCallback.bind(this));
        const curFrame = this.getframe();
        if (this.lastFrame !== curFrame) {
            this.lastFrame = curFrame;
            if (curFrame !== undefined) this.cb.call(globalThis, curFrame);
        }
    }

    toggleplay() {
        if (this.isplaying) this.stop();
        else this.start();
    }

    get isplaying() {
        return this.startTime > -1;
    }
}

export class animationBuilder<T> {
    private ani: Animation<T>;

    constructor() {
        this.ani = [];
    }

    addframe(value: T, time: number) {
        this.ani.push({ value, time });
        return this;
    }

    build() {
        return this.ani;
    }
}
