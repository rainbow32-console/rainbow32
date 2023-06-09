import {
    screenshake,
    blackwhiteColorRenderer,
    oldColors,
} from './effectRendererDefaults';
import { ImageRenderer } from './components/imageRenderer';
import { BoxCollider } from './components/BoxCollisions';
import _default from './fonts/default';
import default_monospace from './fonts/default_monospace';
import legacy from './fonts/legacy';
import { createComponent, gameobject } from './gameObject';
import * as imageUtils from './imageUtils';
import * as audioUtils from './audioUtils';
import {
    buttons,
    HEIGHT,
    loadGameByContents,
    memory,
    renderParticles,
    shouldBreak,
    stopGame,
    WIDTH,
} from './index';
import { distance, lerp } from './math';
import { readFromFile, storeToFile } from './saveFile';
import { Scene, SceneManager } from './SceneManager';

import {
    download,
    getCurrentImage,
    getCurrentImageMask,
    isOnTimeout,
    timeout,
} from './utils';
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
import { removeEntry, resetEntries, setEntry } from './pausemenu';
import {
    applyEffect,
    applyRenderer,
    createEffect,
    createRenderer,
    removeEffect,
    removeRenderer,
} from './effects';
import {
    AnimationPlayer,
    animationBuilder,
    getAnimationFrame,
} from './animation';

function expose(name: string, variable: any) {
    if (
        !globalThis.__rainbow32_api ||
        typeof globalThis.__rainbow32_api !== 'object'
    )
        globalThis.__rainbow32_api = {};
    Object.defineProperty(globalThis.__rainbow32_api, name, {
        get() {
            if (shouldBreak())
                throw new Error('Game is not currently running!');
            return variable;
        },
    });
}

export function exposeToWorld() {
    if (globalThis.__rainbow32_api?.__did_expose) return;

    globalThis.__rainbow32_api = { __did_expose: true };

    // text
    const fonts = {
        default: _default,
        default_monospace,
        legacy,
    };
    expose('fonts', fonts);
    expose('writetext', writeText);
    expose('currenttextmasks', currentTextMasks);
    expose('addcharmap', addCharacterMask);
    expose('applycharmap', applyCharacterMap);
    expose('clearcharmap', clearCharacterMap);
    expose('calculatebounds', calculateBounds);
    expose('calculatewidth', calculateWidth);

    // utils
    expose(
        'nextframe',
        () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    );
    expose('download', download);
    expose('isontimeout', isOnTimeout);
    expose('timeout', timeout);
    expose('getcurrentimage', getCurrentImage);
    expose('getcurrentimagemask', getCurrentImageMask);

    // default components
    expose('imagerenderer', ImageRenderer);
    expose('boxcollider', BoxCollider);

    // gameobject
    expose('createcomponent', createComponent);
    expose('gameobject', gameobject);

    // scene
    expose('scene', Scene);
    expose('scenemanager', SceneManager);

    // general-purpose
    expose('memory', memory);
    expose('buttons', buttons);
    expose('stopgame', stopGame);
    expose('width', WIDTH);
    expose('height', HEIGHT);

    // math
    expose('distance', distance);
    expose('lerp', lerp);

    // savestates
    expose('storetofile', storeToFile);
    expose('readfromfile', readFromFile);

    // particle system
    expose('addparticle', addParticle);
    expose('removeparticle', removeParticle);
    expose('removeparticles', removeParticles);
    expose('renderparticles', renderParticles);

    // menu
    expose('resetentries', resetEntries);
    expose('setentry', setEntry);
    expose('removentry', removeEntry);

    // image
    expose('parseImage', imageUtils.parseImage);
    expose('applyImageMask', imageUtils.applyImageMask);
    expose('applyImageMaskModifyImage', imageUtils.applyImageMaskModifyImage);
    expose('circle', imageUtils.circle);
    expose('defaultPalette', imageUtils.defaultPalette);
    expose('getColor', imageUtils.getColor);
    expose('getCurrentPalette', imageUtils.getCurrentPalette);
    expose('isValidColor', imageUtils.isValidColor);
    expose('parseMask', imageUtils.parseMask);
    expose('putImage', imageUtils.putImage);
    expose('line', imageUtils.line);
    expose('putImageRaw', imageUtils.putImageRaw);
    expose('setCurrentPalette', imageUtils.setCurrentPalette);
    expose('square', imageUtils.square);
    expose('stringifyImage', imageUtils.stringifyImage);
    expose('stringifyMask', imageUtils.stringifyMask);
    expose('serializeImage', imageUtils.serializeImage);
    expose('unserializeImage', imageUtils.unserializeImage);
    expose('imgToPng', imageUtils.imgToPng);
    expose('setOffset', imageUtils.setOffset);
    expose('setPixel', imageUtils.setPixel);
    expose('cls', imageUtils.cls);
    expose('setpalettetranslation', imageUtils.setPaletteTranslation);

    // audio
    expose('setVolume', audioUtils.setVolume);
    expose('contextState', audioUtils.contextState);
    expose('playAudio', audioUtils.playAudio);
    expose('playSound', audioUtils.playSound);
    expose('getFrequency', audioUtils.getFrequency);
    expose('unserializeAudio', audioUtils.unserializeAudio);
    expose('serializeAudio', audioUtils.serializeAudio);
    expose('getSound', audioUtils.getSound);
    expose('parseAudio', audioUtils.parseAudio);
    expose('validNotes', audioUtils.validNotes);
    expose('validInstruments', audioUtils.validInstruments);
    expose('getVolume', audioUtils.getVolume);

    // effects & rendering
    expose('createeffect', createEffect);
    expose('applyeffect', applyEffect);
    expose('removeeffect', removeEffect);
    expose('createrenderer', createRenderer);
    expose('applyrenderer', applyRenderer);
    expose('removerenderer', removeRenderer);
    expose('effects', { screenshake, oldcolors: oldColors });
    expose('renderers', { bwcolors: blackwhiteColorRenderer });

    // animations
    expose('animationbuilder', animationBuilder);
    expose('animationplayer', AnimationPlayer);
    expose('getanimationframe', getAnimationFrame);

    expose('run', loadGameByContents);
}
