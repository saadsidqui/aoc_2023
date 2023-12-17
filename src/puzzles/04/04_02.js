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

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => {
    // quick and dirty parse, i know ...
    const card = line.split(':');
    const groups = card[1].split('|');

    const entry = {
        match_count: 0,
        instances: 1,
        drawn: groups[0].split(' ').filter(n => !isBlank(n)).map(n => to_int(n)),
        played: groups[1].split(' ').filter(n => !isBlank(n)).map(n => to_int(n)),
    };
    cards.push(entry);
});

let sum = 0;

for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    for (const num of card.drawn) {
        if (card.played.includes(num))
            card.match_count++;
    }

    const last_index = Math.min(i + card.match_count, cards.length);
    for (let j = i+1; j <= last_index; j++)
        cards[j].instances += card.instances;

    sum += card.instances;
}

log_success(`Done. The total number of scratchcards is ${sum}`);
