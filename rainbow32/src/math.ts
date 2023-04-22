export function lerp(p0: number, p1: number, t: number) {
    if (t > 1) throw new Error('t cannot be above 1');
    if (t < 0) throw new Error('t cannot be below 0');

    return p0 + t * (p1 - p0);
}

export function distance(x: number, y: number): number {
    return Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2));
}