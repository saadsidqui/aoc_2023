import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const re = {
    time: /^time:(?:\s+\d+)+$/i,
    distance: /^distance:(?:\s+\d+)+$/i,
    data: /([\d]+)/g,
};

const times = [];
const distances = [];

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach((line, index) => {
    if (index > 1)
        throw new Error('Expecting 2 lines only');

    if (re.time.test(line)) {
        for (const match of line.matchAll(re.data))
            times.push(to_int(match[0]));
    } else if (re.distance.test(line)) {
        for (const match of line.matchAll(re.data))
            distances.push(to_int(match[0]));
    }
});

if (distances.length !== times.length)
    throw new Error('Times and distances count mismatch');

let product = null;
// you can tell I love bruteforcing sh*t ...
for (let i = 0; i < times.length; i++) {
    const duration = times[i];
    let ways = 0;
    for (let j = 1; j < duration; j++) {
        if ((j * (duration - j)) > distances[i])
            ways++;
    }

    if (ways > 0) {
        if (product === null)
            product = 1;
        product *= ways;
    }
}

if (product === null)
    log_success(`Done. There is no way to beat the records in any of the races`); // lmao
else
    log_success(`Done. The product of the number of ways that beat the record in each race is ${product}`);
