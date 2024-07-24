// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check

const max = Math.max;

const FLAG_ARROW = 1;
const FLAG_COMMA = 2;
const FLAG_REPLACE_WITH_ZERO_OR = 4;
const FLAG_SEMI = 8;

/**
 * @param {string} input
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function getSpace(input, start, end) {
    let out = "";

    for (let i = start; i < end; i++) {
        let charCode = /** @type {number} */(input.charCodeAt(i));
        switch (charCode) {
            case 10 /* \n */:
                out += "\n";
                break;
            case 13 /* \r */:
                out += "\r";
                break;
            default:
                out += " ";
                if ((charCode & 0xF800) == 0xD800) {
                    // Surrogate pair
                    out += " ";
                    i++;
                }
        }
    }

    return out;
}

/** Like magic-string but with only one feature */
export default class BlankString {
    /**
     * @param {string} input
     */
    constructor(input) {
        /** @type {string} */
        this.__input = input;
        /** @type {number[]} */
        this.__ranges = [];
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithArrow(start, end) {
        this.__ranges.push(FLAG_ARROW, start, end);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithCommaOperator(start, end) {
        this.__ranges.push(FLAG_COMMA, start, end);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButReplaceStartWithZeroOR(start, end) {
        this.__ranges.push(FLAG_REPLACE_WITH_ZERO_OR, start, end);
    }

    /**
     * @param {number} pos
     */
    insertSemiColon(pos) {
        this.__ranges.push(FLAG_SEMI, pos, pos);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blank(start, end) {
        this.__ranges.push(0, start, end);
    }

    /**
     * @returns {string}
     */
    toString() {
        const ranges = this.__ranges;
        const input = this.__input;
        if (ranges.length === 0) {
            return input;
        }

        let flags = ranges[0];
        let previousStart = ranges[1];
        let previousEnd = ranges[2];
        let extra = "";
        const extraArrow = "=>";
        const extraComma = " 0,";
        const extraZeroOR = "0||";
        const extraSemi = ";";
        let startOffset = 0;
        if (flags & FLAG_ARROW) {
            extra = extraArrow;
        }
        else if (flags & FLAG_COMMA) {
            extra = extraComma;
        }
        else if (flags & FLAG_REPLACE_WITH_ZERO_OR) {
            startOffset = extraZeroOR.length;
            extra = extraZeroOR;
        }
        else if (flags & FLAG_SEMI) {
            extra = extraSemi;
        }
        let out = input.slice(0, previousStart);
        out += extra;
        extra = "";

        out += getSpace(input, previousStart + startOffset, previousEnd);
        startOffset = 0;

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
            else if (flags & FLAG_REPLACE_WITH_ZERO_OR) {
                extra = extraZeroOR;
                startOffset = extraZeroOR.length;
            } else if (flags & FLAG_SEMI) {
                extra = extraSemi;
            }

            rangeStart = max(rangeStart, previousEnd);
            out += input.slice(previousEnd, rangeStart);
            out += extra;
            extra = "";
            previousStart = rangeStart + startOffset;
            previousEnd = rangeEnd;
            startOffset = 0;
            out += getSpace(input, previousStart, previousEnd);
        }

        return out + input.slice(previousEnd);
    }
}
