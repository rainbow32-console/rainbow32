function importExposed(name: string): any {
    return (globalThis as any)[name];
}

/**
 *
 * EXPORTS
 *
 */

export const BoxCollider = importExposed('BoxCollider') as Component<{
    width: number;
    height: number;
    oldCollisions: GameObject[];
}>;
export function registerGame(game: GameFile): void {
    (globalThis as any).__registeredGame = game;
}

export const fonts = importExposed('fonts') as Record<
    'default' | 'default_monospace' | 'legacy',
    Font
>;
export const imageUtils = importExposed('imageUtils') as ImageUtils;
export const audioUtils = importExposed('audioUtils') as AudioUtils;
export const utils = {
    nextFrame: importExposed('nextFrame'),
    download: importExposed('download'),
    isOnTimeout: importExposed('isOnTimeout'),
    timeout: importExposed('timeout'),
} as Utils;
export const ParticleSystem = {
    addParticle: importExposed('addParticle') as (
        life: number,
        pos: Vec2,
        size: number,
        color: number,
        gravity: number,
        force: Vec2,
        oob?: boolean,
        mask?: ImageMask
    ) => Particle,
    removeParticle: importExposed('removeParticle') as (p: Particle) => void,
    removeParticles: importExposed('removeParticles') as () => void,
};
export const ImageRenderer = importExposed('ImageRenderer') as Component<void>;
export const createComponent = importExposed('createComponent') as <T>(
    component: Component<T>,
    data?: Partial<T>
) => ComponentEntry<T>;
export const component = importExposed('createComponent') as <T>(
    component: Component<T>,
    data?: Partial<T>
) => ComponentEntry<T>;
export const comp = importExposed('createComponent') as <T>(
    component: Component<T>,
    data?: Partial<T>
) => ComponentEntry<T>;
export const GameObject = importExposed('GameObject') as new (
    opts: GameObjectOptions
) => _GameObject;
export const memory = importExposed('memory') as Uint8Array;
export const isPressed = importExposed('isPressed') as (
    button: Button
) => boolean;
export const buttons = importExposed('buttons') as Record<
    Button,
    {
        down: boolean;
        press: boolean;
    }
>;
export const WIDTH = importExposed('WIDTH') as number;
export const HEIGHT = importExposed('HEIGHT') as number;
export const stopGame = importExposed('stopGame') as () => void;
export const reset = importExposed('stopGame') as () => void;
export const math = {
    distance: importExposed('distance'),
    lerp: importExposed('lerp'),
} as _Math;
export const saveFile = {
    storeToFile: importExposed('storeToFile'),
    readFromFile: importExposed('readFromFile'),
} as SaveFileUtils;
export const Scene = importExposed('Scene') as new <
    T extends Record<string, any>
>(
    scene: UserScene<T>
) => _Scene;
export const SceneManager = importExposed('SceneManager') as _SceneManager;
export const TextUtils = {
    writeText: importExposed('writeText'),
    currentTextMasks: importExposed('currentTextMasks'),
    addCharacterMask: importExposed('addCharacterMask'),
    applyCharacterMap: importExposed('applyCharacterMap'),
    clearCharacterMap: importExposed('clearCharacterMap'),
    calculateBounds: importExposed('calculateBounds'),
    calculateWidth: importExposed('calculateWidth'),
} as _TextUtils;

/**
 *
 * TYPES
 *
 */

