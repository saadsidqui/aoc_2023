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
        ['|', [{ x: 0, y: -1 }, { x: 0, y: 1 }]],
        ['-', [{ x: -1, y: 0 }, { x: 1, y: 0 }]],
        ['L', [{ x: 0, y: -1 }, { x: 1, y: 0 }]],
        ['J', [{ x: 0, y: -1 }, { x: -1, y: 0 }]],
        ['7', [{ x: 0, y: 1 }, { x: -1, y: 0 }]],
        ['F', [{ x: 0, y: 1 }, { x: 1, y: 0 }]],
        ['S', [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }]],
    ])),
});

const coord_key = (x, y) => `${x}_${y}`; // Quick way to key vertices.

const graph = {
    vertices: new Map(),
    start: null,
};

let cols = null, rows = 0;

fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).forEach((line, y) => {
    if (cols === null)
        cols = line.length;
    else if (line.length !== cols)
        throw new Error(`Invalid line length on line ${y + 1}`);

    rows++;
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
            connects: {
                north: false,
                south: false,
                west: false,
                east: false
            }
        };

        // Loop through possible connection points ("connectors")
        for (const connector of Constants.PipeTypes.get(char)) {
            const cx = connector.x + x, cy = connector.y + y;
            const cokey = coord_key(cx, cy);
            vertex.connectors.add(cokey);

            // Only consider connectors to the left and/or above the current position
            if ((cx < 0) || (cx > x) || (cy < 0) || (cy > y))
                continue;

            if (graph.vertices.has(cokey)) {
                const covertex = graph.vertices.get(cokey);

                // If the vertex at the other end does not have a connector to the current vertex, skip
                if (!covertex.connectors.has(key))
                    continue;

                // Otherwise, add the vertices to each other's adjacency list
                covertex.adjacency.push(key);

                vertex.adjacency.push(cokey);

                if (cy == y) {
                    const flag = (cx < x);
                    vertex.connects.west = flag;
                    covertex.connects.east = flag;
                }

                if (cx == x) {
                    const flag = (cy < y);
                    vertex.connects.north = flag;
                    covertex.connects.south = flag;
                }
            }
        }

        graph.vertices.set(key, vertex);
    }
});


// Since there is only one main loop, and each pipe has exactly two connections,
// all we have to do is follow the pipes from the start vertex and it should
// lead us back to the same start.
const cycle = new Set();
let current = graph.start, flag, cokey;
let search = {x_min: cols - 1, x_max: 0, y_min: rows - 1, y_max: 0};
const segments = {
    horiz: new Map(),
    vert: new Map(),
};
do {
    const vertex = graph.vertices.get(current);
    flag = false;

    // Allows us to narrow the search area for the 2nd pass
    search.x_min = Math.min(vertex.x, search.x_min);
    search.x_max = Math.max(vertex.x, search.x_max);
    search.y_min = Math.min(vertex.y, search.y_min);
    search.y_max = Math.max(vertex.y, search.y_max);

    // Calculate the edges of the polygon while we're here ...
    if (vertex.connects.north) {
        cokey = coord_key(vertex.y - 1, vertex.y);
        if (!segments.vert.has(cokey))
            segments.vert.set(cokey, new Set());
        segments.vert.get(cokey).add(vertex.x);
    }

    if (vertex.connects.south) {
        cokey = coord_key(vertex.y, vertex.y + 1);
        if (!segments.vert.has(cokey))
            segments.vert.set(cokey, new Set());
        segments.vert.get(cokey).add(vertex.x);
    }

    if (vertex.connects.west) {
        cokey = coord_key(vertex.x - 1, vertex.x);
        if (!segments.horiz.has(cokey))
            segments.horiz.set(cokey, new Set());
        segments.horiz.get(cokey).add(vertex.y);
    }

    if (vertex.connects.east) {
        cokey = coord_key(vertex.x, vertex.x + 1);
        if (!segments.horiz.has(cokey))
            segments.horiz.set(cokey, new Set());
        segments.horiz.get(cokey).add(vertex.y);
    }

    // Find the next vertex. If none found, the pipe is broken
    for (cokey of vertex.adjacency) {
        if (cycle.has(cokey))
            continue;
        flag = true;
        current = cokey
    }
    if (!flag)
        throw new Error('Main pipe is broken');
    cycle.add(current);
} while (current !== graph.start);

let tile_count = 0;

// 2nd pass. Find out which points are inside the polygon.
// This inspired by Point Inclusion in Polygon Test (PNPOLY) by W. Randolph Franklin
// For our case, we lookup in the precalculated edges map how many horizontal and vertical
// edges our ray crosses. If both the vertical and horizontal numbers are odd
// then we're inside the polygon.
for (let y = search.y_min; y <= search.y_max; y++) {
    for (let x = search.x_min; x <= search.x_max; x++) {
        const key = coord_key(x, y);
        if (cycle.has(key))
            continue;

        const cokeys = [
            coord_key(y - 1, y),
            coord_key(y, y + 1),
            coord_key(x - 1, x),
            coord_key(x, x + 1),
        ];

        const inside = {
            horiz: true,
            vert: true,
        }
        let count;
        for (let i = 0; i < 2; i++) {
            // must be odd for both north and south half-segments
            if (segments.vert.has(cokeys[i])) {
                const segment = segments.vert.get(cokeys[i]);
                count = 0;
                for (const sx of segment) {
                    if (sx < x)
                        count++;
                }
                inside.vert &&= ((count % 2) === 1)
            }

            const j = i + 2;
            // must be odd for both west and east half-segments
            if (segments.horiz.has(cokeys[j])) {
                const segment = segments.horiz.get(cokeys[j]);
                count = 0;
                for (const sy of segment) {
                    if (sy < y)
                        count++;
                }
                inside.horiz &&= ((count % 2) === 1)
            }
        }

        if (inside.vert && inside.horiz)
            tile_count++;
    }
}

log_success(`Done. The number of tiles are enclosed by the loop is ${tile_count}.`);
