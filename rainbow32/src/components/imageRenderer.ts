import { component, gameobject } from '../gameObject';
import { applyImageMask, putImage } from '../imageUtils';

class imageRenderer implements component {
    readonly name = 'imagerenderer';
    init() {}
    update(cfg: void, dt: number, gameObject: gameobject) {
        if (gameObject.image.width < 1 || gameObject.image.height < 1) return;
        let image = gameObject.image;
        if (
            gameObject.mask &&
            gameObject.mask.width === image.width &&
            gameObject.mask.height === image.height
        )
            image = applyImageMask(image, gameObject.mask);

        putImage(
            gameObject.transform.position.x,
            gameObject.transform.position.y,
            image
        );
    }
}

export const ImageRenderer = new imageRenderer();
