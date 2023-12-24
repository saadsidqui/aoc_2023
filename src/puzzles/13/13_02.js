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

function first_pass(matrix, axis, cache, pairs, smudges) {
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
    const coaxis_upper_bound = coaxis_len - 1;

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
                // p1 and p2 are oposing points across the potential mirror line
                // if p1 and p2 match, increase the match counter for this line
                if (p1 == p2)
                    descriptor.matches++;
            }

            cache.set(key, descriptor);

            // reflection line falls on a line in the matrix,
            // or none of the lines is an edge, so skip
            if (
                ((a1 + a2) % 2 === 0) ||
                ((descriptor.bounds[0] !== 0) && (descriptor.bounds[1] !== axis_upper_bound))
            )
                continue;

            if (descriptor.matches === coaxis_len)
                pairs.push(descriptor.bounds);

            if (descriptor.matches >= coaxis_upper_bound)
                smudges.push(descriptor.bounds);
        }
    }
}

function second_pass(axis, cache, pairs, required_smudge_count = 0, skip_mirror = null) {
    const is_x_axis = (axis === 'x');
    const coaxis_len = (is_x_axis ? matrix.length : matrix[0].length);
    const coaxis_upper_bound = coaxis_len - 1;

    const initial_required_smudge_count = required_smudge_count;
    for (const a of pairs) {
        let found = true;

        required_smudge_count = initial_required_smudge_count
        // loop over the lines delimited by this pair
        // to confirm if this is a real mirror
        for (let offset = 0; offset < ((a[1] - a[0]) / 2); offset++) {
            const a1 = a[0] + offset;
            const a2 = a[1] - offset;
            const key = coord_key(a1, a2);
            const descriptor = cache.get(key);

            if (descriptor.matches !== coaxis_len) {

                // if there is a smudge and there is still room to account for smudges
                if (descriptor.matches === coaxis_upper_bound) {
                    if (required_smudge_count > 0) {
                        // then decrease the smudge count and continue
                        required_smudge_count--;
                        continue;
                    }
                }

                // otherwise, this is not a valid candidate
                found = false;
            }
        }

        // if we found a valid mirror and we did fulfill the required smudge count
        if (found && (required_smudge_count < 1)) {
            const mirror = reflection_line(a[0], a[1]);
            // check if we want to skip over this mirror, if not return the result
            if (mirror !== skip_mirror)
                return mirror;
        }
    }

    return false;
}

function get_mirror_score(matrix) {
    const cache = {x: new Map(), y: new Map()};
    const pairs = {x: [], y: []};
    const smudges = {x: [], y: []};

    first_pass(matrix, 'x', cache.x,  pairs.x, smudges.x);
    first_pass(matrix, 'y', cache.y,  pairs.y, smudges.y);

    const skip = {mirror: null, axis: 'x'};

    let mirror = second_pass('x', cache.x, pairs.x);
    if (mirror === false) {
        mirror = second_pass('y', cache.y, pairs.y);
        if (mirror === false)
            throw Error('No mirror found');
        skip.axis = 'y';
    }
    skip.mirror = mirror;

    const smudge_count = (smudges.x.length + smudges.y.length);
    let candidates = smudges;

    if (smudge_count >= 0) {
        if (smudge_count === 0)
            candidates = pairs;

        mirror = second_pass(
            'x', cache.x, candidates.x, 1, (skip.axis == 'x' ? skip.mirror : null)
        );
        if (mirror !== false)
            return mirror + 1;

        mirror = second_pass(
            'y', cache.y, candidates.y, 1, (skip.axis == 'y' ? skip.mirror : null)
        );
        if (mirror === false)
            throw Error('No mirror with 1 smudge found');
        return (mirror + 1) * 100;
    }

    throw Error('Multiple or no smudges found');
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
