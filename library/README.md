# Rainbow32 library

A simple library for interacting with the rainbow32 console.

## /

### fonts

A list of fonts

### ImageRenderer

The default rendering component

### createComponent/component/comp

A function to create a component. Pass the component as the first and the config as the second parameter

### GameObject

The constructor for a GameObject

Typedef gameobject:

```ts
interface GameObject {
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
```

### memory

The memory (uint8Array)

Layout:

first 8 bits: Button states

| bit # | Button  |
| ----- | ------- |
| 1     | `up`    |
| 2     | `down`  |
| 3     | `left`  |
| 4     | `right` |
| 5     | `u`     |
| 6     | `i`     |
| 7     | `o`     |
| 8     | `p`     |

### isPressed

Checks if a button is pressed

### buttons

The button object. Contains each button. A button has a `down` and `press` property. The `press` property is for 1 tick set, while the `down` property is for the whole length of the press set

### WIDTH/HEIGHT

The width and height of the screen

### stopGame/reset

Stops the currently running game. Calls all remove() functions (Game, current scene and gameobjects)

### Scene

The scene Constructor. Takes UserScene&lt;T&gt;.

Typedef:

```ts
interface UserScene<T> {
    beforeInit(scene: _Scene): T;
    afterInit?(config: T, scene: _Scene): void;
    beforeUpdate?(
        config: T,
        scene: _Scene,
        dt: number,
        ctx: CanvasRenderingContext2D
    ): void;
    afterUpdate?(
        config: T,
        scene: _Scene,
        dt: number,
        ctx: CanvasRenderingContext2D
    ): void;
    beforeRemove?(config: T, scene: _Scene): void;
    afterRemove?(config: T, scene: _Scene): void;
    gameObjects: _GameObject[];
    name: string;
}

interface Scene {
    readonly name: string;
    init(): void;
    remove(): void;
    update(dt: number, ctx: CanvasRenderingContext2D): void;
    addObject(obj: _GameObject): void;
}
```

## /imageUtils

### parseImage

Parses a image. Format:

`Width:Height:data`. The data is each row's color in base32. A space is 0xff (invisible).

Example:

`parseImage('5:5:0308080808080808080808080')` evaluates to an image that looks like this:

```
⬛🟦⬛⬜⬛
⬜⬛⬜⬛⬜
⬛⬜⬛⬜⬛
⬜⬛⬜⬛⬜
⬛⬜⬛⬜⬛
```

### applyImageMask

Applies an imagemask to an image

### applyImageMaskModifyImage

Applies an imagemask to an image. This will change the image itself

### blendImageData

This takes 2 ImageData and blend them while modifying the first image data.

### blendImageDataR

This takes 2 ImageData and blend them while modifying the first second data.

### circle

This takes the radius and color and generates an image containing a circle

### defaultPalette

This variable houses the default color palette

### getColor

This returns the rgba values of a color in a specified color palette. Specify the color as the first and the palette as the second argument.

### getCurrentPalette

Gets the currently selected color palette

### imgToImageData

Turns an image into image data that can be put on the scene

### isValidColor

Returns a boolean indicating if the supplied color-number is valid

### parseMask

Parses a mask. Works the same as the image, just that everything that is not a space or 0 is indicating that the mask is visible on that spot

### putImageData

Puts imagedata at a point on the screen. Blends with the background image, unlike ctx.putImageData.

Arguments: `ctx` (canvasContext2d), `data` (ImageData|null), x (number), y (number)

### setCurrentPalette

Sets the currently selected color palette. Works automatically if one is specified in the game config

### square

Generates a filled image. Pass the width, height and color in that sequence.

### stringifyImage/stringifyMask

Stringifies and image/mask

## /math

### distance

Computes the distance from x to y. Specify it in that sequence to the function

### lerp

A standard lerp function. Takes p0, p1 and t in that sequence

## /saveFile

### readFromFile

Reads from a file. Specify the optional prefix as the first parameter, if you have multiple files (iex, you could have a paint program, that allows the user to have multiple saveslots, so you can specify the current save slot as the prefix)

### storeToFile

Stores to a file. Specify the data as the first parameter, and the optional prefix in the second one

## /sceneManager

### addScene

Adds a scene to the scenemanager

### changeScene

Changes the currently selected scene.

### getScene

Gets the currently selected scene

### setScenes

Sets the scenes. If you want to select a scene that is not the first one, specify the index in the 2nd parameter

### update

Updates/renders the currently selected scene. Pass the deltatime (ms) and ctx (canvasRenderingContext2d) in that sequence.

## /soundManager

### getSoundPath

Gets the dataurl for a specified sound

### getSounds

returns a record of the name and data url of all registered sounds

### playAudio

Plays an audio from a specified path or data url. Takes the options as the optional first parameter and returns an AudiooControls object.

typedef:

```ts
interface AudioControls {
    stop(): void;
    play(): void;
    pause(): void;
    stop(): void;
    element: HTMLAudioElement;
    adjustOptions(options: AudioOptions): void;
}
interface AudioOptions {
    speed?: number;
    loop?: boolean;
    volume?: number;
}
```

### playSound

Works the same as playAudio, just that instead of the path/data url, it takes the sound name

### registerSound

Register a soundname for a (data) url

## /textUtils

### addCharacterMask

Sets the imagemask for a character. Specify the character and then the image mask. Has to be 5 high and 1-5 wide

### applyCharacterMap

Applies a font/character map

### clearCharacterMap

Clears the charmap

### currentTextMasks

The current text masks

### writeText

Writes text.

Typedef:

```ts
interface Line {
    readonly y: number;
    readonly start: number;
    readonly end: number;
}

function writeText(
    text: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maxWidth: number,
    options?: {
        palette?: ColorPalette;
        color?: number;
        background?: number;
        spaceWidth?: number;
    }
): Line[];
```

## /utils

### download

Downloads a (data) url. Specify the url as the first and the filename as the second parameter

### isOnTimeout

Checks if a feature is on timeout. Specify the featurename as the first parameter

### timeout

Timeouts a feature for the specified amount of time in milliseconds. Pass the name as the first and the time as the second parameter.

### nextFrame

Provides a promise that returns on the next frame

### playAudio

See: /soundManager