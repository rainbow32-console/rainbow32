import inquirer from 'inquirer';
import chalk from 'chalk';
import { join } from 'path';
import { access, constants, mkdir, writeFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import { spawn } from '../utils';

function checkPackageManager(manager: string): boolean {
    console.log(chalk.greenBright('Checking your package manager'));
    const process = spawnSync(manager, ['-v']);
    return !(process.error || process.status !== 0);
}

export async function init() {
    const { name, pacman, usegit } = await inquirer.prompt([
        {
            name: 'name',
            message: 'The name of your project',
            type: 'input',
        },
        {
            name: 'pacman',
            message: 'Choose your Package Manager',
            type: 'list',
            choices: ['npm', 'pnpm', 'yarn'],
        },
        {
            name: 'usegit',
            message: 'Initialize git repository?',
            type: 'confirm',
        },
    ]);

    if (!checkPackageManager(pacman))
        return console.error(
            chalk.redBright('The specified package manager is not installed')
        );

    if (name.includes('/') || name.includes('\\'))
        return console.error(
            chalk.redBright('Your name cannot include / or \\')
        );

    const packageJSON =
        '{\n    "name": ' +
        JSON.stringify(name) +
        ',\n    "scripts": {\n         "dev": "rainbow32 dev",\n        "build": "rainbow32 build"\n    }\n}';

    const newDir = join(process.cwd(), name);
    try {
        await access(newDir, constants.R_OK);
        return console.error(
            chalk.redBright('A directory with this name already exists!')
        );
    } catch {}

    console.log(chalk.greenBright('Initializing directory...'));

    await mkdir(newDir);
    await writeFile(join(newDir, 'package.json'), packageJSON);
    await writeFile(
        join(newDir, 'tsconfig.json'),
        '{"compilerOptions": {"target": "es2021","module": "commonjs","moduleResolution": "node","esModuleInterop": true,"forceConsistentCasingInFileNames": true,"strict": true,"skipLibCheck": true}}'
    );
    await mkdir(join(newDir, 'assets'));
    await mkdir(join(newDir, 'src'));
    await mkdir(join(newDir, 'src', 'assets'));
    await mkdir(join(newDir, 'src', 'components'));
    await mkdir(join(newDir, 'src', 'scenes'));
    await writeFile(
        join(newDir, '.gitignore'),
        'dist/\nnode_modules/\nsrc/assets/index.js\n'
    );
    await writeFile(
        join(newDir, 'src', 'assets', 'index.d.ts'),
        "/*\n * WARNING\n * This file was autogenerated. Don't change it.\n * WARNING\n */\nexport function getAsset(path: string): string;export const assets: Record<string, string>;"
    );
    await writeFile(
        join(newDir, 'src', 'game.ts'),
        "import { MainScene } from './scenes/main';\nimport { registerGame } from 'rainbow32-lib';\n\nregisterGame({\n    name: " +
            JSON.stringify(name) +
            ",\n    bg: '#ffffff',\n    scenes: [MainScene],\n    defaultScene: 1,\n});"
    );
    await writeFile(
        join(newDir, 'src', 'scenes', 'main.ts'),
        "import { WIDTH, Scene, } from 'rainbow32-lib';\nimport { writeText } from 'rainbow32-lib/textUtils';\n\nexport const MainScene = new Scene<{}>({\n    name: 'MainScene',\n    gameObjects: [],\n    beforeInit: ()=>({}),\n    afterUpdate(config, scene, dt, ctx) {\n        writeText('Mainscene', ctx, 0, 0, WIDTH);\n    },\n});"
    );

    console.log(chalk.greenBright('Installing packages...'));
    await spawn(
        pacman,
        [pacman === 'yarn' ? 'add' : 'install', 'rainbow32-lib'],
        { cwd: newDir }
    );

    if (usegit) {
        console.log(chalk.greenBright('Initializing git...'));
        await spawn('git', ['init'], { cwd: newDir });
    }

    console.log(
        chalk.greenBright(
            `\n  Successfully initialized your project!\n  Run ${chalk.blueBright(
                'cd ' + name
            )} and ${chalk.blueBright(
                '<your-editor> .'
            )} to edit your game!\n  Run ${chalk.blueBright(
                (pacman === 'npm' ? 'npm run' : pacman) + ' dev'
            )} to start the development environment and ${chalk.blueBright(
                (pacman === 'npm' ? 'npm run' : pacman) + ' build'
            )} to build your game!`
        )
    );
}