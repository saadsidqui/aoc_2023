import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";
import { lcm } from "#src/utils/number.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const re = {
    instructions: /^[LR]+$/,
    node: /^([0-9A-Z]{3}) = \(([0-9A-Z]{3}), ([0-9A-Z]{3})\)$/,
};

let instructions = [];
const nodes = new Map();
let current_nodes = [];

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
    nodes.set(matches[1], {L: matches[2], R: matches[3]});

    if (matches[1][2] == 'A')
        current_nodes.push(matches[1]);
});

let steps = 0;
let op_index = -1;
const lengths = [];

/*
    Each starting node will go through it's chain until in reaches
    a node ending with Z. Each of these chains will have different
    lengths (or steps). Since the instructions repeat until all chains
    end up on a node with Z at the same time, what we're actually looking
    for is just the lowest common multiple of lengths of all chains.
*/

// Start by computing the lengths of all the chains
while (current_nodes.length > 0) {
    op_index = (++op_index == instructions.length) ? 0 : op_index;
    const op = instructions[op_index];

    steps++;
    for (let i = current_nodes.length - 1; i >= 0; i--) {
        current_nodes[i] = nodes.get(current_nodes[i])[op];
        if (current_nodes[i][2] == 'Z') {
            lengths.push(steps);
            current_nodes.splice(i, 1);
        }
    }
}

// Calculate the lowest common denominator
steps = lengths.reduce((acc, n, i) => (i == 0) ? n : lcm(n, acc));

log_success(`Done. The total steps required to have all nodes end with Z is ${steps}`);
