import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const matrix = fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => line.split(''));

const digits = Array(10).fill(0).map((_, i) => String(i));
const ignore = ['.'];
let sum = 0;
let numbers = [];
let current_number = null;

const is_symbol = (char) => !(digits.includes(char) || ignore.includes(char));

const finalize_current_number = (x_max, y_max) => {
    if (current_number === null)
        return;

    current_number.value = to_int(current_number.value);

    const last_digit_x = current_number.x + current_number.length - 1;
    const x1 = Math.max(current_number.x - 1, 0);
    const x2 = Math.min(last_digit_x + 1, x_max);
    const y1 = Math.max(current_number.y - 1, 0);
    const y2 = Math.min(current_number.y + 1, y_max);

    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            if ((y == current_number.y) && (x >= current_number.x) && (x <= last_digit_x))
                continue;
            current_number.has_symbol_neighbor ||= is_symbol(matrix[y][x]);
        }
    }

    if (current_number.has_symbol_neighbor)
        sum += current_number.value;
    numbers.push(current_number);
    current_number = null;
}

for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
        const char = row[x];

        if (ignore.includes(char) || !digits.includes(char)) {
            finalize_current_number(row.length - 1, matrix.length - 1);
        } else {
            if (current_number === null) {
                current_number = {
                    value: '',
                    length: 0,
                    x: x,
                    y: y,
                    has_symbol_neighbor: false,
                };
            }

            current_number.value += char;
            current_number.length++;
        }
    }
    finalize_current_number(row.length - 1, matrix.length - 1);
}

log_success(`Done. The sum of all of the part numbers in the engine schematic is ${sum}`);
