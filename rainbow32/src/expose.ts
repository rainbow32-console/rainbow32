import { ImageRenderer } from './components/imageRenderer';
import { BoxCollider } from './components/BoxCollisions';
import _default from './fonts/default';
import default_monospace from './fonts/default_monospace';
import legacy from './fonts/legacy';
import { createComponent, GameObject } from './gameObject';
import * as imageUtils from './imageUtils';
import * as audioUtils from './audioUtils';
import { buttons, HEIGHT, isPressed, memory, stopGame, WIDTH } from './index';
import { distance, lerp } from './math';
import { readFromFile, storeToFile } from './saveFile';
import { Scene, SceneManager } from './SceneManager';

import { download, isOnTimeout, timeout } from './utils';
import {
    addCharacterMask,
    applyCharacterMap,
    calculateBounds,
    calculateWidth,
    clearCharacterMap,
    currentTextMasks,
    writeText,
} from './text';
import { addParticle, removeParticle, removeParticles } from './particleSystem';

function expose(name: string, variable: any) {
    (globalThis as any)[name] = variable;
}

export function exposeToWorld() {
    const fonts = {
        default: _default,
        default_monospace,
        legacy,
    };

    expose('fonts', fonts);
    expose('imageUtils', imageUtils);
    expose(
        'nextFrame',
        () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    );
    expose('ImageRenderer', ImageRenderer);
    expose('createComponent', createComponent);
    expose('GameObject', GameObject);
    expose('memory', memory);
    expose('isPressed', isPressed);
    expose('buttons', buttons);
    expose('WIDTH', WIDTH);
    expose('HEIGHT', HEIGHT);
    expose('stopGame', stopGame);
    expose('distance', distance);
    expose('lerp', lerp);
    expose('storeToFile', storeToFile);
    expose('readFromFile', readFromFile);
    expose('Scene', Scene);
    expose('SceneManager', SceneManager);
    expose('writeText', writeText);
    expose('currentTextMasks', currentTextMasks);
    expose('addCharacterMask', addCharacterMask);
    expose('applyCharacterMap', applyCharacterMap);
    expose('clearCharacterMap', clearCharacterMap);
    expose('download', download);
    expose('isOnTimeout', isOnTimeout);
    expose('timeout', timeout);
    expose('audioUtils', audioUtils);
    expose('calculateBounds', calculateBounds);
    expose('calculateWidth', calculateWidth);
    expose('addParticle', addParticle);
    expose('removeParticle', removeParticle);
    expose('removeParticles', removeParticles);
    expose('BoxCollider', BoxCollider);
}
