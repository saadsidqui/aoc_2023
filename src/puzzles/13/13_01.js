import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

function coord_key(a, b) {
    return (a > b ? `${b}_${a}` : `${a}_${b}`);
}

function reflection_line (a, b) {
    const sum = a + b;
    return ((sum - 2 + (sum % 2)) / 2);
}

function first_pass(matrix, axis, cache, pairs) {
    const is_x_axis = (axis === 'x');

    let axis_len, coaxis_len, p1, p2;

    if (is_x_axis) {
        axis_len = matrix[0].length;
        coaxis_len = matrix.length;
    } else {
        axis_len = matrix.length;
        coaxis_len = matrix[0].length;
    }

    const axis_upper_bound = axis_len - 1;

    for (let a1 = 0; a1 < axis_len; a1++) {
        for (let a2 = 0; a2 < axis_len; a2++) {
            if (a1 === a2)
                continue;

            const key = coord_key(a1, a2);

            // if we have already visited this pair, then skip
            if (cache.has(key))
                continue;

            const descriptor = {
                bounds: [a1, a2].sort((a, b) => a - b),
                matches: 0,
            };

            for (let b = 0; b < coaxis_len; b++) {
                if (is_x_axis) {
                    p1 = matrix[b][a1];
                    p2 = matrix[b][a2];
                } else {
                    p1 = matrix[a1][b];
                    p2 = matrix[a2][b];
                }

                if (p1 != p2)
                    continue;

                descriptor.matches++;
            }

            cache.set(key, descriptor);

            // reflection line falls on a line in the matrix,
            // or none of the lines is an edge, then skip
            if (
                ((a1 + a2) % 2 === 0) ||
                ((descriptor.bounds[0] !== 0) && (descriptor.bounds[1] !== axis_upper_bound))
            )
                continue;

            // if all points on both lines match, this pair might be a candidate
            if (descriptor.matches === coaxis_len)
                pairs.push(descriptor.bounds);
        }
    }
}

function second_pass(axis, cache, pairs) {
    const is_x_axis = (axis === 'x');
    const coaxis_len = (is_x_axis ? matrix.length : matrix[0].length);

    // loop over candidates
    for (const a of pairs) {
        let found = true;

        for (let offset = 0; offset < ((a[1] - a[0]) / 2); offset++) {
            const a1 = a[0] + offset;
            const a2 = a[1] - offset;
            const key = coord_key(a1, a2);
            const descriptor = cache.get(key);
            if (descriptor.matches !== coaxis_len) {
                found = false;
                break;
            }
        }

        if (found)
            return reflection_line(a[0], a[1]);
    }
    return false;
}

function get_mirror_score(matrix) {
    const cache = {x: new Map(), y: new Map()};
    const pairs = {x: [], y: []};

    first_pass(matrix, 'x', cache.x,  pairs.x);
    first_pass(matrix, 'y', cache.y,  pairs.y);

    let result = second_pass('x', cache.x, pairs.x);
    if (result !== false)
        return (result + 1);

    result = second_pass('y', cache.y, pairs.y);
    if (result === false)
        throw Error('No mirror found');
    return (result + 1) * 100;
}

let matrix = [], width = null, sum = 0;
fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
})
.split("\n").forEach((line) => {
    if (isBlank(line)) {
        if (matrix.length > 0)
            sum += get_mirror_score(matrix);
        matrix = [];
        width = null;
        return;
    }

    if (width === null)
        width = line.length;
    else if (line.length !== width)
        throw Error('Line length mismatch');

    matrix.push(line.split(''));
});

if (matrix.length > 0)
    sum += get_mirror_score(matrix);

log_success(`Done. The result of summarizing all of the notes is ${sum}`);
