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

const race = { time: 0, distance: 0 };

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach((line, index) => {
    if (index > 1)
        throw new Error('Expecting 2 lines only');

    let field;
    if (re.time.test(line))
        field = 'time';
    else if (re.distance.test(line))
        field = 'distance';

    const value = to_int([...line.matchAll(re.data)].map(m => m[0]).join(''));
    if (value === null)
        throw new Error(`Invalid ${field} value`);
    race[field] = value;
});

// ... but bruteforcing is boring. Let's try some algebra
/*
    Let:
        - d the distance traveled by the boat
        - x the button press duration
        - t the race duration.
        - r the current record
        - z all values of x for which d > r

The formula to calculate how long a boat goes for a given button press duration is
    d = x * (t - x)

We're looking for z.
    d > r =>    x * (t - x) > r
          =>    - (x^2) + (t * x) - r > 0

(1) henceforth refers to - (x^2) + (t * x) - r, where x is the unknown.

This is 2nd degree polynomial. We can use the quadratic formula to find
the points (if any) at which (1) crosses a 0.
    - We calculate the discriminant = (t^2) - (4 * r)

If the discriminant is strictly positive:
    - We have two points (x1, x2) where (1) is 0, which we calculate. x2 > x1.
    - We choose then an integer y within the range ]x1, x2[
    - We calculate (1) of y, and find out if it's strictly positive
    - If it is, then d > r is true for every x within ]x1, x2[
        In which case the answer is all integers in that range,
        so z = ]x1..x2[
    - Otherwise, d > r is true for all values whithin the range
        ]-∞,x1[ U ]x2,+∞[. In this case since there's infinite possibilites,
        we cap the answer to the length of the race minus one, since
        holding the button for the full length of the race means the race
        end before the boat moves, so z = t - 1 .

If the discriminant is <= 0:
    - We have either one or no points where (1) is 0
    - We choose an integer y such as (1) does not equal 0 at y
    - We calculate (1) of y, and find out if it's strictly positive
    - If it is, d > r is true for all numbers, except where (1) equals 0, if any.
        In this case since there's infinite possibilites,
        we cap the answer to the length of the race minus one, since
        holding the button for the full length of the race means the race
        end before the boat moves, so z = t - 1 .
    - Otherwise, d > r is never true. In this case z = 0;
*/

const discriminant = Math.pow(race.time, 2) - (4 * race.distance);
let ways, y;
let zeroes = null;

if (discriminant > 0) {
    // Two solutions, find them
    zeroes = [1, -1];
    zeroes = zeroes.map(
        sign => ((race.time + (sign * Math.sqrt(discriminant))) / 2)
    ).sort((a, b) => a - b);

    // Pick a value within the range delimited by the two solutions
    y = (zeroes[0] + zeroes[1]) / 2;
} else {
    // Pick a value that is not a zero (if discriminant is 0, a zero would be (race.time / 2))
    y = (race.time / 4)
}

// Use picked value to find out out about the positivity
const sign = Math.sign(-Math.pow(y, 2) + (race.time * y) - race.distance);

if (discriminant > 0) {
    if (sign === 1) {
        // positive within range, answer is all integer within range
        ways = Math.ceil(zeroes[1]) - Math.ceil(zeroes[0]);
    } else {
        // otherwise, answer is all possible values, that is race.time - 1
        ways = race.time - 1;
    }
} else {
    if (sign === 1) {
        // positive all the time, answer is all possible values, that is race.time - 1
        ways = race.time - 1;
    } else {
        // never positive, answer is 0
        ways = 0;
    }
}

log_success(`Done. There is ${ways} ways to beat the record in the race`);
