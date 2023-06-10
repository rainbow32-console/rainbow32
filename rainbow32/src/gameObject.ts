import { Animation } from './animation';
import { debugData, isCollectingDebugData } from '.';
import { ImageRenderer } from './components/imageRenderer';
import { Image, ImageMask, parseImage, parseMask } from './imageUtils';

export interface Vec2 {
    x: number;
    y: number;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Transform {
    position: Vec2;
}

export interface component<Config = void> {
    init(config: Partial<Config> | undefined, gameObject: gameobject): Config;
    update?(config: Config, dt: number, gameObject: gameobject): void;
    remove?(config: Config, gameObject: gameobject): void;
    readonly name: string;
}

export interface GameObjectOptions {
    name: string;
    image: Image | Animation<Image> | string;
    mask?: ImageMask | Animation<ImageMask> | string;
    components?: componententry<any>[];
    opacity?: number;
    transform?: Partial<Transform>;
    customrenderer?: boolean;
    events?: Record<string, (obj: gameobject, ...args: any[]) => void>;
    eventsonce?: Record<string, (obj: gameobject, ...args: any[]) => void>;
}

type componententry<t> = { component: component<t>; config?: Partial<t> };

export class gameobject {
    transform: Transform;
    image: Image | Animation<Image>;
    mask?: ImageMask | Animation<ImageMask>;
    private components: Record<string, component<any>> = {};
    private componentInitData: Record<string, any> = {};
    private componentData: Record<string, any> = {};
    active: boolean;
    readonly name: string;
    private hasCustomRenderer: boolean;
    private listeners: Record<
        string,
        { cb: (...args: any[]) => void; once: boolean }[]
    > = {};
    private initOpts: GameObjectOptions;
    private _timeFromInit = -1;
    get lifetime() {
        if (this._timeFromInit < 0) return -1;
        return Date.now() - this._timeFromInit;
    }
    private isremoved = true;

    constructor(opts: GameObjectOptions) {
        this.initOpts = opts;
        this.name = opts.name;
        this.reset();
    }

    private reset() {
        this.isremoved = true;
        const {
            image,
            components,
            mask,
            transform,
            customrenderer,
            events,
            eventsonce,
        } = this.initOpts;
        this.components = {};
        this.componentInitData = {};
        this.componentData = {};
        this.listeners = {};
        if (typeof image === 'string') this.image = parseImage(image);
        else this.image = image;
        this.hasCustomRenderer = !!customrenderer;

        if (typeof mask === 'string') this.mask = parseMask(mask);
        else if (typeof mask === 'object' && mask) this.mask = mask;

        this.transform = {
            position: {
                x: transform?.position?.x || 0,
                y: transform?.position?.y || 0,
            },
        };
        this.active = true;

        if (events) for (const [k, v] of Object.entries(events)) this.on(k, v);
        if (eventsonce)
            for (const [k, v] of Object.entries(eventsonce)) this.once(k, v);

        if (components) this.addcomponents(components);
        if (!this.hasCustomRenderer)
            this.addcomponents([{ component: ImageRenderer }]);
    }

    addcomponents<T>(components: componententry<T>[]) {
        for (let i = 0; i < components.length; ++i)
            if (!this.components[components[i].component.name]) {
                this.componentData[components[i].component.name] = components[
                    i
                ].component.init(components[i].config || {}, this);
                this.components[components[i].component.name] =
                    components[i].component;
                this.componentInitData[components[i].component.name] =
                    components[i].config;
                this.emitevent('componentAdded', [
                    components[i].component.name,
                    components[i].component,
                    components[i].config,
                    this.componentData[components[i].component.name],
                ]);
            }
    }

    removecomponent(component: string) {
        if (!this.components[component]) return;
        this.emitevent('componentRemoved', [
            component,
            this.components[component],
            this.componentData[component],
            this.componentInitData[component],
        ]);
        this.components[component].remove?.(
            this.componentData[component],
            this
        );
        delete this.components[component];
        delete this.componentData[component];
        delete this.componentInitData[component];
    }

    getcomponent<T extends component<any>>(component: string): T | undefined {
        return this.components[component] as T;
    }

    getcomponentdata<T extends component<any>>(
        component: string
    ): Required<Parameters<T['init']>[0]> | undefined {
        return this.componentData[component] as any;
    }

    remove() {
        this.isremoved = true;
        this._timeFromInit = -1;
        this.emitevent('remove', []);
        const keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            this.components[keys[i]]?.remove?.(
                this.componentData[keys[i]],
                this
            );
        requestAnimationFrame(this.reset.bind(this));
    }

    init() {
        this.isremoved = false;
        this._timeFromInit = Date.now();
        this.emitevent('init', []);
        const keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            this.componentData[keys[i]] = this.components[keys[i]]?.init(
                this.componentInitData[keys[i]] || {},
                this
            );
        if (!this.hasCustomRenderer)
            this.addcomponents([{ component: ImageRenderer }]);
    }

    render(dt: number) {
        if (!this.active) return;
        if (isCollectingDebugData)
            debugData['Update State'] = 'GameObject::' + this.name;
        this.emitevent('render', [dt]);

        let keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            if (this.componentData[keys[i]] && !this.isremoved)
                this.components[keys[i]]?.update?.(
                    this.componentData[keys[i]],
                    dt,
                    this
                );
        if (this.isremoved) return;
        this.emitevent('renderLate', [dt]);
    }

    off(name: string, cb: (obj: gameobject, ...args: any[]) => void) {
        if (!this.listeners[name]) return;
        this.listeners[name] = this.listeners[name].filter(
            (el) => el.cb !== cb
        );
    }

    once(name: string, cb: (obj: gameobject, ...args: any[]) => void): void {
        this.listeners[name] ||= [];
        this.listeners[name].push({ cb, once: true });
    }

    on(name: string, cb: (obj: gameobject, ...args: any[]) => void): void {
        this.listeners[name] ||= [];
        this.listeners[name].push({ cb, once: false });
    }

    emitevent(name: string, args: any[]) {
        if (!this.listeners[name]) return;
        for (let i = 0; i < this.listeners[name].length; ++i)
            this.listeners[name][i].cb(this, ...args);
        this.listeners[name] = this.listeners[name].filter((el) => !el.once);
    }
}

export function createComponent<T>(
    component: component<T>,
    data?: Partial<T>
): componententry<T> {
    return {
        component,
        config: data,
    };
}
export const component = createComponent;
export const comp = createComponent;
