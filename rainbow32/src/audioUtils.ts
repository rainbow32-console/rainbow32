import { frequencyMap } from './frequencyMap';
import { sleep } from './utils';

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

export const validNotes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
export const validInstruments: Instrument[] = [
    'square-wave',
    'sine-wave',
    'triangle-wave',
    'sawtooth-wave',
    'noise',
    'gfx0',
    'gfx1',
    'gfx2',
    'gfx3',
    'gfx4',
    'gfx5',
    'gfx6',
    'gfx7',
    'gfx8',
    'gfx9',
    'gfx10',
];

function parseSound(sound: string): number {
    if (sound === '   ') return 0;
    if (!validNotes.includes(sound[0]))
        throw new Error('Invalid State: Note is not valid (' + sound[0] + ')');
    const octave = Number(sound[1]);
    if (isNaN(octave) || octave < 0 || octave > 8)
        throw new Error(
            'Invalid State: Octave is out-of-bounds or NaN (' + octave + ')'
        );
    return soundToUint8({
        sound: sound[0] as 'a',
        octave: octave as 0,
        halfToneStepUp: sound[2] === '#',
    });
}

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
export function parseAudio(text: string): Audio {
    let i = 0;
    let lengthStr = '';
    while (true) {
        if (!text[i]) break;
        else if (text[i] === ':') break;
        else lengthStr += text[i++];
    }
    if (text[i++] !== ':')
        throw new Error(
            'Error while parsing length: Expected number or `:`, but found undefined'
        );
    let length = Number(lengthStr);
    if (isNaN(length))
        throw new Error('Error whilst parsing length: Length is not a number');
    if (!isFinite(length))
        throw new Error('Error whilst parsing length: Length is not finite');
    if (length > 255 || length < 0)
        throw new Error('Error whilst parsing length: Length is not 0-255');

    let instrument = 0;
    const instruments: Instrument[] = [];
    let tmpInstrStr = '';
    while (true) {
        if (!text[i]) break;
        if (text[i] !== ':') tmpInstrStr += text[i];
        else {
            if (!validInstruments.includes(tmpInstrStr as Instrument))
                throw new Error('Invalid Instrument: ' + tmpInstrStr);
            instruments.push(tmpInstrStr as Instrument);
            instrument++;
            tmpInstrStr = '';
            if (instrument > 3) break;
        }
        i++;
    }
    if (text[i++] !== ':')
        throw new Error(
            'Invalid State: Failed to parse instrument ' +
                (instrument + 1) +
                ': Expected `:`, but found nothing'
        );

    const sounds1Off = text.indexOf(':', i);
    const sounds2Off = text.indexOf(':', sounds1Off + 1);
    const sounds3Off = text.indexOf(':', sounds2Off + 1);

    if (sounds1Off === -1)
        throw new Error(
            'Invalid State: Failed to parse sounds for channel1: Expected `:` but found nothing'
        );
    if (sounds2Off === -1)
        throw new Error(
            'Invalid State: Failed to parse sounds for channel2: Expected `:` but found nothing'
        );
    if (sounds3Off === -1)
        throw new Error(
            'Invalid State: Failed to parse sounds for channel3: Expected `:` but found nothing'
        );

    const soundData1 = text.substring(i, sounds1Off);
    const soundData2 = text.substring(sounds1Off + 1, sounds2Off);
    const soundData3 = text.substring(sounds2Off + 1, sounds3Off);
    const soundData4 = text.substring(sounds3Off + 1, text.length);

    if (soundData1.length % 3 !== 0)
        throw new Error(
            'Length of sounds for channel 1 is not a multiple of 3'
        );
    if (soundData2.length % 3 !== 0)
        throw new Error(
            'Length of sounds for channel 2 is not a multiple of 3'
        );
    if (soundData3.length % 3 !== 0)
        throw new Error(
            'Length of sounds for channel 3 is not a multiple of 3'
        );
    if (soundData4.length % 3 !== 0)
        throw new Error(
            'Length of sounds for channel 4 is not a multiple of 3'
        );

    const channel1 = new Uint8Array(length);
    const channel2 = new Uint8Array(length);
    const channel3 = new Uint8Array(length);
    const channel4 = new Uint8Array(length);

    for (let i = 0; i < length; ++i) {
        if (soundData1[i * 3])
            channel1[i] = parseSound(soundData1.substring(i * 3, i * 3 + 3));
        if (soundData2[i * 3])
            channel2[i] = parseSound(soundData2.substring(i * 3, i * 3 + 3));
        if (soundData3[i * 3])
            channel3[i] = parseSound(soundData3.substring(i * 3, i * 3 + 3));
        if (soundData4[i * 3])
            channel4[i] = parseSound(soundData4.substring(i * 3, i * 3 + 3));
    }

    return {
        length,
        channel1,
        channel2,
        channel3,
        channel4,
        channel1Instrument: instruments[0],
        channel2Instrument: instruments[1],
        channel3Instrument: instruments[2],
        channel4Instrument: instruments[3],
    };
}

