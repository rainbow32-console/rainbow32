import { getAnimationFrame } from './animation';
import type {gameobject} from './gameObject';
import { Image, ImageMask } from './imageUtils';

export function download(url: string, filename: string): Promise<void> {
    return fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
        })
        .catch(console.error);
}

const timeouts: Record<string, boolean> = {};

export function isOnTimeout(name: string) {
    return !!timeouts[name];
}

export function timeout(name: string, ms: number) {
    timeouts[name] = true;
    setTimeout(() => (timeouts[name] = false), ms);
}

export function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

export function* filterIterator<T>(
    arr: T[],
    filterFn: (value: T, index: number, arr: T[]) => boolean
): Generator<T, void, void> {
    for (let i = 0; i < arr.length; ++i) {
        if (filterFn(arr[i], i, arr)) yield arr[i];
    }
}

export function* mapIterator<TIn, TOut>(
    arr: TIn[],
    mapFn: (value: TIn, index: number, arr: TIn[]) => TOut
): Generator<TOut, void, void> {
    for (let i = 0; i < arr.length; ++i) {
        yield mapFn(arr[i], i, arr);
    }
}

export function* range(
    start: number,
    end: number
): Generator<number, void, void> {
    if (start < end) for (let i = start; i <= end; ++i) yield i;
    else for (let i = start; i >= end; --i) yield i;
}

export function getCurrentImage(obj: gameobject): Image {
    if (!Array.isArray(obj.image)) return obj.image;
    return getAnimationFrame(obj.image,obj.lifetime)!;
}
export function getCurrentImageMask(obj: gameobject): ImageMask|undefined {
    if (!Array.isArray(obj.mask)) return obj.mask;
    return getAnimationFrame(obj.mask,obj.lifetime);
}