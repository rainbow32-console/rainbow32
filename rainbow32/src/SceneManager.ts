import { GameObject } from './gameObject';

export interface UserScene<T> {
    beforeInit(scene: Scene<T>): T;
    afterInit?(config: T, scene: Scene<T>): void;
    beforeUpdate?(
        config: T,
        scene: Scene<T>,
        dt: number,
        ctx: CanvasRenderingContext2D
    ): void;
    afterUpdate?(
        config: T,
        scene: Scene<T>,
        dt: number,
        ctx: CanvasRenderingContext2D
    ): void;
    beforeRemove?(config: T, scene: Scene<T>): void;
    afterRemove?(config: T, scene: Scene<T>): void;
    gameObjects: GameObject[];
    name: string;
}

export class Scene<T extends Record<string, any>> {
    private uScene: UserScene<T>;
    private objects: GameObject[] = [];
    readonly name: string;
    private config: T;

    constructor(scene: UserScene<T>) {
        this.uScene = scene;
        this.name = scene.name;
        this.config = {} as any;
    }

    init() {
        this.objects = [...this.uScene.gameObjects];
        this.config = this.uScene.beforeInit(this);
        for (let i = 0; i < this.objects.length; ++i) this.objects[i].init();
        this.uScene.afterInit?.(this.config, this);
    }

    remove() {
        this.uScene.beforeRemove?.(this.config, this);
        for (let i = 0; i < this.objects.length; ++i) this.objects[i].remove();
        this.objects = [];
        this.uScene.afterRemove?.(this.config, this);
        this.config = {} as any;
    }

    update(dt: number, ctx: CanvasRenderingContext2D) {
        this.uScene.beforeUpdate?.(this.config, this, dt, ctx);
        for (let i = 0; i < this.objects.length; ++i)
            this.objects[i].render(dt, ctx);
        this.uScene.afterUpdate?.(this.config, this, dt, ctx);
    }

    addObject(obj: GameObject) {
        this.objects.push(obj);
    }
}

let scenes: Scene<any>[] = [];
let currentlySelected = 0;

export const SceneManager = {
    setScenes(newScenes: Scene<any>[], defaultSelected?: number) {
        scenes[currentlySelected]?.remove();
        scenes = newScenes;
        currentlySelected = defaultSelected || 0;
        scenes[currentlySelected]?.init();
    },
    addScene(scene: Scene<any>) {
        scenes.push(scene);
    },
    changeScene(scene: string | number) {
        if (typeof scene === 'number') {
            scenes[currentlySelected]?.remove();
            currentlySelected = scene;
            scenes[currentlySelected]?.init();
        } else {
            let i = -1;
            for (let j = 0; j < scenes.length; ++j)
                if (scenes[j].name === scene) {
                    i = j;
                    break;
                }
            if (i < 0)
                throw new Error(
                    'No scene with the name ' + scene + ' was found!'
                );
            scenes[currentlySelected]?.remove();
            currentlySelected = i;
            scenes[currentlySelected]?.init();
        }
    },
    update(dt: number, ctx: CanvasRenderingContext2D) {
        scenes[currentlySelected]?.update(dt, ctx);
    },
    getScene<T>(): Scene<T> | undefined {
        return scenes[currentlySelected];
    },
};
