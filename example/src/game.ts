import { registerGame } from 'library';
import { CharacterScene } from './scenes/characterScene';
import { ColorPaletteScene } from './scenes/colorPaletteScene';
import { MainScene } from './scenes/Main';
import { OpacityScene } from './scenes/opacityScene';
import { parseAudio, Instrument, Sound, playAudio } from 'library/audioUtils';

function audio(
    length: number,
    channels: {
        instrument: Instrument;
        notes: string[];
    }[]
): string {
    return `${length}:${channels[0]?.instrument || 'square-wave'}:${
        channels[1]?.instrument || 'square-wave'
    }:${channels[2]?.instrument || 'square-wave'}:${
        channels[3]?.instrument || 'square-wave'
    }:${channels[0]?.notes.join('') || ''}:${
        channels[1]?.notes.join('') || ''
    }:${channels[2]?.notes.join('') || ''}:${
        channels[3]?.notes.join('') || ''
    }`;
}

function note(
    note: Sound['sound'],
    octave: Sound['octave'],
    halfToneUp?: boolean
): string {
    return `${note}${octave}${halfToneUp ? '#' : ' '}`;
}

registerGame({
    name: 'Test game',
    bg: '#ffffff',
    scenes: [MainScene, CharacterScene, ColorPaletteScene, OpacityScene],
    defaultScene: 2,
    init() {
        const $audio = audio(25, [
            {
                instrument: 'square-wave',
                notes: [
                    note('c', 4),
                    note('d', 4),
                    note('e', 4),
                    note('f', 4),
                    note('g', 4),
                    note('a', 4),
                    note('b', 4),
                    note('c', 5),
                    note('d', 5),
                    note('e', 5),
                    note('f', 5),
                    note('g', 5),
                    note('a', 5),
                    note('b', 5),
                    note('c', 6),
                    note('d', 6),
                    note('e', 6),
                    note('f', 6),
                    note('g', 6),
                    note('a', 6),
                    note('b', 6),
                    note('c', 7),
                    note('d', 7),
                    note('e', 7),
                    note('f', 7),
                ],
            },
        ]);
        const track = parseAudio($audio);

        playAudio(track, 0.01, 0.5);
    },
});
