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
const seed_data = [];
const maps = new Map();
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
                seed_data.push(to_int(match[0]));

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
            if (!maps.has(current_map_key))
                maps.set(current_map_key, []);

        } else if ((matches = re.map_data.exec(line)) !== null) {
            if (current_map_key === null)
                throw new Error('Received map data before a map key has been set');

            matches = matches.map(m => to_int(m));

            const added = matches[3] - 1;
            maps.get(current_map_key).push({
                dst: matches[1],
                dst_upper: matches[1] + added,
                src: matches[2],
                src_upper: matches[2] + added,
                len: matches[3],
            });
        }
    });

if ((seed_data.length % 2) != 0)
    throw new Error('Seed data must have an even number of elements.');
for (let i = 0; i < (seed_data.length / 2); i++) {
    const j = i * 2;
    seeds.push({
        ranges: [{
            lower: seed_data[j],
            upper: seed_data[j] + (seed_data[j + 1] - 1),
        }],
    });
}

for (const [, translations] of maps)
    translations.sort((a, b) => a.src - b.src)

let lowest_location = null;
for (let seed of seeds) {
    let last_link = null;
    for (const link of chain) {
        if (last_link === null) {
            last_link = link;
            continue;
        }

        const key = `${last_link}_${link}`;
        last_link = link;

        const new_ranges = [];
        for (const range of seed.ranges) {
            const translations = maps.get(key);
            for (const trans of translations) {
                if ((trans.src > range.upper) || (range.lower > trans.src_upper)) {
                    // No intersection at all [A];
                    // if seed range is higher than the translation range, it may still
                    // intersect one of the remaining translation ranges
                    // unless this is the last translation range
                    if (translations[translations.length - 1] !== trans) {
                        if (range.lower > trans.src_upper)
                            continue;
                    }
                    // otherwise, we do not need to check the rest of the
                    // translations ranges if any. Push range as is.
                    new_ranges.push(range);
                    break;

                } else if ((trans.src <= range.lower) && (trans.src_upper >= range.upper)) {
                    // translation range contains or is equal to seed range [D, F];
                    const lower = trans.dst + (range.lower - trans.src);
                    const upper = lower + (range.upper - range.lower);
                    new_ranges.push({ lower, upper });
                    // Since the seed range was contained,
                    // we do not need to check the rest of the translations
                    break;

                } else {
                    // Ranges intersect [E, B, C];
                    if (range.lower < trans.src) {
                        // translation ranges are ordered. the lower unmatched part of the seed
                        // range can no longer be matched to any of the remaining translators
                        new_ranges.push({
                            lower: range.lower,
                            upper: trans.src - 1,
                        });
                    }

                    // calculate the intersection range
                    const intersection = {
                        lower: Math.max(range.lower, trans.src),
                        upper: Math.min(range.upper, trans.src_upper),
                    }

                    // translate the seed range
                    const lower = trans.dst + (intersection.lower - trans.src);
                    const upper = lower + (intersection.upper - intersection.lower);
                    new_ranges.push({ lower, upper });

                    if (range.upper > trans.src_upper) {
                        // the remaining upper part of the range, for the next iteration
                        range.lower = intersection.upper + 1;
                        continue;
                    }

                    break;
                }
            }
        }

        seed.ranges = new_ranges.sort((a, b) => a.lower - b.lower);
    }

    if (seed.ranges.length > 0) {
        lowest_location =
            (lowest_location === null) ?
            seed.ranges[0].lower :
            Math.min(lowest_location, seed.ranges[0].lower)
        ;
    }
}

log_success(`Done. The lowest location number that corresponds to any of the initial seed numbers ${lowest_location}`);
