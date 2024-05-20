// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check

/**
 * @param {string} input
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function getSpace(input, start, end) {
    let span = 0;
    let out = "";
    for (let i = start; i < end; i++) {
        switch (input.codePointAt(i)) {
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
        }
    }
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
        this.#ranges.push(-start, end);
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

        let previousStart = ranges[0];
        let previousEnd = ranges[1];
        let extra = "";
        if (shouldInsertArrow(previousStart)) {
            previousStart = -previousStart;
            extra = "=>";
        }
        let out = input.slice(0, previousStart);
        out += extra;
        extra = "";

        out += getSpace(input, previousStart, previousEnd);

        if (ranges.length === 2) {
            return out + input.slice(previousEnd);
        }

        for (let i = 2; i < ranges.length; i += 2) {
            let rangeStart = ranges[i];
            const rangeEnd = ranges[i+1];

            if (shouldInsertArrow(rangeStart)) {
                rangeStart = -rangeStart;
                extra = "=>";
            }

            out += input.slice(previousEnd, rangeStart);
            out += extra;
            extra = "";
            out += getSpace(input, rangeStart, rangeEnd);
            previousStart = rangeStart;
            previousEnd = rangeEnd;
        }

        return out + input.slice(previousEnd);
    }
}

/**
 * @param {number} start
 * @returns {boolean}
 */
function shouldInsertArrow(start) {
    // If the negative bit is set, then we also need to insert `=>`
    // (we can ignore -0)
    return start < 0;
}
