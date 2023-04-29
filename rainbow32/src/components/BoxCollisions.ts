import { component, gameobject } from '../gameObject';
import { SceneManager } from '../SceneManager';

interface Props {
    width: number;
    height: number;
    oldcollisions: gameobject[];
}

function getBounds(obj: gameobject) {
    const comp = obj.getcomponentdata<boxCollision>('BoxCollider');
    if (!comp) {
        return {
            startX: obj.transform.position.x,
            startY: obj.transform.position.y,
            endX: obj.transform.position.x + obj.image.width,
            endY: obj.transform.position.y + obj.image.height,
        };
    }
    return {
        startX: obj.transform.position.x,
        startY: obj.transform.position.y,
        endX: obj.transform.position.x + comp.width,
        endY: obj.transform.position.y + comp.height,
    };
}

class boxCollision implements component<Props> {
    readonly name = 'boxcollider';
    init(cfg: Partial<Props>, obj: gameobject) {
        return {
            width: cfg.width || obj.image.width,
            height: cfg.height || obj.image.height,
            oldcollisions: [],
        };
    }
    objectscollide(obj1: gameobject, obj2: gameobject): boolean {
        const bounds1 = getBounds(obj1);
        const bounds2 = getBounds(obj2);
        return (
            bounds1.endX <= bounds2.startX ||
            bounds1.endY <= bounds2.startY ||
            bounds1.startX >= bounds2.endX ||
            bounds1.startY >= bounds2.endY
        );
    }
    update(cfg: Required<Props>, dt: number, obj: gameobject) {
        const objects = SceneManager.getscene()?.objects;
        if (!objects) return;
        const collisions: gameobject[] = [];
        const myBounds = getBounds(obj);
        for (let i = 0; i < objects.length; ++i) {
            if (objects[i] === obj || !objects[i].getcomponent('boxcollider'))
                continue;
            const bounds = getBounds(objects[i]);
            if (
                bounds.endX <= myBounds.startX ||
                bounds.endY <= myBounds.startY ||
                bounds.startX >= myBounds.endX ||
                bounds.startY >= myBounds.endY
            )
                continue;
            collisions.push(objects[i]);
        }
        const newCollisions = collisions.filter(
            (el) => !cfg.oldcollisions.includes(el)
        );
        const oldCollisions = cfg.oldcollisions.filter(
            (el) => !collisions.includes(el)
        );
        if (collisions.length > 0) obj.emitevent('collideswith', [collisions]);
        if (newCollisions.length > 0)
            obj.emitevent('collisionenter', [newCollisions]);
        if (oldCollisions.length > 0)
            obj.emitevent('collisionleave', [oldCollisions]);
        cfg.oldcollisions = collisions;
    }
}

export const BoxCollider = new boxCollision();
