import { AnimationPlayer } from '../animation';
import { component, gameobject } from '../gameObject';
import { applyImageMask, putImage } from '../imageUtils';
import type { Image, ImageMask } from '../imageUtils';

interface props {
    mask?: AnimationPlayer<ImageMask>;
    img?: AnimationPlayer<Image>;
}

class imageRenderer implements component<props> {
    readonly name = 'imagerenderer';
    init(_cfg: Partial<props>, obj: gameobject) {
        return {
            mask: Array.isArray(obj.mask)
                ? new AnimationPlayer(obj.mask)
                : undefined,
            image: Array.isArray(obj.image)
                ? new AnimationPlayer(obj.image)
                : undefined,
        };
    }
    update(cfg: props, dt: number, gameObject: gameobject) {
        if (Array.isArray(gameObject.image) && !cfg.img)
            cfg.img = new AnimationPlayer(gameObject.image);
        if (Array.isArray(gameObject.mask) && !cfg.mask)
            cfg.mask = new AnimationPlayer(gameObject.mask);
        if (cfg.img && !cfg.img.isplaying) cfg.img.play();
        if (cfg.mask && !cfg.mask.isplaying) cfg.mask.play();
        let image = cfg.img ? cfg.img.getframe()! : (gameObject.image as Image);
        let mask = cfg.mask
            ? cfg.mask.getframe()
            : (gameObject.mask as ImageMask | undefined);

        if (mask && mask.width === image.width && mask.height === image.height)
            image = applyImageMask(image, mask);

        putImage(
            gameObject.transform.position.x,
            gameObject.transform.position.y,
            image
        );
    }
}

export const ImageRenderer = new imageRenderer();