import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const make_key = (x,y) => `${x}_${y}`; // Quick way to make unique keys.

const galaxies = new Set();
const empty_columns = new Map(), empty_rows = new Map();
const expansion_rate = 1000000 - 1;
let id = 0;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
})
.split("\n").filter(line => !isBlank(line)).forEach((line, y) => {
    empty_rows.set(y, true);
    for (let x = 0; x < line.length; x++) {
        const char = line[x];

        if (!empty_columns.has(x))
            empty_columns.set(x, true);

        if (char != '#')
            continue;

        empty_rows.set(y, false);
        empty_columns.set(x, false);
        galaxies.add({id: id++, x, y});
    }
});

const offsets = {
    x: Array(empty_columns.size).fill(0),
    y: Array(empty_rows.size).fill(0),
};

let upper_bound = offsets.x.length - 2;
for (const [x, empty] of empty_columns) {   // EXPAAAAAAAAAAAAND ....
    if (x > upper_bound)
        continue;
    offsets.x[x + 1] = offsets.x[x] + (empty ? expansion_rate : 0);
}

upper_bound = offsets.y.length - 2;
for (const [y, empty] of empty_rows) {   // ... THE UNIVERSE
    if (y > upper_bound)
        continue;
    offsets.y[y + 1] = offsets.y[y] + (empty ? expansion_rate : 0);
}

for (const galaxy of galaxies) {
    galaxy.x += offsets.x[galaxy.x];
    galaxy.y += offsets.y[galaxy.y];
}

const pairs = new Set();
let sum = 0, key;
for (const g1 of galaxies) {
    for (const g2 of galaxies) {
        if (g1.id == g2.id)
            continue;

        key = (g1.id > g2.id) ? make_key(g1.id, g2.id) : make_key(g2.id, g1.id);

        if (pairs.has(key))
            continue;

        sum += Math.abs(g1.x - g2.x) + Math.abs(g1.y - g2.y);
        pairs.add(key);
    }
}

log_success(`Done. The sum of the lengths of the shortest paths between every pair of galaxies is ${sum}`);
