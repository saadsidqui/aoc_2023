import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";
import { to_int } from "#src/utils/number.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const re = /-?[0-9]+/g;
const lines = [];
let sum = 0;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach(line => {
    const l = [];
    for (const match of line.matchAll(re))
        l.push(to_int(match[0]));
    lines.push({
        data: l,
        edges: [l[0]],
    });
});

for (const line of lines) {
    let current, upcoming, local_sum;
    do {
        current = upcoming ?? line.data;
        if (current.length < 2)
            throw new Error("Depleted array before 0.");

        upcoming = [], local_sum = 0;
        let diff;
        for (let i = 0; i < (current.length - 1); i++) {
            diff = current[i + 1] - current[i];
            local_sum |= diff;
            upcoming.push(diff);
        }

        line.edges.push(upcoming[0]);
    } while (local_sum !== 0);

    for (const edge of line.edges.reverse())
        local_sum = edge - local_sum;
    sum += local_sum;
}

log_success(`Done. The sum of the extrapolated values ${sum}.`);
