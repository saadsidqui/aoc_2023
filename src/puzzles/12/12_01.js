import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";
import { to_int } from "#src/utils/number.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const Constants = Object.freeze({
    OPERATIONAL: '.',
    DAMAGED: '#',
    UNKNOWN: '?',
});
let _id = 0;
const records = [];

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
})
.split("\n").filter(line => !isBlank(line)).forEach((line) => {
	const parts = line.split(' ');
    const zero = parts[0];

    let springs = [];
    let last_char = null;

	for (let i = 0; i < zero.length; i++) {
        const char = zero[i];
        if ((last_char == Constants.OPERATIONAL) && (char == Constants.OPERATIONAL))
            continue;
        springs.push(char);
        last_char = char;
	}

    const sizes = parts[1].split(',').map(s => to_int(s));
    if (sizes.length < 1)
        throw Error('Invalid input data');

	records.push({
        id: ++_id,
		springs: springs.join(''),
		sizes: sizes,
	});
});

const cache = new Map();
const recurse = (springs, sizes) => {
    let result = 0;
    const key = `${springs}_${sizes.join()}`;

    if (cache.has(key)) {
        result = cache.get(key);
    } else if (springs.length < 1) {
        result = ((sizes.length < 1) ? 1 : 0)
    } else if (sizes.length < 1) {
        result = (springs.includes(Constants.DAMAGED) ? 0 : 1);
    } else if (springs[0] == Constants.OPERATIONAL) {
        result = recurse(springs.slice(1), sizes);
    } else if (springs[0] == Constants.UNKNOWN) {
        const sub_springs = springs.slice(1);
        for (const char of [Constants.DAMAGED, Constants.OPERATIONAL])
            result += recurse(char + sub_springs, sizes);
    } else {
        const valid =
            (springs.length >= sizes[0]) &&
            (!springs.slice(0, sizes[0]).includes(Constants.OPERATIONAL)) &&
            ((springs[sizes[0]] !== Constants.DAMAGED) || (springs.length == sizes[0]))
        ;
        result = (valid ? recurse(springs.slice(sizes[0] + 1), sizes.slice(1)) : 0);
    }
    cache.set(key, result);
    return result;
};

let sum = 0;
for (const record of records)
    sum += recurse(record.springs, record.sizes);

log_success(`Done. The sum of the different arrangements of operational and broken springs that meet the given criteria is ${sum}`);
