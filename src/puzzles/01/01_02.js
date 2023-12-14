import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

// meh it's 22k of data, not bothered to stream it ...
const data = fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line));

const digits = Array(9).fill(0).map((_, i) => String(i + 1));
const spelled_digits = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'
];

let sum = 0;

for (const line of data) {
    const matches = [];

    let buffer = '';
    line.toLocaleLowerCase().split('').forEach(chr => {
        if (digits.includes(chr)) {
            buffer = '';
            matches.push(chr);
            return;
        }

        buffer += chr;
        for (let i = 0; i < spelled_digits.length; i++) {
            const digit = spelled_digits[i];
            if (buffer.endsWith(digit)) {
                matches.push(String(i + 1));
                return;
            }
        }
    });

    if (matches.length < 1)
        throw new Error(`Expected at least one digit, found none in line "${line}"`);

    const num_str = matches[0] + '' + matches[matches.length - 1];
    const num = to_int(num_str);
    if (num === null)
        throw new Error(`Failed to parse "${num_str}"`);

    sum += num;
}

log_success(`Done. The sum of all of the calibration values is ${sum}`);
