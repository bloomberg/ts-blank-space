// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// TODO: drop magic-string dependency
import MagicString from "magic-string";

/** Like magic-string but with only one feature */
export default class BlankString {
    #ms;

    /**
     * @param {string} input
     */
    constructor(input) {
        this.#ms = new MagicString(input);
    }

    /**
     * @param {number} start
     * @param {number} end
     * @returns {void}
     */
    blank(start, end) {
        // TODO: implement this without magic-string, and maybe cache whitespace generation
        this.#ms.overwrite(start, end, " ".repeat(end - start));
    }

    toString() {
        return this.#ms.toString();
    }
}