import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const chain = [];   // Assuming the data come in proper order.
const seeds = [];
const maps = {};
const re = {
    seeds: /^seeds: ([\d ]+)$/i,
    seed_data: /([\d]+)/g,
    maps: /^([a-zA-Z]+)-to-([a-zA-Z]+) map:$/i,
    map_data: /([\d]+) ([\d]+) ([\d]+)/,
};

let current_map_key = null;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => {
    let matches = null;
    if (re.seeds.test(line)) {
        matches = line.matchAll(re.seed_data);
        for (const match of matches)
            seeds.push(to_int(match[0]));

    } else if ((matches = re.maps.exec(line)) !== null) {
        if (current_map_key === null) {
            chain.push(matches[1]);
            chain.push(matches[2]);
        } else if (chain[chain.length - 1] == matches[1]) {
            chain.push(matches[2]);
        } else {
            throw new Error('Chain broken. Maybe the data is not in order after all ?');
        }

        current_map_key = `${matches[1]}_${matches[2]}`;
        if (!Object.hasOwn(maps, current_map_key))
            maps[current_map_key] = [];

    } else if ((matches = re.map_data.exec(line)) !== null) {
        if (current_map_key === null)
            throw new Error('Received map data before a map key has been set');
        maps[current_map_key].push({
            src: to_int(matches[2]),
            dst: to_int(matches[1]),
            len: to_int(matches[3]),
        });
    }
});

const is_in_range = (val, obj) => ((val >= obj.src) && (val < (obj.src + obj.len)));
const find_range = (val, map) => {
    for (const obj of map) {
        if (is_in_range(val, obj))
            return obj;
    }
    return false;
};

let lowest_location = null;

for (const seed of seeds) {
    let val = seed;
    let last_link = null;
    for (const link of chain) {
        if (last_link === null) {
            last_link = link;
            continue;
        }

        const key = `${last_link}_${link}`;
        last_link = link;
        const range = find_range(val, maps[key]);
        if (range !== false)
            val = (val - range.src) + range.dst;
    }

    lowest_location = (lowest_location === null) ? val : Math.min(lowest_location, val);
}

log_success(`Done. The lowest location number that corresponds to any of the initial seed numbers ${lowest_location}`);
