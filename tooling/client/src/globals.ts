export default `
/**
 *
 * EXPORTS
 *
 */
declare function registerGame(game: GameFile): void;
declare const fonts: Record<"default" | "default_monospace" | "legacy", Font>;
declare const imageUtils: ImageUtils;
declare const audioUtils: AudioUtils;
declare const utils: Utils;
declare const ImageRenderer: Component<void>;
declare const createComponent: <T>(component: Component<T>, data?: Partial<T> | undefined) => ComponentEntry<T>;
declare const component: <T>(component: Component<T>, data?: Partial<T> | undefined) => ComponentEntry<T>;
declare const comp: <T>(component: Component<T>, data?: Partial<T> | undefined) => ComponentEntry<T>;
declare const GameObject: new (opts: GameObjectOptions) => _GameObject;
declare const memory: Uint8Array;
declare const isPressed: (button: Button) => boolean;
declare const buttons: Record<Button, {
    down: boolean;
    press: boolean;
}>;
declare const WIDTH: number;
declare const HEIGHT: number;
declare const stopGame: () => void;
declare const reset: () => void;
declare const math: _Math;
declare const saveFile: SaveFileUtils;
declare const Scene: new <T extends Record<string, any>>(scene: UserScene<T>) => _Scene;
declare const SceneManager: _SceneManager;
declare const TextUtils: _TextUtils;
/**
 *
 * TYPES
 *
 */
type Font = Record<string, ImageMask>;
type Button = 'up' | 'down' | 'left' | 'right' | 'u' | 'i' | 'o' | 'p';
interface Vec2 {
    x: number;
    y: number;
}
interface Vec3 {
    x: number;
    y: number;
    z: number;
}
interface Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
}
interface Transform {
    position: Vec2;
}
interface Component<Config = void> {
    init(config: Partial<Config> | undefined, gameObject: _GameObject): Config;
    update?(config: Config, dt: number, ctx: CanvasRenderingContext2D, gameObject: _GameObject): void;
    remove?(config: Config, gameObject: _GameObject): void;
    readonly name: string;
}
interface GameObjectOptions {
    name: string;
    image: Image | string;
    mask?: ImageMask | string;
    components?: ComponentEntry<any>[];
    opacity?: number;
    transform?: Partial<Transform>;
    customRenderer?: boolean;
}
type ComponentEntry<T> = {
    component: Component<T>;
    config?: Partial<T>;
};
interface UserScene<T> {
    beforeInit(scene: _Scene): T;
    afterInit?(config: T, scene: _Scene): void;
    beforeUpdate?(config: T, scene: _Scene, dt: number, ctx: CanvasRenderingContext2D): void;
    afterUpdate?(config: T, scene: _Scene, dt: number, ctx: CanvasRenderingContext2D): void;
    beforeRemove?(config: T, scene: _Scene): void;
    afterRemove?(config: T, scene: _Scene): void;
    gameObjects: _GameObject[];
    name: string;
}
interface Line {
    readonly y: number;
    readonly start: number;
    readonly end: number;
}
type ColorPalette = [
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
interface Image {
    width: number;
    height: number;
    buf: Uint8Array;
}
interface ImageMask {
    width: number;
    height: number;
    buf: Uint8Array;
}
interface GameFile {
    name: string;
    palette?: ColorPalette;
    bg: string;
    init?(): void;
    update?(dt: number, ctx: CanvasRenderingContext2D): void;
    remove?(): void;
    scenes?: _Scene[];
    defaultScene?: number;
}
/**
 *
 * INTERNAL TYPES
 *
 */
interface _GameObject {
    active: boolean;
    addComponents<T>(components: ComponentEntry<T>[]): void;
    transform: Transform;
    image: Image;
    mask?: ImageMask;
    opacity: number;
    removeComponent(component: string): void;
    getComponent<T extends Component<any>>(component: string): T | undefined;
    remove(): void;
    init(): void;
    render(dt: number, ctx: CanvasRenderingContext2D): void;
}
interface _Scene {
    readonly name: string;
    init(): void;
    remove(): void;
    update(dt: number, ctx: CanvasRenderingContext2D): void;
    addObject(obj: _GameObject): void;
}
interface _SceneManager {
    setScenes(newScenes: _Scene[], defaultSelected?: number): void;
    addScene(scene: _Scene): void;
    changeScene(scene: string | number): void;
    update(dt: number, ctx: CanvasRenderingContext2D): void;
    getScene<T>(): _Scene | undefined;
}
interface _TextUtils {
    writeText(text: string, ctx: CanvasRenderingContext2D, x: number, y: number, maxWidth: number, options?: {
        palette?: ColorPalette;
        color?: number;
        background?: number;
        spaceWidth?: number;
    }): Line[];
    currentTextMasks: Font;
    addCharacterMask(character: string, mask: ImageMask): void;
    applyCharacterMap(map: Record<string, ImageMask | string>): void;
    clearCharacterMap(): void;
}
interface ImageUtils {
    defaultPalette: ColorPalette;
    getCurrentPalette(): ColorPalette;
    setCurrentPalette(palette: ColorPalette): void;
    parseImage(image: string): Image;
    parseMask(content: string): ImageMask;
    getColor(color: number, palette?: ColorPalette): Record<'r' | 'g' | 'b' | 'a', number>;
    imgToImageData(img: Image, palette?: ColorPalette): ImageData | null;
    applyImageMask(image: Image, mask: ImageMask): Image;
    applyImageMaskModifyImage(image: Image, mask: ImageMask): void;
    stringifyImage(img: Image): string;
    stringifyMask(mask: ImageMask): string;
    imgToPng(image: Image, type?: 'image/png' | 'image/jpeg' | 'image/webp'): string;
    blendImageData(data1: ImageData, data2: ImageData): void;
    blendImageDataR(data1: ImageData, data2: ImageData): void;
    putImageData(ctx: CanvasRenderingContext2D, data: ImageData | null, x: number, y: number): void;
    isValidColor(color: number): boolean;
    square(width: number, height: number, color: number | string): Image;
    circle(radius: number, color: number | string): Image;
    serializeImage(img: Image): Uint8Array;
    unserializeImage(arr: Uint8Array): Image;
}
interface Utils {
    nextFrame(): Promise<void>;
    download(url: string, filename: string): Promise<void>;
    isOnTimeout(name: string): boolean;
    timeout(name: string, ms: number): void;
}
interface SaveFileUtils {
    storeToFile(obj: any, prefix?: string): void;
    readFromFile<T>(prefix?: string): T | undefined;
}
interface _Math {
    distance(x: number, y: number): number;
    lerp(p0: number, p1: number, t: number): number;
}
type Math = _Math;
type GameObject = _GameObject;
type Scene = _Scene;
type SceneManager = _SceneManager;
type TextUtils = _TextUtils;
type gfxInstrument = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Instrument = 'square-wave' | 'sine-wave' | 'triangle-wave' | 'sawtooth-wave' | 'noise' | \`gfx\${gfxInstrument}\`;
interface Audio {
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
interface Sound {
    octave: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    sound: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
    halfToneStepUp: boolean;
}
type SoundFunction = (vol: number, freq: number, time: number) => Promise<void>;
interface AudioUtils {
    readonly validNotes: string[];
    readonly validInstruments: Instrument[];
    /**
     * Specs:
     *
     * file: \\<length>:\\<instrument1>:\\<instrument2>:\\<instrument3>:\\<instrument4>:\\<sounds-for-channel1>:\\<sounds-for-channel2>:\\<sounds-for-channel3>:\\<sounds-for-channel4>
     *
     * \\<length>: ([0-9]+)
     *
     * \\<sounds-for-channel#>: (\\<sound>{0,length})
     *
     * \\<sound>: ([A-G]\\[0-8](#| ))
     *
     * \\<instrument#>: ((square|sine|triangle|sawtooth)\\-wave|noise|gfx-([0-9]|10))
     *
     * **Example**
     * \`\`\`plain
     *   ⌄ instrument 1          ⌄ instrument 3          ⌄ channel 1 sounds              ⌄ channel 3 sound
     * 5:square-wave:square-wave:sine-wave:sawtooth-wave:C4 D4 E4 F4 G4 :C5 D5 E5 F5 G5 :C4 D4 E4 F4 G4 :C4 D4 E4 F4 G4
     * ^ length      ^ instrument 2        ^ instrument 4                ^ channel 2 sounds              ^ channel 4 sounds
     * \`\`\`
     */
    parseAudio(text: string): Audio;
    /**
     * sound in memory:
     *
     * \\<3 bit: note identifier, 0-6 (a-g)>\\<4 bit: Octave Identifier, 0-8>\\<1 bit: go half-tone up>
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
    playTune(vol: number, freq: number, time: number, type: OscillatorType): Promise<void>;
    getInstrumentSoundFunction(instrument: Instrument): SoundFunction;
    getFrequency(sound: Sound): number;
    playSound(sound: Sound, instrument: Instrument, vol: number, time: number): Promise<void>;
    playAudio(audio: Audio, timePerNote: number, vol: number): Promise<void>;
}`;