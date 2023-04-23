import { HEIGHT, WIDTH } from '.';
import { Vec2 } from './gameObject';
import { Image, markAsDirty, putImage, square } from './imageUtils';

export interface Particle {
    end: number;
    pos: Vec2;
    image: Image;
    gravity: number;
    force: Vec2;
    fallsOOB: boolean;
}

const particles: Particle[] = [];

export function addParticle(
    life: number,
    pos: Vec2,
    size: number,
    color: number,
    gravity: number,
    force: Vec2,
    oob?: boolean
) {
    particles.push({
        end: life < 0 ? -1 : Date.now() + life,
        force,
        gravity,
        image: square(size, size, color),
        pos,
        fallsOOB: !!oob,
    });

    return particles[particles.length - 1];
}

function particleCanBeRemoved(p: Particle) {
    if (p.end >= 0) return Date.now() > p.end;
    return Math.abs(p.force.y) < 0.1 && p.pos.y === HEIGHT - p.image.height;
}

let oldAmountParticles = 0;

export function updateParticles(dt: number) {
    if (oldAmountParticles !== particles.length) markAsDirty();
    oldAmountParticles = particles.length;

    for (let i = 0; i < particles.length; ++i) {
        if (particleCanBeRemoved(particles[i])) {
            if (i === 0) {
                while (particles[0] && particleCanBeRemoved(particles[0]))
                    particles.shift();
                i = -1;
            } else if (i === particles.length - 1) {
                while (
                    particles[0] &&
                    particleCanBeRemoved(particles[particles.length - 1])
                )
                    particles.pop();
            }
            continue;
        }
        particles[i].force.y += particles[i].gravity * (0.1 * dt);

        particles[i].pos.y += particles[i].force.y;
        particles[i].pos.x += particles[i].force.x;

        if (
            !particles[i].fallsOOB &&
            particles[i].pos.y + particles[i].image.height >= HEIGHT
        ) {
            particles[i].pos.y = HEIGHT - particles[i].image.height;
            particles[i].force.y *= -0.7;
        }
        if (!particles[i].fallsOOB && particles[i].pos.y < 0) {
            particles[i].pos.y = 0;
            particles[i].force.y *= -0.7;
        }
        if (
            !particles[i].fallsOOB &&
            particles[i].pos.x + particles[i].image.width >= WIDTH
        ) {
            particles[i].force.x *= -1;
            particles[i].pos.x = WIDTH - particles[i].image.width;
        }
        if (!particles[i].fallsOOB && particles[i].pos.x < 0) {
            particles[i].force.x *= -1;
            particles[i].pos.x = 0;
        }

        putImage(particles[i].pos.x, particles[i].pos.y, particles[i].image);
    }
}
export function removeParticle(p: Particle) {
    p.end = 0;
}
