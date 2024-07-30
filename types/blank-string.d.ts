/** Like magic-string but with only one feature */
export default class BlankString {
    /**
     * @param {string} input
     */
    constructor(input: string);
    /** @type {string} */
    __input: string;
    /** @type {number[]} */
    __ranges: number[];
    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButEndWithCloseParen(start: number, end: number): void;
    /**
     * @param {number} start
     * @param {number} end
     */
    blankButStartWithSemi(start: number, end: number): void;
    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blank(start: number, end: number): void;
    /**
     * @returns {string}
     */
    toString(): string;
}
