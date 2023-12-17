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

    const entry = new Map();
    entry.set('id', game_id);

    for (let group_id = 0; group_id < groups.length; group_id++) {
        const cubes = groups[group_id].split(',');
        for (const cube of cubes) {
            const colors = cube.trim().split(' ');
            const num = to_int(colors[0]);
            if (num === null)
                throw new Error(`Failed to parse number "${colors[0]}" for color ${colors[1]}`);

            const max_key = `${colors[1]}_max`;
            if (!entry.has(max_key))
                entry.set(max_key, 0);
            entry.set(max_key, Math.max(entry.get(max_key), num));
        }
    }

    games.push(entry);
});

const constraint = new Map([
    ['red', 12],
    ['green', 13],
    ['blue', 14],
]);

let sum = 0;

outer: for (const game of games) {
    for (const [key, val] of constraint) {
        if (game.get(`${key}_max`) > val)
            continue outer;
    }
    sum += game.get('id');
}

log_success(`Done. The sum of the possible games' IDs is ${sum}`);
