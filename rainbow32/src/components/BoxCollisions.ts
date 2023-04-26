import { Component, GameObject } from '../gameObject';
import { SceneManager } from '../SceneManager';

interface Props {
    width: number;
    height: number;
    oldCollisions: GameObject[];
}

function getBounds(obj: GameObject) {
    const comp = obj.getComponentData<boxCollision>('BoxCollider');
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

class boxCollision implements Component<Props> {
    readonly name = 'BoxCollider';
    init(cfg: Partial<Props>, obj: GameObject) {
        return {
            width: cfg.width || obj.image.width,
            height: cfg.height || obj.image.height,
            oldCollisions: [],
        };
    }
    update(cfg: Required<Props>, dt: number, obj: GameObject) {
        const objects = SceneManager.getScene()?.objects;
        if (!objects) return;
        const collisions: GameObject[] = [];
        const myBounds = getBounds(obj);
        for (let i = 0; i < objects.length; ++i) {
            if (objects[i] === obj || !objects[i].getComponent('BoxCollider'))
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
            (el) => !cfg.oldCollisions.includes(el)
        );
        const oldCollisions = cfg.oldCollisions.filter(
            (el) => !collisions.includes(el)
        );
        if (collisions.length > 0) obj.emitEvent('collidesWith', [collisions]);
        if (newCollisions.length > 0)
            obj.emitEvent('collisionEnter', [newCollisions]);
        if (oldCollisions.length > 0)
            obj.emitEvent('collisionLeave', [oldCollisions]);
        cfg.oldCollisions = collisions;
    }
}

export const BoxCollider = new boxCollision();
