#!/usr/bin/env node
import { help } from './modules/help';
import { init } from './modules/init';
import { dev } from './modules/dev';
import { build } from './modules/build';
import chalk from 'chalk';

if (
    process.argv.length !== 3 ||
    process.argv[2] === 'h' ||
    process.argv[2] === 'help'
)
    help();

const moduleMap: Record<string, Function> = {
    init,
    dev,
    build,
    i: init,
    d: dev,
    b: build,
};

if (!moduleMap[process.argv[2]]) {
    console.log(chalk.redBright('No command found!'));
    help();
}
moduleMap[process.argv[2]]();
