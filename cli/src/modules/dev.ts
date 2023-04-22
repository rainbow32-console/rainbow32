import { build } from './build';
import watch from 'node-watch';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

let building = false;

function watchCb(_ev: string, filename: string) {
    if (building || !filename.endsWith('.ts') || filename.endsWith('.d.ts'))
        return;
    building = true;
    const start = Date.now();
    console.log(chalk.yellow('[DEV]: Rebuilding...'));
    build()
        .then(() => {
            building = false;
            console.log(
                chalk.yellow('[DEV]: Rebuild took %s ms'),
                Date.now() - start
            );
            return readFile(join(process.cwd(), 'dist', 'game.js'));
        })
        .then((buf) => onchange(JSON.stringify(buf.toString())));
}

let onchange = (value: string) => {};

export function dev() {
    if (existsSync(join(process.cwd(), 'assets')))
        watch(join(process.cwd(), 'assets'), { recursive: true }, watchCb);
    if (existsSync(join(process.cwd(), 'src')))
        watch(join(process.cwd(), 'src'), { recursive: true }, watchCb);
    console.log(chalk.yellow('[DEV]: Watching'));

    const server = express();

    server.get('/', (req, res) => {
        readFile(join(__dirname, '..', 'refs', 'packaged.html.txt')).then((f) =>
            res.send(
                f
                    .toString()
                    .replace(
                        '<!--customcode-->',
                        "<script>new EventSource('/events').addEventListener('message', ev => {console.log('Reloaded!');loadGameByContents(JSON.parse(ev.data))});window.startGame = () => {fetch(window.location.origin + '/script').then(res => res.text()).then(t => loadGameByContents(t))}</script>"
                    )
            )
        );
    });

    server.get('/events', (req, res) => {
        res.set({
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
        });
        res.flushHeaders();
        res.write('retry: 10000\n\n');

        onchange = (value) => res.write('data: ' + value + '\n\n');
        readFile(join(process.cwd(), 'dist', 'game.js')).then((buf) =>
            onchange(JSON.stringify(buf.toString()))
        );
    });

    server.get('/script', (req, res) =>
        readFile(join(process.cwd(), 'dist', 'game.js')).then((buf) =>
            res.send(buf.toString())
        )
    );

    server.listen(8000, () =>
        console.log(chalk.yellow('[DEV]: Listening on http://localhost:8000'))
    );
    watchCb('', 'a.ts');
}
