import { TextboxBuilder } from '@futils/commandline';
import chalk from 'chalk';

export async function help() {
    new TextboxBuilder().setTitle('Rainbow32 CLI').setFooter('v1.0.1')
    .addLine(`${chalk.cyan('rainbow32')} ${chalk.green('<command>')}`)
    .addDivider()
    .addLine(chalk.bold('Available Commands:'))
    .addLine(`- ${chalk.green('init')}, ${chalk.green('i')}   | Initialize a new project`)
    .addLine(`- ${chalk.green('build')}, ${chalk.green('b')}  | Build a project`)
    .addLine(`- ${chalk.green('dev')}, ${chalk.green('d')}    | Start the development environment`)
    .addLine(`- ${chalk.green('help')}, ${chalk.green('h')}   | Print a help menu`)
    .log();
    process.exit(1);
}
