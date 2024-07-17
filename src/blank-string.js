// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check

let lastEnd = 0;
const max = Math.max;

const FLAG_ARROW = 1;
const FLAG_COMMA = 2;

/**
 * @param {string} input
 * @param {number} start
 * @param {number} minEnd
 * @returns {string}
 */
function getSpace(input, start, minEnd) {
    lastEnd = 0;
    let span = 0;
    let out = "";

    let i = start;
    for (; i < minEnd; i++) {
        let charCode = /** @type {number} */(input.charCodeAt(i));
        switch (charCode) {
            case 10 /* \n */:
                span = 0;
                out += "\n";
                break;
            case 13 /* \r */:
                span = 0;
                out += "\r";
                break;
            default:
                span += 1;
                if ((charCode & 0xF800) == 0xD800) {
                    // Surrogate pair
                    i++;
                    span += 1;
                }
        }
    }

    trimTrailingSpace: for (; i < input.length; i++) {
        switch (input.charCodeAt(i)) {
            case 10 /* \n */:
                span = 0;
                out += "\n";
                break;
            case 13 /* \r */:
                span = 0;
                out += "\r";
                break;
            case 32 /* <space> */:
                span += 1;
                break;
            default:
                break trimTrailingSpace;
        }
    }
    lastEnd = i;
    for (let i = 0; i < span; i++) {
        out += " ";
    }
    return out;
}

/** Like magic-string but with only one feature */
export default class BlankString {
    /** @type {string} */
    #input;
    /** @type {number[]} */
    #ranges = [];

    /**
     * @param {string} input
     */
    constructor(input) {
        this.#input = input;
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithArrow(start, end) {
        this.#ranges.push(FLAG_ARROW, start, end);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithCommaOperator(start, end) {
        this.#ranges.push(FLAG_COMMA, start, end);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blank(start, end) {
        this.#ranges.push(0, start, end);
    }

    /**
     * @returns {string}
     */
    toString() {
        const ranges = this.#ranges;
        const input = this.#input;
        if (ranges.length === 0) {
            return input;
        }

        let flags = ranges[0];
        let previousStart = ranges[1];
        let previousEnd = ranges[2];
        let extra = "";
        const extraArrow = "=>";
        const extraComma = " 0,";
        if (flags & FLAG_ARROW) {
            extra = extraArrow;
        }
        else if (flags & FLAG_COMMA) {
            extra = extraComma;
        }
        let out = input.slice(0, previousStart);
        out += extra;
        extra = "";

        out += getSpace(input, previousStart, previousEnd);
        previousEnd = max(previousEnd, lastEnd);

        if (ranges.length === 3) {
            return out + input.slice(previousEnd);
        }

        for (let i = 3; i < ranges.length; i += 3) {
            flags = ranges[i];
            let rangeStart = ranges[i+1];
            const rangeEnd = ranges[i+2];

            if (flags & FLAG_ARROW) {
                extra = extraArrow;
            }
            else if (flags & FLAG_COMMA) {
                extra = extraComma;
            }

            rangeStart = max(rangeStart, previousEnd);
            out += input.slice(previousEnd, rangeStart);
            out += extra;
            extra = "";
            out += getSpace(input, rangeStart, rangeEnd);
            previousStart = rangeStart;
            previousEnd = max(previousEnd, lastEnd);
        }

        return out + input.slice(previousEnd);
    }
}
