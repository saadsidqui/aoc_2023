import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const re = {
    instructions: /^[LR]+$/,
    node: /^([A-Z]{3}) = \(([A-Z]{3}), ([A-Z]{3})\)$/,
};

const start = 'AAA';
const end = 'ZZZ';

let instructions = [];
const nodes = {};

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach((line, index) => {
    let matches;

    if (index < 1) {
        if ((matches = re.instructions.exec(line)) === null)
            throw new Error(`Expecting instructions on first line. Invalid data found.`);
        instructions = matches[0].split('');
        return;
    }

    if ((matches = re.node.exec(line)) === null)
        throw new Error(`Invalid node data "${line}"`);
    nodes[matches[1]] = {L: matches[2], R: matches[3]};
});

let steps = 0;

let op_index = -1;
let current = start;
while (current !== end) {
    op_index = (++op_index == instructions.length) ? 0 : op_index;
    const op = instructions[op_index];
    current = nodes[current][op];
    steps++;
}

log_success(`Done. The total steps required to reach ${end} is ${steps}`);