/**
 * sound in memory:
 *
 * \<3 bit: note identifier, 0-6 (a-g)>\<4 bit: Octave Identifier, 0-8>\<1 bit: go half-tone up>
 */
export function getSound(sound: number): Sound | undefined {
    const identifier = (sound & 0b11100000) >> 5;
    const octave = ((sound & 0b00011110) >> 1) - 1;
    const halfTone = !!(sound & 0b1);
    if (identifier < 0 || identifier > 6) return;
    if (octave < 0 || octave > 8) return;

    return {
        halfToneStepUp: halfTone,
        octave: octave as Sound['octave'],
        sound: String.fromCharCode(
            97 /*'a' char-code*/ + identifier
        ) as Sound['sound'],
    };
}

export function soundToUint8(sound: Sound): number {
    return (
        ((sound.sound.charCodeAt(0) - 97) /*'a' char code*/ << 5) |
        ((sound.octave + 1) << 1) |
        (sound.halfToneStepUp ? 1 : 0)
    );
}

export function serializeAudio(audio: Audio): Uint8Array {
    const arr = new Uint8Array(audio.length * 4 + 3);
    // <8 bit length> <4 bit instrument 1> <4 bit instrument 2> <4 bit instrument 3> <4 bit instrument 4>
    // <length*8 bit sound for channel 1> <length*8 bit sound for channel 2> <length*8 bit sound for channel 3> <length*8 bit sound for channel 4>

    arr[0] = audio.length;
    arr[1] =
        (validInstruments.indexOf(audio.channel1Instrument) << 4) |
        validInstruments.indexOf(audio.channel2Instrument);
    arr[2] =
        (validInstruments.indexOf(audio.channel3Instrument) << 4) |
        validInstruments.indexOf(audio.channel4Instrument);

    for (let i = 0; i < audio.length; ++i) {
        arr[i + 3] = audio.channel1[i];
        arr[i * 2 + 3] = audio.channel2[i];
        arr[i * 3 + 3] = audio.channel3[i];
        arr[i * 4 + 3] = audio.channel4[i];
    }

    return arr;
}

export function unserializeAudio(arr: Uint8Array): Audio {
    if (arr.length < 3)
        throw new Error('Array too little (has to be at least 3 bytes)');
    const length = arr[0];
    if (arr.length !== length * 4 + 3)
        throw new Error(
            'Array does not have enough space to house all the channel data'
        );

    return {
        length,
        channel1Instrument: validInstruments[(arr[1] & 0xf) >> 4],
        channel2Instrument: validInstruments[arr[1] & 0x0f],
        channel3Instrument: validInstruments[(arr[1] & 0xf) >> 4],
        channel4Instrument: validInstruments[arr[1] & 0x0f],
        channel1: arr.subarray(length + 3, length * 2 + 2),
        channel2: arr.subarray(length * 2 + 3, length * 3 + 2),
        channel3: arr.subarray(length * 3 + 3, length * 4 + 2),
        channel4: arr.subarray(length * 4 + 3, length * 5 + 2),
    };
}

