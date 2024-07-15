/** Like magic-string but with only one feature */
export default class BlankString {
    /**
     * @param {string} input
     */
    constructor(input: string);
    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithArrow(start: number, end: number): void;
    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blankButStartWithCommaOperator(start: number, end: number): void;
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
    #private;
}
