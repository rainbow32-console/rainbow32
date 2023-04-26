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

export interface Component<Config = void> {
    init(config: Partial<Config> | undefined, gameObject: GameObject): Config;
    update?(config: Config, dt: number, gameObject: GameObject): void;
    remove?(config: Config, gameObject: GameObject): void;
    readonly name: string;
}

export interface GameObjectOptions {
    name: string;
    image: Image | string;
    mask?: ImageMask | string;
    components?: ComponentEntry<any>[];
    opacity?: number;
    transform?: Partial<Transform>;
    customRenderer?: boolean;
    events?: Record<string, (obj: GameObject, ...args: any[]) => void>;
    eventsOnce?: Record<string, (obj: GameObject, ...args: any[]) => void>;
}

type ComponentEntry<T> = { component: Component<T>; config?: Partial<T> };

export class GameObject {
    transform: Transform;
    image: Image;
    mask?: ImageMask;
    private components: Record<string, Component<any>> = {};
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

    constructor(opts: GameObjectOptions) {
        this.initOpts = opts;
        this.name = opts.name;
        this.reset();
    }

    private reset() {
        const {
            image,
            components,
            mask,
            transform,
            customRenderer,
            events,
            eventsOnce,
        } = this.initOpts;
        this.components = {};
        this.componentInitData = {};
        this.componentData = {};
        this.listeners = {};
        if (typeof image === 'string') this.image = parseImage(image);
        else this.image = image;
        this.hasCustomRenderer = !!customRenderer;

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
        if (eventsOnce)
            for (const [k, v] of Object.entries(eventsOnce)) this.once(k, v);

        if (components) this.addComponents(components);
        if (!this.hasCustomRenderer)
            this.addComponents([{ component: ImageRenderer }]);
    }

    addComponents<T>(components: ComponentEntry<T>[]) {
        for (let i = 0; i < components.length; ++i)
            if (!this.components[components[i].component.name]) {
                this.componentData[components[i].component.name] = components[
                    i
                ].component.init(components[i].config || {}, this);
                this.components[components[i].component.name] =
                    components[i].component;
                this.componentInitData[components[i].component.name] =
                    components[i].config;
                this.emitEvent('componentAdded', [
                    components[i].component.name,
                    components[i].component,
                    components[i].config,
                    this.componentData[components[i].component.name],
                ]);
            }
    }

    removeComponent(component: string) {
        if (!this.components[component]) return;
        this.emitEvent('componentRemoved', [
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

    getComponent<T extends Component<any>>(component: string): T | undefined {
        return this.components[component] as T;
    }

    getComponentData<T extends Component<any>>(
        component: string
    ): Required<Parameters<T['init']>[0]> | undefined {
        return this.componentData[component] as any;
    }

    remove() {
        this.emitEvent('remove', []);
        const keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            this.components[keys[i]]?.remove?.(
                this.componentData[keys[i]],
                this
            );
        this.reset();
    }

    init() {
        this.emitEvent('init', []);
        const keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            this.componentData[keys[i]] = this.components[keys[i]]?.init(
                this.componentInitData[keys[i]] || {},
                this
            );
        if (!this.hasCustomRenderer)
            this.addComponents([{ component: ImageRenderer }]);
    }

    render(dt: number) {
        if (!this.active) return;
        if (isCollectingDebugData)
            debugData['Update State'] = 'GameObject::' + this.name;
        this.emitEvent('render', [dt]);

        let keys = Object.keys(this.components);
        for (let i = 0; i < keys.length; ++i)
            this.components[keys[i]]?.update?.(
                this.componentData[keys[i]],
                dt,
                this
            );
        this.emitEvent('renderLate', [dt]);
    }

    off(name: string, cb: (obj: GameObject, ...args: any[]) => void) {
        if (!this.listeners[name]) return;
        this.listeners[name] = this.listeners[name].filter(
            (el) => el.cb !== cb
        );
    }

    once(name: string, cb: (obj: GameObject, ...args: any[]) => void): void {
        this.listeners[name] ||= [];
        this.listeners[name].push({ cb, once: true });
    }

    on(name: string, cb: (obj: GameObject, ...args: any[]) => void): void {
        this.listeners[name] ||= [];
        this.listeners[name].push({ cb, once: false });
    }

    emitEvent(name: string, args: any[]) {
        if (!this.listeners[name]) return;
        for (let i = 0; i < this.listeners[name].length; ++i)
            this.listeners[name][i].cb(this, ...args);
        this.listeners[name] = this.listeners[name].filter((el) => !el.once);
    }
}

export function createComponent<T>(
    component: Component<T>,
    data?: Partial<T>
): ComponentEntry<T> {
    return {
        component,
        config: data,
    };
}
export const component = createComponent;
export const comp = createComponent;
