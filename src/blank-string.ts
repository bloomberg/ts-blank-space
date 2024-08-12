// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
const FLAG_REPLACE_WITH_CLOSE_PAREN = 1;
const FLAG_REPLACE_WITH_SEMI = 2;

function getSpace(input: string, start: number, end: number): string {
    let out = "";

    for (let i = start; i < end; i++) {
        const charCode = input.charCodeAt(i);
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
    declare __input: string;
    declare __ranges: number[];
    constructor(input: string) {
        this.__input = input;
        this.__ranges = [];
    }

    blankButEndWithCloseParen(start: number, end: number): void {
        this.__ranges.push(0, start, end - 1);
        this.__ranges.push(FLAG_REPLACE_WITH_CLOSE_PAREN, end - 1, end);
    }

    blankButStartWithSemi(start: number, end: number): void {
        this.__ranges.push(FLAG_REPLACE_WITH_SEMI, start, end);
    }

    blank(start: number, end: number): void {
        this.__ranges.push(0, start, end);
    }

    toString(): string {
        const ranges = this.__ranges;
        const input = this.__input;
        if (ranges.length === 0) {
            return input;
        }

        let flags = ranges[0];
        let previousStart = ranges[1];
        let previousEnd = ranges[2];
        let out = input.slice(0, previousStart);

        if (flags === FLAG_REPLACE_WITH_CLOSE_PAREN) {
            out += ")";
            previousStart += 1;
        }
        else if (flags === FLAG_REPLACE_WITH_SEMI) {
            out += ";";
            previousStart += 1;
        }

        out += getSpace(input, previousStart, previousEnd);

        if (ranges.length === 3) {
            return out + input.slice(previousEnd);
        }

        const max = Math.max;
        for (let i = 3; i < ranges.length; i += 3) {
            flags = ranges[i];
            let rangeStart = ranges[i+1];
            const rangeEnd = ranges[i+2];

            rangeStart = max(rangeStart, previousEnd);
            out += input.slice(previousEnd, rangeStart);

            if (flags === FLAG_REPLACE_WITH_CLOSE_PAREN) {
                out += ")";
                rangeStart += 1;
            }
            else if (flags === FLAG_REPLACE_WITH_SEMI) {
                out += ";";
                rangeStart += 1;
            }

            previousStart = rangeStart;
            previousEnd = rangeEnd;
            out += getSpace(input, previousStart, previousEnd);
        }

        return out + input.slice(previousEnd);
    }
}
