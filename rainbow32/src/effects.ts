import { Vec2 } from './gameObject';
import { getColor } from './imageUtils';

const noop = () => {};

interface Effect<T> {
    update(dt: number, val: T, effect: Effect<T> & { value: T }): void;
    init(val: T, effect: Effect<T> & { value: T }): void;
    remove(val: T, effect: Effect<T> & { value: T }): void;
    name: string;
}
type EffectFunction<T> = Effect<T>['update'];

const effects: Record<string, Effect<any> & { value: any }> = {};

export function createEffect<T>(
    name: string,
    update: EffectFunction<T>,
    init?: (val: T, effect: Effect<T> & { value: T }) => void,
    remove?: (val: T, effect: Effect<T> & { value: T }) => void
): Effect<T> {
    return {
        init: init || noop,
        name,
        remove: remove || noop,
        update,
    };
}
export function applyEffect<T>(effect: Effect<T>, value: T) {
    let init = !!effects[effect.name];
    effects[effect.name] = {
        ...effect,
        value,
    };
    if (init) effect.init(value, effects[effect.name]);
}

export function removeEffect(effect: Effect<any> | string) {
    const name = typeof effect === 'string' ? effect : effect.name;
    effects[name].remove(effects[name].value, effects[name]);
    delete effects[name];
}

export function updateEffect(dt: number) {
    for (let key in effects)
        effects[key].update(dt, effects[key].value, effects[key]);
}

///////////////////////////////////////
////                               ////
////           RENDERERS           ////
////                               ////
///////////////////////////////////////

type color = Record<'r' | 'g' | 'b' | 'a', number>;

interface Renderer<T> {
    update(
        realcolor: color,
        color: number,
        pos: Vec2,
        val: T,
        renderer: Renderer<T> & { value: T }
    ): color;
    init(val: T, renderer: Renderer<T> & { value: T }): void;
    remove(val: T, renderer: Renderer<T> & { value: T }): void;
    name: string;
}
type RendererFunction<T> = Renderer<T>['update'];

const renderers: Record<string, Renderer<any> & { value: any }> = {};

export function createRenderer<T>(
    name: string,
    update: RendererFunction<T>,
    init?: (val: T, effect: Renderer<T> & { value: T }) => void,
    remove?: (val: T, effect: Renderer<T> & { value: T }) => void
): Renderer<T> {
    return {
        init: init || noop,
        name,
        remove: remove || noop,
        update,
    };
}
export function applyRenderer<T>(renderer: Renderer<T>, value: T) {
    let init = !!renderers[renderer.name];
    renderers[renderer.name] = {
        ...renderer,
        value,
    };
    if (init) renderer.init(value, renderers[renderer.name]);
}

export function removeRenderer(renderer: Renderer<any> | string) {
    const name = typeof renderer === 'string' ? renderer : renderer.name;
    renderers[name].remove(renderers[name].value, renderers[name]);
    delete renderers[name];
}

export function getPixel(col: number, pos: Vec2): color {
    let color = getColor(col);
    for (let key in renderers)
        color = renderers[key].update(
            color,
            col,
            pos,
            renderers[key].value,
            renderers[key]
        );
    return color;
}

export function clearAllEffectsAndRenderer() {
    for (const k in renderers) {
        renderers[k].remove(renderers[k].value, renderers[k]);
        delete renderers[k];
    }
    for (const k in effects) {
        effects[k].remove(effects[k].value, effects[k]);
        delete effects[k];
    }
}
