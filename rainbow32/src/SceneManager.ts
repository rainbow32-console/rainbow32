import { debugData, isCollectingDebugData } from '.';
import { gameobject } from './gameObject';
import { removeParticles } from './particleSystem';

export interface userscene<t extends Record<string, string>> {
    beforeinit(scene: Scene<t>): t;
    afterinit?(config: t, scene: Scene<t>): void;
    beforeupdate?(config: t, scene: Scene<t>, dt: number): void;
    afterupdate?(config: t, scene: Scene<t>, dt: number): void;
    beforeremove?(config: t, scene: Scene<t>): void;
    afterremove?(config: t, scene: Scene<t>): void;
    objects: gameobject[];
    name: string;
}

export class Scene<T extends Record<string, any>> {
    private uScene: userscene<T>;
    objects: gameobject[] = [];
    readonly name: string;
    private config: T;

    constructor(scene: userscene<T>) {
        this.uScene = scene;
        this.name = scene.name;
        this.config = {} as any;
    }

    init() {
        this.objects = [...this.uScene.objects];
        this.config = this.uScene.beforeinit(this);
        for (let i = 0; i < this.objects.length; ++i) this.objects[i].init();
        this.uScene.afterinit?.(this.config, this);
    }

    remove() {
        this.uScene.beforeremove?.(this.config, this);
        for (let i = 0; i < this.objects.length; ++i) this.objects[i].remove();
        this.objects = [];
        this.uScene.afterremove?.(this.config, this);
        this.config = {} as any;
    }

    update(dt: number) {
        this.uScene.beforeupdate?.(this.config, this, dt);
        for (let i = 0; i < this.objects.length; ++i) {
            if (SceneManager.getscene() !== this) break;
            this.objects[i].render(dt);
        }
        if (SceneManager.getscene() !== this) return;
        this.uScene.afterupdate?.(this.config, this, dt);
    }

    addobjects(...obj: gameobject[]) {
        this.objects.push(...obj);
        for (let i = 0; i < obj.length; ++i) obj[i].init();
    }

    getobjectbyname(name: string): gameobject | undefined {
        return this.objects.find((el) => el.name === name);
    }

    getobjectsbyname(name: string): gameobject[] {
        return this.objects.filter((el) => el.name === name);
    }

    removeobject(object: gameobject) {
        this.objects = this.objects.filter((el) => {
            if (el !== object) return true;
            el.remove();
            return false;
        });
    }

    removeobjects(...objects: gameobject[]) {
        this.objects = this.objects.filter((el) => {
            if (!objects.includes(el)) return true;
            el.remove();
            return false;
        });
    }

    removeobjectsbyname(name: string) {
        this.objects = this.objects.filter((el) => {
            if (el.name !== name) return true;
            el.remove()
            return false;
        });
    }

    removeobjectsbynames(...names: string[]) {
        this.objects = this.objects.filter((el) => {
            if (!names.includes(el.name)) return true;
            el.remove();
            return false;
        });
    }
}

let scenes: Scene<any>[] = [];
let currentlySelected = 0;

export const SceneManager = {
    setscenes(newScenes: Scene<any>[], defaultSelected?: number) {
        scenes[currentlySelected]?.remove();
        scenes = newScenes;
        currentlySelected = defaultSelected || 0;
        scenes[currentlySelected]?.init();
    },
    addscene(scene: Scene<any>) {
        scenes.push(scene);
    },
    changescene(scene: string | number) {
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
            scenes[currentlySelected]?.objects.length.toString() || '0';
    },
    getscene<T extends Record<string, string>>(): Scene<T> | undefined {
        return scenes[currentlySelected];
    },
};
