import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const games = [];

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => {
    // quick and dirty parse, i know ...
    const game = line.split(':');
    const groups = game[1].split(';');

    const game_id = to_int(game[0].substring(5));
    if (game_id === null)
        throw new Error(`Failed to parse game id "${game[0].substring(5)}"`);

    const entry = {
        id: game_id,
    };

    for (let group_id = 0; group_id < groups.length; group_id++) {
        const cubes = groups[group_id].split(',');
        for (const cube of cubes) {
            const colors = cube.trim().split(' ');
            const num = to_int(colors[0]);
            if (num === null)
                throw new Error(`Failed to parse number "${colors[0]}" for color ${colors[1]}`);

            if (!Object.hasOwn(entry, colors[1]))
                entry[colors[1]] = {};
            entry[colors[1]][group_id] = num;

            if (!Object.hasOwn(entry, `${colors[1]}_max`))
                entry[`${colors[1]}_max`] = 0;
            entry[`${colors[1]}_max`] = Math.max(entry[`${colors[1]}_max`], num);
        }
    }

    games.push(entry);
});

const constraint = {
    red: 12,
    green: 13,
    blue: 14,
};

let sum = 0;

for (const game of games) {
    const game_is_possible = Object.keys(constraint).every(
        key => game[`${key}_max`] <= constraint[key]
    );
    if (!game_is_possible)
        continue;
    sum += game.id;
}

log_success(`Done. The sum of the possible games' IDs is ${sum}`);
