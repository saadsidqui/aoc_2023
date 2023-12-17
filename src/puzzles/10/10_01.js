import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

// Connection points for each pipe type
const Constants = Object.freeze({
    PipeTypes: Object.freeze(new Map([
        ['|', [{x: 0, y: -1}, {x: 0, y: 1}]],
        ['-', [{x: -1, y: 0}, {x: 1, y: 0}]],
        ['L', [{x: 0, y: -1}, {x: 1, y: 0}]],
        ['J', [{x: 0, y: -1}, {x: -1, y: 0}]],
        ['7', [{x: 0, y: 1}, {x: -1, y: 0}]],
        ['F', [{x: 0, y: 1}, {x: 1, y: 0}]],
        ['S', [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}]],
    ])),
});

const coord_key = (x,y) => `${x}_${y}`; // Quick way to key vertices.

const graph = {
    vertices: new Map(),
    start: null,
};

let cols = null;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach((line, y) => {
    if (cols === null)
        cols = line.length;
    else if (line.length !== cols)
        throw new Error(`Invalid line length on line ${y + 1}`);

    for (let x = 0; x < line.length; x++) {
        const char = line[x];

        if (char == '.')
            continue;

        if (!Constants.PipeTypes.has(char))
            throw new Error(`Invalid character "${char} at position ${x},${y}"`)

        const key = coord_key(x, y);

        if (char == 'S') {
            if (graph.start !== null)
                throw new Error(`Duplicate start vertex at position ${x},${y}"`)
            graph.start = key;
        }

        const vertex = {
            adjacency: [],
            connectors: new Set(),
            x, y,
        };

        // Loop through possible connection points ("connectors")
        for (const connector of Constants.PipeTypes.get(char)) {
            const cx = connector.x + x, cy = connector.y + y;
            const cokey = coord_key(cx, cy);
            vertex.connectors.add(cokey);

            // Only consider connectors to the left and/or above the current position
            if ((cx < 0) || (cx > x) || (cy < 0) || (cy > y))
                continue;

            // If the vertex at the other end does not have a connector to the current vertex, skip
            if (!(graph.vertices.has(cokey) && graph.vertices.get(cokey).connectors.has(key)))
                continue;

            // Otherwise, add the vertices to each other's adjacency list
            graph.vertices.get(cokey).adjacency.push(key);
            vertex.adjacency.push(cokey);
        }

        graph.vertices.set(key, vertex);
    }
});


// Since there is only one main loop, and each pipe has exactly two connections,
// all we have to do is follow the pipes from the start vertex and it should
// lead us back to the same start.

const cycle = new Set();
let current = graph.start, flag;
do {
    const vertex = graph.vertices.get(current);
    flag = false;

    // Find the next vertex. If none found, the pipe is broken
    for (const cokey of vertex.adjacency) {
        if (cycle.has(cokey))
            continue;
        flag = true;
        current = cokey
    }
    if (!flag)
        throw new Error('Main pipe is broken');
    cycle.add(current);
} while (current !== graph.start);

const furthest_vertex_steps = Math.ceil(cycle.size / 2);

log_success(`Done. The point farthest from the starting position is ${furthest_vertex_steps} steps.`);