export type ImageRenderer = typeof ImageRenderer;
export type BoxCollider = typeof BoxCollider;
export type Font = Record<string, ImageMask>;
export type Button = 'up' | 'down' | 'left' | 'right' | 'u' | 'i' | 'o' | 'p';
export interface Vec2 {
    x: number;
    y: number;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Transform {
    position: Vec2;
}

export interface Component<Config = void> {
    init(config: Partial<Config> | undefined, gameObject: _GameObject): Config;
    update?(config: Config, dt: number, gameObject: _GameObject): void;
    remove?(config: Config, gameObject: _GameObject): void;
    readonly name: string;
}

export interface GameObjectOptions {
    name: string;
    image: Image | string;
    mask?: ImageMask | string;
    components?: ComponentEntry<any>[];
    opacity?: number;
    transform?: Partial<Transform>;
    customRenderer?: boolean;
    events?: Record<string, (obj: GameObject, ...args: any[]) => void>;
    eventsOnce?: Record<string, (obj: GameObject, ...args: any[]) => void>;
}
export type ComponentEntry<T> = {
    component: Component<T>;
    config?: Partial<T>;
};
export interface UserScene<T> {
    beforeInit(scene: _Scene): T;
    afterInit?(config: T, scene: _Scene): void;
    beforeUpdate?(config: T, scene: _Scene, dt: number): void;
    afterUpdate?(config: T, scene: _Scene, dt: number): void;
    beforeRemove?(config: T, scene: _Scene): void;
    afterRemove?(config: T, scene: _Scene): void;
    gameObjects: _GameObject[];
    name: string;
}
export interface Line {
    readonly y: number;
    readonly start: number;
    readonly end: number;
}
export type ColorPalette = [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
];
export interface Image {
    width: number;
    height: number;
    buf: Uint8Array;
}
export interface ImageMask {
    width: number;
    height: number;
    buf: Uint8Array;
}

export interface GameFile {
    name: string;
    palette?: ColorPalette;
    bg: string;

    init?(): void;
    update?(dt: number): void;
    remove?(): void;
    scenes?: _Scene[];
    defaultScene?: number;
}

/**
 *
 * INTERNAL TYPES
 *
 */

export interface _GameObject {
    active: boolean;
    addComponents<T>(components: ComponentEntry<T>[]): void;
    transform: Transform;
    image: Image;
    mask?: ImageMask;
    readonly name: string;
    removeComponent(component: string): void;
    getComponent<T extends Component<any>>(component: string): T | undefined;
    getComponentData<T extends Component<any>>(
        component: string
    ): Required<Parameters<T['init']>[0]> | undefined;
    remove(): void;
    init(): void;
    render(dt: number): void;

