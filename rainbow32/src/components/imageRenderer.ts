import { getAnimationFrame } from '../animation';
import { component, gameobject } from '../gameObject';
import { applyImageMask, putImage } from '../imageUtils';

interface props {
    start: number;
}

class imageRenderer implements component<props> {
    readonly name = 'imagerenderer';
    init(){return {start: Date.now()}}
    update(cfg: props, dt: number, gameObject: gameobject) {
        let image = Array.isArray(gameObject.image) ? getAnimationFrame(gameObject.image, Date.now()-cfg.start) : gameObject.image;
        let mask = Array.isArray(gameObject.mask) ? getAnimationFrame(gameObject.mask, Date.now()-cfg.start) : gameObject.mask;
        if (!image || image.width < 1 || image.height < 1) return;
        if (
            mask &&
            mask.width === image.width &&
            mask.height === image.height
        )
            image = applyImageMask(image, mask);

        putImage(
            gameObject.transform.position.x,
            gameObject.transform.position.y,
            image
        );
    }
}

export const ImageRenderer = new imageRenderer();