type SoundFunction = (vol: number, freq: number, time: number) => Promise<void>;
function playSquareTune(
    vol: number,
    freq: number,
    time: number
): Promise<void> {
    return playTune(vol, freq, time, 'square');
}
function playSineTune(vol: number, freq: number, time: number): Promise<void> {
    return playTune(vol, freq, time, 'sine');
}
function playSawtoothTune(
    vol: number,
    freq: number,
    time: number
): Promise<void> {
    return playTune(vol, freq, time, 'sawtooth');
}
function playTriangleTune(
    vol: number,
    freq: number,
    time: number
): Promise<void> {
    return playTune(vol, freq, time, 'triangle');
}
let ctx = new AudioContext();
function playTune(
    vol: number,
    freq: number,
    time: number,
    type: OscillatorType
): Promise<void> {
    if (ctx.state !== 'running')
        return new Promise((_, rej) =>
            rej(new Error('Audiocontext is closed!'))
        );
    const node = new OscillatorNode(ctx, {
        type,
        frequency: freq,
    });
    const gainNode = ctx.createGain();
    gainNode.gain.value = vol;
    gainNode.connect(ctx.destination);
    node.connect(gainNode);
    node.start(0);
    setTimeout(() => {
        node.stop();
        node.disconnect();
        gainNode.disconnect();
    }, time * 1000);
    return sleep(time * 1000);
}
function playNoise(vol: number, freq: number, time: number): Promise<void> {
    if (ctx.state !== 'running')
        return new Promise((_, rej) =>
            rej(new Error('Audiocontext is closed!'))
        );
    const bufferSize = ctx.sampleRate * time; // set the time of the note

    // Create an empty buffer
    const buffer = new AudioBuffer({
        length: bufferSize,
        sampleRate: ctx.sampleRate,
    });

    // Fill the buffer with noise
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    // Create a buffer source for our created data
    const noise = new AudioBufferSourceNode(ctx, {
        buffer,
    });

    // Filter the output
    const bandpass = new BiquadFilterNode(ctx, {
        type: 'bandpass',
        frequency: freq + 300,
    });

    const gainNode = ctx.createGain();
    gainNode.gain.value = vol;
    gainNode.connect(ctx.destination);
    // Connect our graph
    noise.connect(bandpass).connect(gainNode);
    noise.start(0);
    setTimeout(() => {
        noise.stop();
        noise.disconnect();
        gainNode.disconnect();
    }, time * 1000);
    return sleep(time * 1000);
}

export function getInstrumentSoundFunction(
    instrument: Instrument
): SoundFunction {
    if (instrument.startsWith('gfx'))
        throw new Error("GFX isn't supported yet!");
    if (instrument === 'triangle-wave') return playTriangleTune;
    if (instrument === 'square-wave') return playSquareTune;
    if (instrument === 'sine-wave') return playSineTune;
    if (instrument === 'sawtooth-wave') return playSawtoothTune;
    if (instrument === 'noise') return playNoise;
    throw new Error('Cannot play instrument ' + instrument);
}

export function getFrequency(sound: Sound): number {
    return frequencyMap[sound.octave][
        sound.sound.toUpperCase() + (sound.halfToneStepUp ? '#' : '')
    ];
}

export function playSound(
    sound: Sound,
    instrument: Instrument,
    vol: number,
    time: number
): Promise<void> {
    return getInstrumentSoundFunction(instrument)(
        vol,
        getFrequency(sound),
        time
    );
}

export async function playAudio(
    audio: Audio,
    timePerNote: number,
    vol: number
): Promise<void> {
    const audio1Fn = getInstrumentSoundFunction(audio.channel1Instrument);
    const audio2Fn = getInstrumentSoundFunction(audio.channel2Instrument);
    const audio3Fn = getInstrumentSoundFunction(audio.channel3Instrument);
    const audio4Fn = getInstrumentSoundFunction(audio.channel4Instrument);

    for (let i = 0; i < audio.length; ++i) {
        const sound1 = getSound(audio.channel1[i]);
        const sound2 = getSound(audio.channel2[i]);
        const sound3 = getSound(audio.channel3[i]);
        const sound4 = getSound(audio.channel4[i]);

        if (sound1) audio1Fn(vol, getFrequency(sound1), timePerNote);
        if (sound2) audio2Fn(vol, getFrequency(sound2), timePerNote);
        if (sound3) audio3Fn(vol, getFrequency(sound3), timePerNote);
        if (sound4) audio4Fn(vol, getFrequency(sound4), timePerNote);

        await sleep(timePerNote * 1000);
    }
}

export function unloadMusic() {
    ctx.suspend();
}

export async function loadMusic(): Promise<void> {
    if (ctx.state === 'running') return;
    else if (ctx.state === 'closed') {
        ctx = new AudioContext();
        return;
    }
    try {
        await ctx.resume();
    } catch {}
}

export function recreateContext() {
    ctx = new AudioContext();
}

export function contextState() {
    return ctx.state;
}