import { debugData, isCollectingDebugData } from '.';
import { GameObject } from './gameObject';
import { removeParticles } from './particleSystem';

export interface UserScene<T> {
    beforeInit(scene: Scene<T>): T;
    afterInit?(config: T, scene: Scene<T>): void;
    beforeUpdate?(config: T, scene: Scene<T>, dt: number): void;
    afterUpdate?(config: T, scene: Scene<T>, dt: number): void;
    beforeRemove?(config: T, scene: Scene<T>): void;
    afterRemove?(config: T, scene: Scene<T>): void;
    gameObjects: GameObject[];
    name: string;
}

export class Scene<T extends Record<string, any>> {
    private uScene: UserScene<T>;
    objects: GameObject[] = [];
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

    update(dt: number) {
        this.uScene.beforeUpdate?.(this.config, this, dt);
        for (let i = 0; i < this.objects.length; ++i) {
            if (SceneManager.getScene() !== this) break;
            this.objects[i].render(dt);
        }
        if (SceneManager.getScene() !== this) return;
        this.uScene.afterUpdate?.(this.config, this, dt);
    }

    addObject(obj: GameObject) {
        this.objects.push(obj);
    }

    objectAmount(): number {
        return this.objects.length;
    }

    getObjectByName(name: string): GameObject | undefined {
        return this.objects.find((el) => el.name === name);
    }

    getObjectsByName(name: string): GameObject[] {
        return this.objects.filter((el) => el.name === name);
    }

    removeObject(object: GameObject) {
        this.objects = this.objects.filter((el) => el !== object);
    }

    removeObjects(...objects: GameObject[]) {
        this.objects = this.objects.filter((el) => !objects.includes(el));
    }

    removeObjectByName(name: string) {
        this.objects = this.objects.filter((el) => el.name !== name);
    }

    removeObjectsByName(...names: string[]) {
        this.objects = this.objects.filter((el) => !names.includes(el.name));
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
        removeParticles();
    },
    update(dt: number) {
        if (isCollectingDebugData) debugData['Update State'] = 'Scene';
        scenes[currentlySelected]?.update(dt);
        if (!isCollectingDebugData) return;
        debugData['Current Scene'] = scenes[currentlySelected]
            ? scenes[currentlySelected].name
            : 'None';
        debugData['#Game Objects'] =
            scenes[currentlySelected]?.objectAmount().toString() || '0';
    },
    getScene<T>(): Scene<T> | undefined {
        return scenes[currentlySelected];
    },
};
