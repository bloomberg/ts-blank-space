// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check

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
    blank(start, end) {
        this.#ranges.push(start, end);
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

        if (ranges.length === 2) {
            const [start, end] = ranges;
            return input.slice(0, start) +
                getSpace(input, start, end) +
                input.slice(end);
        }

        let previousStart = ranges[0];
        let previousEnd = ranges[1];
        let out = input.slice(0, previousStart);
        out += getSpace(input, previousStart, previousEnd);

        for (let i = 2; i < ranges.length; i += 2) {
            const rangeStart = ranges[i];
            const rangeEnd = ranges[i+1];
            out += input.slice(previousEnd, rangeStart);
            out += getSpace(input, rangeStart, rangeEnd);
            previousStart = rangeStart;
            previousEnd = rangeEnd;
        }

        return out + input.slice(previousEnd);
    }
}
