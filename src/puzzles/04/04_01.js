import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const cards = [];
let sum = 0;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => {
    // quick and dirty parse, i know ...
    const card = line.split(':');
    const groups = card[1].split('|');

    const entry = {
        match_count: 0,
        points: 0,
    };

    const drawn = groups[0].split(' ').filter(n => !isBlank(n)).map(n => to_int(n));
    const played = groups[1].split(' ').filter(n => !isBlank(n)).map(n => to_int(n));

    for (const num of drawn) {
        if (played.includes(num))
            entry.match_count++;
    }
    entry.points = entry.match_count > 0 ? Math.pow(2, entry.match_count - 1) : 0;
    sum += entry.points;
    cards.push(entry);
});

log_success(`Done. The sum of the cards' points is ${sum}`);
