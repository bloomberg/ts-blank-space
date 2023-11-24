// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check
/**
 * @param {[number, number]} a
 * @param {[number, number]} b
 */
function sortHead(a, b) {
    return a[0] - b[0];
}

/**
 * @param {string} input
 * @param {number} start
 * @param {number} end
 */
function getSpace(input, start, end) {
    return input.slice(start, end).replace(/[^\t\r\n]/g, " ");
}

/** Like magic-string but with only one feature */
export default class BlankString {
    /** @type {string} */
    #input;
    /** @type {[number, number][]} */
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
    blank(start, end) {
        this.#ranges.push([start, end]);
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

        if (ranges.length === 1) {
            const [start, end] = ranges[0];
            return input.slice(0, start) +
                getSpace(input, start, end) +
                input.slice(end);
        }

        ranges.sort(sortHead);

        let previousRange = ranges[0];
        let out = input.slice(0, previousRange[0]);
        out += " ".repeat(previousRange[1] - previousRange[0]);

        for (let i = 1; i < ranges.length; i++) {
            const range = ranges[i];
            if (previousRange[1] > range[0]) {
                throw new Error(`overlapping ranges (${previousRange})+(${range})`);
            }
            out += input.slice(previousRange[1], range[0]);
            out += getSpace(input, range[0], range[1]);
            previousRange = range;
        }

        return out + input.slice(previousRange[1]);
    }
}