import { Component, GameObject } from '../gameObject';
import { applyImageMask, imgToImageData, putImageData } from '../imageUtils';

class imageRenderer implements Component {
    readonly name = 'ImageRenderer';
    init() {}
    update(
        cfg: void,
        dt: number,
        ctx: CanvasRenderingContext2D,
        gameObject: GameObject
    ) {
        if (gameObject.image.width < 1 || gameObject.image.height < 1) return;
        let image = gameObject.image;
        if (
            gameObject.mask &&
            gameObject.mask.width === image.width &&
            gameObject.mask.height === image.height
        )
            image = applyImageMask(image, gameObject.mask);

        const data = imgToImageData(image);
        if (!data) return;
        for (let i = 0; i < data.width * data.height; ++i)
            data.data[i * 4 + 3] *= gameObject.opacity;

        putImageData(
            ctx,
            data,
            gameObject.transform.position.x,
            gameObject.transform.position.y
        );
    }
}

export const ImageRenderer = new imageRenderer();
