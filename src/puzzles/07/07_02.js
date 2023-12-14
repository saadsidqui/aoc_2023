import path from "node:path";
import url from "node:url";
import fs from 'node:fs';
import { log_info, log_success } from '#src/utils/console.js';
import { to_int } from "#src/utils/number.js";
import isBlank from "voca/is_blank.js";

const puzzle_dir = path.dirname(url.fileURLToPath(import.meta.url));
const input_file = path.join(puzzle_dir, 'input.txt');

log_info('Reading input ...');

const Constants = Object.freeze({
    CardStrengths: Object.freeze(
        ['J', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q', 'K', 'A'].reduce(
            (acc, card, i) => {
                acc[card] = i + 1;
                return acc;
            },
            {}
        )
    ),

    HandTypes: Object.freeze({
        11111: 1,   // High Card
        1112: 2,    // One Pair
        122: 3,      // Two Pairs
        113: 4,     // Three of a kind
        23: 5,      // Full House
        14: 6,       // Four of a kind
        5: 7,       // Five of a kind
    }),
});

const re = /^([AKQJT2-9]{5}) (\d+)$/;
const joker = 'J';
const hands = fs.readFileSync(input_file, {
    encoding: 'utf-8',
    flag: 'r'
}).split("\n").filter(line => !isBlank(line)).map(line => {
    const matches = re.exec(line);
    if (matches === null)
        throw new Error(`Invalid data "${line}"`);

    const cards = matches[1].split('');

    const matching_cards = {};
    for (const card of cards) {
        if (!Object.hasOwn(matching_cards, card))
            matching_cards[card] = 0;
        matching_cards[card]++;
    }

    if (Object.hasOwn(matching_cards, joker) && (matching_cards[joker] < 5)) {
        let most = Object.keys(matching_cards).sort(
            (a, b) => {
                const diff = (matching_cards[b] - matching_cards[a]);
                return (diff !== 0) ?
                    diff :
                    (Constants.CardStrengths[b] - Constants.CardStrengths[a]);
            }
        );
        most = most[most[0] == joker ? 1 : 0];
        matching_cards[most] += matching_cards[joker];
        delete matching_cards[joker];
    }

    const composition = Object.values(matching_cards).sort((a, b) => a - b).join('');
    return {
        cards: cards,
        type: Constants.HandTypes[composition],
        bid: to_int(matches[2]),
    };
});

hands.sort((a, b) => {
    let diff = a.type - b.type;
    if (diff !== 0)
        return diff;

    for (let i = 0; i < a.cards.length; i++) {
        diff = Constants.CardStrengths[a.cards[i]] - Constants.CardStrengths[b.cards[i]];
        if (diff !== 0)
            return diff;
    }

    throw new Error(`Duplicate cards ${a.cards.join('')} and ${b.cards.join('')}`);
});

let total_winnings = 0;
for (let i = 0; i < hands.length; i++)
    total_winnings += (hands[i].bid * (i + 1))
log_success(`Done. The total winnings are ${total_winnings}`);
