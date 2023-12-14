import chalk from "chalk";

export const error = chalk.bold.red;
export const warning = chalk.bold.yellow;
export const success = chalk.bold.green;
export const info = chalk.bold.cyan;

export const log_error = (...args) => console.log(chalk.bold.red(args));
export const log_warning = (...args) => console.log(chalk.bold.yellow(args));
export const log_success = (...args) => console.log(chalk.bold.green(args));
export const log_info = (...args) => console.log(chalk.bold.cyan(args));