    off(name: string, cb: (obj: GameObject, ...args: any[]) => void): void;
    once(name: string, cb: (obj: GameObject, ...args: any[]) => void): void;
    on(name: string, cb: (obj: GameObject, ...args: any[]) => void): void;
    emitEvent(name: string, args: any[]): void;
}

export interface _Scene {
    readonly name: string;
    objects: _GameObject[];
    init(): void;
    remove(): void;
    update(dt: number): void;
    addObject(obj: _GameObject): void;
    objectAmount(): number;
    getObjectByName(name: string): GameObject | undefined
    getObjectsByName(name: string): GameObject[]
    removeObject(object: GameObject): void;
    removeObjects(...objects: GameObject[]): void;
    removeObjectByName(name: string): void;
    removeObjectsByName(...names: string[]): void;
}
export interface _SceneManager {
    setScenes(newScenes: _Scene[], defaultSelected?: number): void;
    addScene(scene: _Scene): void;
    changeScene(scene: string | number): void;
    update(dt: number): void;
    getScene<T>(): _Scene | undefined;
}
export interface _TextUtils {
    calculateBounds(
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        options?: {
            spaceWidth?: number;
            centered?: boolean;
        }
    ): Line[];
    calculateWidth(text: string, spaceWidth?: number): number;
    writeText(
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        options?: {
            color?: number;
            background?: number;
            spaceWidth?: number;
            centered?: boolean;
        }
    ): Line[];
    currentTextMasks: Font;
    addCharacterMask(character: string, mask: ImageMask): void;
    applyCharacterMap(map: Record<string, ImageMask | string>): void;
    clearCharacterMap(): void;
}
export interface ImageUtils {
    defaultPalette: ColorPalette;
    getCurrentPalette(): ColorPalette;
    setCurrentPalette(palette: ColorPalette): void;
    parseImage(image: string): Image;
    parseMask(content: string): ImageMask;
    getColor(
        color: number,
        palette?: ColorPalette
    ): Record<'r' | 'g' | 'b' | 'a', number>;
    applyImageMask(image: Image, mask: ImageMask): Image;
    applyImageMaskModifyImage(image: Image, mask: ImageMask): void;
    stringifyImage(img: Image): string;
    stringifyMask(mask: ImageMask): string;
    imgToPng(
        image: Image,
        type?: 'image/png' | 'image/jpeg' | 'image/webp'
    ): string;
    putImage(x: number, y: number, image: Image): void;
    putImageRaw(x: number, y: number, image: Image): void;
    isValidColor(color: number): boolean;
    square(width: number, height: number, color: number | string): Image;
    circle(radius: number, color: number | string): Image;
    serializeImage(img: Image): Uint8Array;
    unserializeImage(arr: Uint8Array): Image;
}
export interface Utils {
    nextFrame(): Promise<void>;
    download(url: string, filename: string): Promise<void>;
    isOnTimeout(name: string): boolean;
    timeout(name: string, ms: number): void;
}
export interface SaveFileUtils {
    storeToFile(obj: any, prefix?: string): void;
    readFromFile<T>(prefix?: string): T | undefined;
}
export interface _Math {
    distance(x: number, y: number): number;
    lerp(p0: number, p1: number, t: number): number;
}
export type Math = _Math;
export type GameObject = _GameObject;
export type Scene = _Scene;
export type SceneManager = _SceneManager;
export type TextUtils = _TextUtils;

export type gfxInstrument = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Instrument =
    | 'square-wave'
    | 'sine-wave'
    | 'triangle-wave'
    | 'sawtooth-wave'
    | 'noise'
    | `gfx${gfxInstrument}`;

export interface Audio {
    channel1: Uint8Array;
    channel2: Uint8Array;
    channel3: Uint8Array;
    channel4: Uint8Array;
    channel1Instrument: Instrument;
    channel2Instrument: Instrument;
    channel3Instrument: Instrument;
    channel4Instrument: Instrument;
    length: number;
}

export interface Sound {
    octave: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    sound: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
    halfToneStepUp: boolean;
}
export type SoundFunction = (
    vol: number,
    freq: number,
    time: number
) => Promise<void>;
export interface AudioUtils {
    readonly validNotes: string[];
    readonly validInstruments: Instrument[];
    /**
     * Specs:
     *
     * file: \<length>:\<instrument1>:\<instrument2>:\<instrument3>:\<instrument4>:\<sounds-for-channel1>:\<sounds-for-channel2>:\<sounds-for-channel3>:\<sounds-for-channel4>
     *
     * \<length>: ([0-9]+)
     *
     * \<sounds-for-channel#>: (\<sound>{0,length})
     *
     * \<sound>: ([A-G]\[0-8](#| ))
     *
     * \<instrument#>: ((square|sine|triangle|sawtooth)\-wave|noise|gfx-([0-9]|10))
     *
     * **Example**
     * ```plain
     *   ⌄ instrument 1          ⌄ instrument 3          ⌄ channel 1 sounds              ⌄ channel 3 sound
     * 5:square-wave:square-wave:sine-wave:sawtooth-wave:C4 D4 E4 F4 G4 :C5 D5 E5 F5 G5 :C4 D4 E4 F4 G4 :C4 D4 E4 F4 G4
     * ^ length      ^ instrument 2        ^ instrument 4                ^ channel 2 sounds              ^ channel 4 sounds
     * ```
     */
    parseAudio(text: string): Audio;
    /**
     * sound in memory:
     *
     * \<3 bit: note identifier, 0-6 (a-g)>\<4 bit: Octave Identifier, 0-8>\<1 bit: go half-tone up>
     */
    getSound(sound: number): Sound | undefined;
    soundToUint8(sound: Sound): number;
    serializeAudio(audio: Audio): Uint8Array;
    unserializeAudio(arr: Uint8Array): Audio;
    playSquareTune(vol: number, freq: number, time: number): Promise<void>;
    playSineTune(vol: number, freq: number, time: number): Promise<void>;
    playSawtoothTune(vol: number, freq: number, time: number): Promise<void>;
    playTriangleTune(vol: number, freq: number, time: number): Promise<void>;
    playNoise(vol: number, freq: number, time: number): Promise<void>;
    playTune(
        vol: number,
        freq: number,
        time: number,
        type: OscillatorType
    ): Promise<void>;
    getInstrumentSoundFunction(instrument: Instrument): SoundFunction;
    getFrequency(sound: Sound): number;
    playSound(
        sound: Sound,
        instrument: Instrument,
        vol: number,
        time: number
    ): Promise<void>;
    playAudio(audio: Audio, timePerNote: number, vol: number): Promise<void>;
}
export interface Particle {
    end: number;
    pos: Vec2;
    image: Image;
    gravity: number;
    force: Vec2;
    fallsOOB: boolean;
}
